import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  teachersTable,
  teacherAssignmentsTable,
  coursesTable,
  courseLevelsTable,
  courseSectionsTable,
} from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

function levelRangeToString(from: number, to: number): string {
  if (from === to) return `Level ${from}`;
  if (from === 1 && to === 7) return "All Levels";
  return `L${from}–L${to}`;
}

function levelNumberFromString(s: string): number {
  const m = s.match(/Level (\d+)/);
  return m ? parseInt(m[1]) : 1;
}

async function buildTeacherList() {
  const teachers = await db.select().from(teachersTable).orderBy(teachersTable.id);

  const assignments = await db
    .select({
      id:                 teacherAssignmentsTable.id,
      teacherId:          teacherAssignmentsTable.teacherId,
      levelFrom:          teacherAssignmentsTable.levelFrom,
      levelTo:            teacherAssignmentsTable.levelTo,
      timing:             teacherAssignmentsTable.timing,
      sectionId:          teacherAssignmentsTable.sectionId,
      assistantTeacherId: teacherAssignmentsTable.assistantTeacherId,
      courseName:         coursesTable.name,
      sectionName:        courseSectionsTable.sectionName,
      sectionSchedule:    courseSectionsTable.schedule,
    })
    .from(teacherAssignmentsTable)
    .leftJoin(coursesTable,         eq(teacherAssignmentsTable.courseId,   coursesTable.id))
    .leftJoin(courseSectionsTable,  eq(teacherAssignmentsTable.sectionId,  courseSectionsTable.id));

  const assistantMap: Record<number, string> = {};
  for (const t of teachers) {
    assistantMap[t.id] = t.name;
  }

  return teachers.map((t) => {
    const asgn = assignments.find((a) => a.teacherId === t.id);
    return {
      id:             t.id,
      name:           t.name,
      email:          t.email,
      phone:          t.phone ?? "",
      category:       t.category,
      status:         t.status,
      assignedCourse: asgn?.courseName ?? "",
      assignedLevel:  asgn ? levelRangeToString(asgn.levelFrom, asgn.levelTo) : "",
      sectionId:      asgn?.sectionId ?? null,
      sectionName:    asgn?.sectionName ?? null,
      sectionSchedule: asgn?.sectionSchedule ?? null,
      assistantTeacherId:   asgn?.assistantTeacherId ?? null,
      assistantTeacherName: asgn?.assistantTeacherId ? (assistantMap[asgn.assistantTeacherId] ?? null) : null,
      assignmentId:   asgn?.id ?? null,
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

// GET /api/admin/teachers/assistants  — returns teachers with category="Assistant"
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
router.post("/", async (req, res) => {
  try {
    const { name, email, phone, category, assignedCourse, assignedLevel, sectionId, assistantTeacherId } = req.body;

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

    if (assignedCourse && assignedLevel) {
      const courses = await db.select().from(coursesTable);
      const course  = courses.find((c) => c.name === assignedCourse);
      if (course) {
        const levelNum = levelNumberFromString(assignedLevel);
        const parsedSectionId        = sectionId ? parseInt(sectionId) : null;
        const parsedAssistantTeacherId = assistantTeacherId ? parseInt(assistantTeacherId) : null;

        await db.insert(teacherAssignmentsTable).values({
          teacherId:          teacher.id,
          courseId:           course.id,
          levelFrom:          levelNum,
          levelTo:            levelNum,
          sectionId:          parsedSectionId,
          assistantTeacherId: parsedAssistantTeacherId,
        });
      }
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
    const { name, email, phone, category, assignedCourse, assignedLevel, sectionId, assistantTeacherId } = req.body;

    await db
      .update(teachersTable)
      .set({ name, email, phone: phone || null, category: category || "Senior Teacher" })
      .where(eq(teachersTable.id, id));

    if (assignedCourse && assignedLevel) {
      const courses = await db.select().from(coursesTable);
      const course  = courses.find((c) => c.name === assignedCourse);

      if (course) {
        const levelNum                 = levelNumberFromString(assignedLevel);
        const parsedSectionId          = sectionId ? parseInt(sectionId) : null;
        const parsedAssistantTeacherId = assistantTeacherId ? parseInt(assistantTeacherId) : null;

        const existingAsgn = await db
          .select()
          .from(teacherAssignmentsTable)
          .where(eq(teacherAssignmentsTable.teacherId, id));

        if (existingAsgn.length > 0) {
          await db
            .update(teacherAssignmentsTable)
            .set({
              courseId:           course.id,
              levelFrom:          levelNum,
              levelTo:            levelNum,
              sectionId:          parsedSectionId,
              assistantTeacherId: parsedAssistantTeacherId,
            })
            .where(eq(teacherAssignmentsTable.teacherId, id));
        } else {
          await db.insert(teacherAssignmentsTable).values({
            teacherId:          id,
            courseId:           course.id,
            levelFrom:          levelNum,
            levelTo:            levelNum,
            sectionId:          parsedSectionId,
            assistantTeacherId: parsedAssistantTeacherId,
          });
        }
      }
    } else {
      await db
        .delete(teacherAssignmentsTable)
        .where(eq(teacherAssignmentsTable.teacherId, id));
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
