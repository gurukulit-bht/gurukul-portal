import { Router } from "express";
import { db } from "@workspace/db";
import { attendanceRecordsTable, courseLevelsTable, coursesTable, studentsTable } from "@workspace/db/schema";
import { and, eq } from "drizzle-orm";

const router = Router();

// GET /api/admin/attendance/levels — course levels with course names (for dropdown)
router.get("/levels", async (_req, res) => {
  const levels = await db
    .select({
      id:         courseLevelsTable.id,
      className:  courseLevelsTable.className,
      schedule:   courseLevelsTable.schedule,
      courseName: coursesTable.name,
    })
    .from(courseLevelsTable)
    .innerJoin(coursesTable, eq(courseLevelsTable.courseId, coursesTable.id))
    .orderBy(coursesTable.name, courseLevelsTable.levelNumber);

  return res.json(levels);
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
