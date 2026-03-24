import { Router } from "express";
import { db } from "@workspace/db";
import {
  attendanceRecordsTable, courseLevelsTable, coursesTable,
  studentsTable, teachersTable, teacherAssignmentsTable,
} from "@workspace/db/schema";
import { and, eq, inArray, or, sql } from "drizzle-orm";

const router = Router();

/** Strips all non-digit characters from a phone string. */
function digitsOnly(s: string) { return s.replace(/\D/g, ""); }

type Assignment = { courseId: number; levelFrom: number; levelTo: number };

/** Returns assignments for the teacher matched by email OR phone (digits-normalized). */
async function getTeacherAssignments(email?: string, phone?: string): Promise<Assignment[] | null> {
  if (!email && !phone) return null;

  const conditions = [];
  if (email) conditions.push(eq(teachersTable.email, email));
  // Normalize both sides so "(740) 555-0101" matches "7405550101"
  if (phone) conditions.push(
    eq(sql`regexp_replace(${teachersTable.phone}, '[^0-9]', '', 'g')`, digitsOnly(phone))
  );

  const [teacher] = await db
    .select({ id: teachersTable.id })
    .from(teachersTable)
    .where(or(...conditions));
  if (!teacher) return null;

  const rows = await db
    .select({
      courseId:  teacherAssignmentsTable.courseId,
      levelFrom: teacherAssignmentsTable.levelFrom,
      levelTo:   teacherAssignmentsTable.levelTo,
    })
    .from(teacherAssignmentsTable)
    .where(eq(teacherAssignmentsTable.teacherId, teacher.id));
  return rows;
}

// GET /api/admin/attendance/levels — course levels with course names (for dropdown)
router.get("/levels", async (req, res) => {
  const role  = req.headers["x-user-role"]  as string | undefined;
  const email = req.headers["x-user-email"] as string | undefined;
  const phone = req.headers["x-user-phone"] as string | undefined;

  let assignments: Assignment[] | undefined;
  if (role === "teacher" || role === "assistant") {
    const rows = await getTeacherAssignments(email, phone);
    if (rows !== null) assignments = rows;
  }

  const levels = await db
    .select({
      id:          courseLevelsTable.id,
      className:   courseLevelsTable.className,
      schedule:    courseLevelsTable.schedule,
      courseName:  coursesTable.name,
      courseId:    coursesTable.id,
      levelNumber: courseLevelsTable.levelNumber,
    })
    .from(courseLevelsTable)
    .innerJoin(coursesTable, eq(courseLevelsTable.courseId, coursesTable.id))
    .orderBy(coursesTable.name, courseLevelsTable.levelNumber);

  const filtered = assignments !== undefined
    ? levels.filter((l) =>
        assignments!.some(
          (a) =>
            a.courseId === l.courseId &&
            l.levelNumber >= a.levelFrom &&
            l.levelNumber <= a.levelTo
        )
      )
    : levels;

  return res.json(filtered.map(({ levelNumber: _n, ...rest }) => rest));
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
