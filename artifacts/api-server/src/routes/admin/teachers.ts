import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  teachersTable,
  sectionAssignmentsTable,
  courseSectionsTable,
  courseLevelsTable,
  coursesTable,
} from "@workspace/db/schema";
import { eq, isNull, sql } from "drizzle-orm";

const router: IRouter = Router();

// Build the full teacher list — uses section_assignments as the single source
// of truth for course/section assignments.  The assistant↔teacher pairing is
// stored directly on the teacher row (assistantId).
async function buildTeacherList() {
  const teachers = await db.select().from(teachersTable).orderBy(teachersTable.id);

  const sectionRows = await db
    .select({
      teacherId:   sectionAssignmentsTable.teacherId,
      role:        sectionAssignmentsTable.role,
      sectionId:   courseSectionsTable.id,
      sectionName: courseSectionsTable.sectionName,
      levelName:   courseLevelsTable.className,
      courseName:  coursesTable.name,
    })
    .from(sectionAssignmentsTable)
    .leftJoin(courseSectionsTable, eq(sectionAssignmentsTable.sectionId, courseSectionsTable.id))
    .leftJoin(courseLevelsTable,   eq(courseSectionsTable.courseLevelId,  courseLevelsTable.id))
    .leftJoin(coursesTable,        eq(courseLevelsTable.courseId,          coursesTable.id));

  // Build a lookup: id → name for all teachers (used for assistant/teacher name resolution)
  const nameById = new Map(teachers.map((t) => [t.id, t.name]));

  return teachers.map((t) => {
    const myRows = sectionRows.filter((r) => r.teacherId === t.id);
    const courseNames = [...new Set(myRows.map((r) => r.courseName).filter(Boolean))] as string[];

    // For Teacher rows: which assistant is paired
    const assistantName = t.assistantId ? (nameById.get(t.assistantId) ?? null) : null;

    // For Assistant rows: which teacher they are paired with
    const linkedTeacher = teachers.find(
      (other) => other.category !== "Assistant" && other.assistantId === t.id
    );

    return {
      id:                t.id,
      name:              t.name,
      email:             t.email,
      phone:             t.phone ?? "",
      category:          t.category,
      status:            t.status,
      assistantId:       t.assistantId ?? null,
      assistantName,
      linkedTeacherId:   linkedTeacher?.id   ?? null,
      linkedTeacherName: linkedTeacher?.name ?? null,
      courseNames,
      assignments: myRows.map((r) => ({
        sectionId:   r.sectionId,
        sectionName: r.sectionName,
        levelName:   r.levelName,
        courseName:  r.courseName,
        role:        r.role,
      })),
    };
  });
}

// GET /api/admin/teachers
router.get("/", async (req, res) => {
  try {
    res.json(await buildTeacherList());
  } catch (err) {
    req.log.error({ err }, "Failed to fetch teachers");
    res.status(500).json({ error: "Failed to fetch teachers" });
  }
});

// GET /api/admin/teachers/assistants
router.get("/assistants", async (req, res) => {
  try {
    const rows = await db
      .select({ id: teachersTable.id, name: teachersTable.name })
      .from(teachersTable)
      .where(eq(teachersTable.category, "Assistant"))
      .orderBy(teachersTable.name);
    res.json(rows);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch assistants");
    res.status(500).json({ error: "Failed to fetch assistants" });
  }
});

// POST /api/admin/teachers
// Body: { name, email, phone, category, assistantId? }
//   assistantId  — if category=Teacher, the assistant paired with this teacher
//   linkedTeacherId — if category=Assistant, the teacher to pair with (updates teacher row)
router.post("/", async (req, res) => {
  try {
    const { name, email, phone, category, assistantId, linkedTeacherId } = req.body;

    if (!name?.trim())  return res.status(400).json({ error: "Name is required." });
    if (!email?.trim()) return res.status(400).json({ error: "Email is required." });
    if (!phone?.trim()) return res.status(400).json({ error: "Phone number is required." });

    const isAssistant = category === "Assistant";
    const parsedAssistantId = !isAssistant && assistantId ? parseInt(assistantId) : null;

    const [teacher] = await db
      .insert(teachersTable)
      .values({
        name:        name.trim(),
        email:       email.trim(),
        phone:       phone.trim(),
        category:    category || "Teacher",
        status:      "Active",
        assistantId: parsedAssistantId,
      })
      .returning();

    // If creating an assistant and a teacher was selected, update that teacher's assistantId
    if (isAssistant && linkedTeacherId) {
      await db
        .update(teachersTable)
        .set({ assistantId: teacher.id })
        .where(eq(teachersTable.id, parseInt(linkedTeacherId)));
    }

    res.json((await buildTeacherList()).find((t) => t.id === teacher.id));
  } catch (err) {
    req.log.error({ err }, "Failed to create teacher");
    res.status(500).json({ error: "Failed to create teacher" });
  }
});

// PUT /api/admin/teachers/:id
router.put("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, email, phone, category, assistantId, linkedTeacherId } = req.body;

    if (!name?.trim())  return res.status(400).json({ error: "Name is required." });
    if (!email?.trim()) return res.status(400).json({ error: "Email is required." });
    if (!phone?.trim()) return res.status(400).json({ error: "Phone number is required." });

    const isAssistant = category === "Assistant";
    const parsedAssistantId = !isAssistant && assistantId ? parseInt(assistantId) : null;

    await db
      .update(teachersTable)
      .set({
        name:        name.trim(),
        email:       email.trim(),
        phone:       phone.trim(),
        category:    category || "Teacher",
        assistantId: parsedAssistantId,
      })
      .where(eq(teachersTable.id, id));

    // If editing an assistant, sync the teacher pairing:
    // 1. Clear any teacher that currently points to this assistant
    // 2. Set the newly selected teacher to point to this assistant
    if (isAssistant) {
      await db
        .update(teachersTable)
        .set({ assistantId: null })
        .where(sql`${teachersTable.assistantId} = ${id}`);

      if (linkedTeacherId) {
        await db
          .update(teachersTable)
          .set({ assistantId: id })
          .where(eq(teachersTable.id, parseInt(linkedTeacherId)));
      }
    }

    res.json((await buildTeacherList()).find((t) => t.id === id));
  } catch (err) {
    req.log.error({ err }, "Failed to update teacher");
    res.status(500).json({ error: "Failed to update teacher" });
  }
});

// DELETE /api/admin/teachers/:id
router.delete("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(teachersTable).where(eq(teachersTable.id, id));
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Failed to delete teacher");
    res.status(500).json({ error: "Failed to delete teacher" });
  }
});

export default router;
