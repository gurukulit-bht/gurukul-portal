import { Router } from "express";
import { db } from "@workspace/db";
import {
  attendanceRecordsTable, courseLevelsTable, coursesTable,
  studentsTable, teachersTable, teacherAssignmentsTable,
  sectionAssignmentsTable, courseSectionsTable,
} from "@workspace/db/schema";
import { and, eq, or, sql } from "drizzle-orm";

const router = Router();

/** Strips all non-digit characters from a phone string. */
function digitsOnly(s: string) { return s.replace(/\D/g, ""); }

type Assignment = { courseId: number; levelFrom: number; levelTo: number };

/**
 * Returns the set of course-level IDs this teacher may access.
 * Combines two sources:
 *   1. teacher_assignments  — course + level-range rows
 *   2. section_assignments  — specific sections the teacher is assigned to
 * Returns null if no teacher record found (admin fallback → show all).
 */
async function getAllowedLevelIds(
  email?: string,
  phone?: string,
  allLevels?: { id: number; courseId: number; levelNumber: number }[],
): Promise<Set<number> | null> {
  if (!email && !phone) return null;

  const conditions = [];
  if (email) conditions.push(eq(teachersTable.email, email));
  if (phone) conditions.push(
    eq(sql`regexp_replace(${teachersTable.phone}, '[^0-9]', '', 'g')`, digitsOnly(phone))
  );

  const [teacher] = await db
    .select({ id: teachersTable.id })
    .from(teachersTable)
    .where(or(...conditions));
  if (!teacher) return null;

  const allowed = new Set<number>();

  // ── 1. teacher_assignments (course + level range) ───────────────────────────
  const rangeRows = await db
    .select({
      courseId:  teacherAssignmentsTable.courseId,
      levelFrom: teacherAssignmentsTable.levelFrom,
      levelTo:   teacherAssignmentsTable.levelTo,
    })
    .from(teacherAssignmentsTable)
    .where(eq(teacherAssignmentsTable.teacherId, teacher.id));

  if (rangeRows.length > 0 && allLevels) {
    for (const lvl of allLevels) {
      if (rangeRows.some(
        (a: Assignment) =>
          a.courseId === lvl.courseId &&
          lvl.levelNumber >= a.levelFrom &&
          lvl.levelNumber <= a.levelTo
      )) {
        allowed.add(lvl.id);
      }
    }
  }

  // ── 2. section_assignments (specific section → level) ───────────────────────
  const sectionRows = await db
    .select({ courseLevelId: courseSectionsTable.courseLevelId })
    .from(sectionAssignmentsTable)
    .innerJoin(courseSectionsTable, eq(courseSectionsTable.id, sectionAssignmentsTable.sectionId))
    .where(eq(sectionAssignmentsTable.teacherId, teacher.id));

  for (const row of sectionRows) {
    allowed.add(row.courseLevelId);
  }

  return allowed;
}

// GET /api/admin/attendance/levels — course levels with course names (for dropdown)
router.get("/levels", async (req, res) => {
  const role  = req.headers["x-user-role"]  as string | undefined;
  const email = req.headers["x-user-email"] as string | undefined;
  const phone = req.headers["x-user-phone"] as string | undefined;

  // Fetch all levels first (needed to resolve range-based assignments)
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

  let filtered = levels;

  if (role === "teacher" || role === "assistant") {
    const allowedIds = await getAllowedLevelIds(email, phone, levels);
    if (allowedIds !== null) {
      filtered = levels.filter(l => allowedIds.has(l.id));
    }
  }

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
