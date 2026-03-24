import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  teachersTable,
  sectionAssignmentsTable,
  courseSectionsTable,
  courseLevelsTable,
  coursesTable,
} from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

// Build a rich teacher list using section_assignments as the single source of truth
// for where teachers/assistants are assigned.
async function buildTeacherList() {
  const teachers = await db.select().from(teachersTable).orderBy(teachersTable.id);

  const rows = await db
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

  return teachers.map((t) => {
    const myRows = rows.filter((r) => r.teacherId === t.id);
    const courseNames = [...new Set(myRows.map((r) => r.courseName).filter(Boolean))] as string[];
    return {
      id:          t.id,
      name:        t.name,
      email:       t.email,
      phone:       t.phone ?? "",
      category:    t.category,
      status:      t.status,
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

// GET /api/admin/teachers/assistants  — teachers with category="Assistant"
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

// POST /api/admin/teachers — create staff profile only (assignments managed in Course Mgmt)
router.post("/", async (req, res) => {
  try {
    const { name, email, phone, category } = req.body;

    const [teacher] = await db
      .insert(teachersTable)
      .values({
        name,
        email,
        phone:    phone || null,
        category: category || "Senior Teacher",
        status:   "Active",
      })
      .returning();

    res.json((await buildTeacherList()).find((t) => t.id === teacher.id));
  } catch (err) {
    req.log.error({ err }, "Failed to create teacher");
    res.status(500).json({ error: "Failed to create teacher" });
  }
});

// PUT /api/admin/teachers/:id — update staff profile only
router.put("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, email, phone, category } = req.body;

    await db
      .update(teachersTable)
      .set({ name, email, phone: phone || null, category: category || "Senior Teacher" })
      .where(eq(teachersTable.id, id));

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
