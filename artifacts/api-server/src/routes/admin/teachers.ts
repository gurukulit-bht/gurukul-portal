import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  teachersTable,
  teacherAssignmentsTable,
  coursesTable,
} from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

function levelRangeToString(from: number, to: number): string {
  if (from === 1 && to === 7) return "All Levels";
  if (from === 1 && to === 3) return "Beginner (L1-L3)";
  if (from === 4 && to === 7) return "Advanced (L4-L7)";
  if (from === to) return `Level ${from}`;
  return `L${from}–L${to}`;
}

function levelRangeFromString(s: string): { levelFrom: number; levelTo: number } {
  if (s === "All Levels") return { levelFrom: 1, levelTo: 7 };
  if (s === "Beginner (L1-L3)") return { levelFrom: 1, levelTo: 3 };
  if (s === "Advanced (L4-L7)") return { levelFrom: 4, levelTo: 7 };
  const m = s.match(/Level (\d+)/);
  if (m) { const n = parseInt(m[1]); return { levelFrom: n, levelTo: n }; }
  return { levelFrom: 1, levelTo: 7 };
}

async function buildTeacherList() {
  const teachers = await db.select().from(teachersTable).orderBy(teachersTable.id);
  const assignments = await db.select({
    id: teacherAssignmentsTable.id,
    teacherId: teacherAssignmentsTable.teacherId,
    levelFrom: teacherAssignmentsTable.levelFrom,
    levelTo: teacherAssignmentsTable.levelTo,
    timing: teacherAssignmentsTable.timing,
    courseName: coursesTable.name,
  })
    .from(teacherAssignmentsTable)
    .leftJoin(coursesTable, eq(teacherAssignmentsTable.courseId, coursesTable.id));

  return teachers.map((t) => {
    const asgn = assignments.find((a) => a.teacherId === t.id);
    return {
      id: t.id,
      name: t.name,
      email: t.email,
      phone: t.phone ?? "",
      status: t.status,
      assignedCourse: asgn?.courseName ?? "",
      assignedLevel: asgn ? levelRangeToString(asgn.levelFrom, asgn.levelTo) : "",
      timing: asgn?.timing ?? "",
      assignmentId: asgn?.id ?? null,
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

// POST /api/admin/teachers
router.post("/", async (req, res) => {
  try {
    const { name, email, phone, status, assignedCourse, assignedLevel, timing } = req.body;
    const [teacher] = await db
      .insert(teachersTable)
      .values({ name, email, phone: phone || null, status: status || "Active" })
      .returning();

    if (assignedCourse) {
      const courses = await db.select().from(coursesTable);
      const course = courses.find((c) => c.name === assignedCourse);
      if (course) {
        const { levelFrom, levelTo } = levelRangeFromString(assignedLevel || "All Levels");
        await db.insert(teacherAssignmentsTable).values({
          teacherId: teacher.id,
          courseId: course.id,
          levelFrom,
          levelTo,
          timing: timing || null,
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
    const { name, email, phone, status, assignedCourse, assignedLevel, timing } = req.body;

    await db
      .update(teachersTable)
      .set({ name, email, phone: phone || null, status })
      .where(eq(teachersTable.id, id));

    const courses = await db.select().from(coursesTable);
    const course = courses.find((c) => c.name === assignedCourse);
    const existingAsgn = await db
      .select()
      .from(teacherAssignmentsTable)
      .where(eq(teacherAssignmentsTable.teacherId, id));

    if (course) {
      const { levelFrom, levelTo } = levelRangeFromString(assignedLevel || "All Levels");
      if (existingAsgn.length > 0) {
        await db
          .update(teacherAssignmentsTable)
          .set({ courseId: course.id, levelFrom, levelTo, timing: timing || null })
          .where(eq(teacherAssignmentsTable.teacherId, id));
      } else {
        await db.insert(teacherAssignmentsTable).values({
          teacherId: id,
          courseId: course.id,
          levelFrom,
          levelTo,
          timing: timing || null,
        });
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
