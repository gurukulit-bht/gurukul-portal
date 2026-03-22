import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  studentsTable,
  enrollmentsTable,
  courseLevelsTable,
  coursesTable,
  paymentsTable,
} from "@workspace/db/schema";
import { eq, asc } from "drizzle-orm";

const router: IRouter = Router();

/**
 * Returns one row per enrollment, not one row per student.
 * A student enrolled in two courses will appear twice — once
 * for each enrollment with its own payment record.
 */
async function buildStudentList() {
  const rows = await db
    .select({
      studentCode:   studentsTable.studentCode,
      studentName:   studentsTable.name,
      parentName:    studentsTable.parentName,
      email:         studentsTable.email,
      phone:         studentsTable.phone,
      enrollmentId:  enrollmentsTable.id,
      enrollDate:    enrollmentsTable.enrollDate,
      enrollStatus:  enrollmentsTable.status,
      levelNumber:   courseLevelsTable.levelNumber,
      schedule:      courseLevelsTable.schedule,
      courseName:    coursesTable.name,
      paymentStatus: paymentsTable.paymentStatus,
      amountDue:     paymentsTable.amountDue,
      amountPaid:    paymentsTable.amountPaid,
      paymentMethod: paymentsTable.paymentMethod,
      receiptId:     paymentsTable.receiptId,
    })
    .from(studentsTable)
    .leftJoin(enrollmentsTable, eq(enrollmentsTable.studentId, studentsTable.id))
    .leftJoin(courseLevelsTable, eq(courseLevelsTable.id, enrollmentsTable.courseLevelId))
    .leftJoin(coursesTable, eq(coursesTable.id, courseLevelsTable.courseId))
    .leftJoin(paymentsTable, eq(paymentsTable.enrollmentId, enrollmentsTable.id))
    .orderBy(asc(studentsTable.studentCode), asc(enrollmentsTable.id));

  return rows.map((r) => ({
    id:            r.studentCode,
    name:          r.studentName,
    parentName:    r.parentName,
    course:        r.courseName ?? "",
    level:         r.levelNumber != null ? `Level ${r.levelNumber}` : "",
    timing:        r.schedule ?? "",
    enrollDate:    r.enrollDate ?? "",
    paymentStatus: (r.paymentStatus ?? "Pending") as "Paid" | "Pending" | "Overdue",
    amountDue:     parseFloat(r.amountDue ?? "150"),
    amountPaid:    parseFloat(r.amountPaid ?? "0"),
    paymentMethod: r.paymentMethod ?? "-",
    receiptId:     r.receiptId ?? "-",
  }));
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
