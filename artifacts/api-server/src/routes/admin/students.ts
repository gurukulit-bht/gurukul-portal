import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  studentsTable,
  enrollmentsTable,
  courseLevelsTable,
  coursesTable,
  paymentsTable,
} from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

async function buildStudentList() {
  const students = await db.select().from(studentsTable).orderBy(studentsTable.studentCode);
  const enrollments = await db.select().from(enrollmentsTable);
  const courseLevels = await db.select().from(courseLevelsTable);
  const courses = await db.select().from(coursesTable);
  const payments = await db.select().from(paymentsTable);

  const courseMap: Record<number, string> = {};
  courses.forEach((c) => { courseMap[c.id] = c.name; });

  const levelMap: Record<number, { levelNumber: number; schedule: string; courseId: number }> = {};
  courseLevels.forEach((l) => {
    levelMap[l.id] = { levelNumber: l.levelNumber, schedule: l.schedule ?? "", courseId: l.courseId };
  });

  const paymentMap: Record<number, typeof payments[0]> = {};
  payments.forEach((p) => { paymentMap[p.enrollmentId] = p; });

  return students.map((s) => {
    const enrollment = enrollments.find((e) => e.studentId === s.id);
    const level = enrollment ? levelMap[enrollment.courseLevelId] : null;
    const payment = enrollment ? paymentMap[enrollment.id] : null;
    const courseName = level ? courseMap[level.courseId] : "";

    return {
      id: s.studentCode,
      dbId: s.id,
      name: s.name,
      parentName: s.parentName,
      course: courseName,
      level: level ? `Level ${level.levelNumber}` : "",
      timing: level?.schedule ?? "",
      enrollDate: enrollment?.enrollDate ?? "",
      paymentStatus: payment?.paymentStatus ?? "Pending",
      amountDue: parseFloat(payment?.amountDue ?? "150"),
      amountPaid: parseFloat(payment?.amountPaid ?? "0"),
      paymentMethod: payment?.paymentMethod ?? "-",
      receiptId: payment?.receiptId ?? "-",
    };
  });
}

// GET /api/admin/students
router.get("/", async (req, res) => {
  try {
    res.json(await buildStudentList());
  } catch (err) {
    req.log.error({ err }, "Failed to fetch students");
    res.status(500).json({ error: "Failed to fetch students" });
  }
});

export default router;
