import { Router } from "express";
import { db } from "@workspace/db";
import {
  attendanceRecordsTable, courseLevelsTable, coursesTable,
  studentsTable, teachersTable, teacherAssignmentsTable,
} from "@workspace/db/schema";
import { and, eq, inArray } from "drizzle-orm";

const router = Router();

/** Returns course IDs assigned to the given teacher email, or null if not found. */
async function getTeacherCourseIds(email: string): Promise<number[] | null> {
  const [teacher] = await db
    .select({ id: teachersTable.id })
    .from(teachersTable)
    .where(eq(teachersTable.email, email));
  if (!teacher) return null;
  const rows = await db
    .select({ courseId: teacherAssignmentsTable.courseId })
    .from(teacherAssignmentsTable)
    .where(eq(teacherAssignmentsTable.teacherId, teacher.id));
  return rows.map((r) => r.courseId);
}

// GET /api/admin/attendance/levels — course levels with course names (for dropdown)
router.get("/levels", async (req, res) => {
  const role  = req.headers["x-user-role"]  as string | undefined;
  const email = req.headers["x-user-email"] as string | undefined;

  let courseIds: number[] | undefined;
  if ((role === "teacher" || role === "assistant") && email) {
    const ids = await getTeacherCourseIds(email);
    if (ids !== null) courseIds = ids;
  }

  const query = db
    .select({
      id:         courseLevelsTable.id,
      className:  courseLevelsTable.className,
      schedule:   courseLevelsTable.schedule,
      courseName: coursesTable.name,
      courseId:   coursesTable.id,
    })
    .from(courseLevelsTable)
    .innerJoin(coursesTable, eq(courseLevelsTable.courseId, coursesTable.id));

  const levels = await query.orderBy(coursesTable.name, courseLevelsTable.levelNumber);

  const filtered = courseIds !== undefined
    ? levels.filter((l) => courseIds!.includes(l.courseId))
    : levels;

  return res.json(filtered.map(({ courseId: _c, ...rest }) => rest));
});

// GET /api/admin/attendance/history?levelId=X
router.get("/history", async (req, res) => {
  const levelId = Number(req.query.levelId);
  if (!levelId) return res.status(400).json({ error: "levelId is required" });

  const rows = await db
    .select({
      id:          attendanceRecordsTable.id,
      studentId:   attendanceRecordsTable.studentId,
      studentName: studentsTable.name,
      studentCode: studentsTable.studentCode,
      date:        attendanceRecordsTable.date,
      status:      attendanceRecordsTable.status,
      recordedBy:  attendanceRecordsTable.recordedBy,
    })
    .from(attendanceRecordsTable)
    .innerJoin(studentsTable, eq(attendanceRecordsTable.studentId, studentsTable.id))
    .where(eq(attendanceRecordsTable.courseLevelId, levelId))
    .orderBy(attendanceRecordsTable.date, studentsTable.name);

  return res.json(rows);
});

// GET /api/admin/attendance?levelId=X&date=Y — records for one level+date
router.get("/", async (req, res) => {
  const levelId = Number(req.query.levelId);
  const date    = String(req.query.date ?? "");
  if (!levelId || !date) return res.status(400).json({ error: "levelId and date are required" });

  const rows = await db
    .select({
      id:         attendanceRecordsTable.id,
      studentId:  attendanceRecordsTable.studentId,
      status:     attendanceRecordsTable.status,
      recordedBy: attendanceRecordsTable.recordedBy,
    })
    .from(attendanceRecordsTable)
    .where(
      and(
        eq(attendanceRecordsTable.courseLevelId, levelId),
        eq(attendanceRecordsTable.date, date),
      ),
    );

  return res.json(rows);
});

// POST /api/admin/attendance — upsert all records for (levelId, date)
router.post("/", async (req, res) => {
  const { courseLevelId, date, records, recordedBy } = req.body as {
    courseLevelId: number;
    date:          string;
    records:       { studentId: number; status: "Present" | "Absent" | "Late" }[];
    recordedBy:    string;
  };

  if (!courseLevelId || !date || !Array.isArray(records)) {
    return res.status(400).json({ error: "courseLevelId, date, and records are required" });
  }

  await db
    .delete(attendanceRecordsTable)
    .where(
      and(
        eq(attendanceRecordsTable.courseLevelId, courseLevelId),
        eq(attendanceRecordsTable.date, date),
      ),
    );

  if (records.length > 0) {
    await db.insert(attendanceRecordsTable).values(
      records.map(r => ({
        courseLevelId,
        date,
        studentId:  r.studentId,
        status:     r.status,
        recordedBy: recordedBy ?? "Unknown",
      })),
    );
  }

  return res.json({ success: true, count: records.length });
});

export default router;
