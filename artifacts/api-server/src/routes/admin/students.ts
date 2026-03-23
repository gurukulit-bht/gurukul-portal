import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  studentsTable,
  membersTable,
  enrollmentsTable,
  courseLevelsTable,
  coursesTable,
  courseSectionsTable,
  paymentsTable,
} from "@workspace/db/schema";
import { eq, asc, and, desc, sql } from "drizzle-orm";

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
      enrollmentId:  enrollmentsTable.id,
      enrollDate:    enrollmentsTable.enrollDate,
      enrollStatus:  enrollmentsTable.status,
      levelNumber:   courseLevelsTable.levelNumber,
      schedule:      courseLevelsTable.schedule,
      courseName:    coursesTable.name,
      sectionName:   courseSectionsTable.sectionName,
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
    .leftJoin(courseSectionsTable, eq(courseSectionsTable.id, enrollmentsTable.sectionId))
    .leftJoin(paymentsTable, eq(paymentsTable.enrollmentId, enrollmentsTable.id))
    .orderBy(asc(studentsTable.studentCode), asc(enrollmentsTable.id));

  return rows.map((r) => ({
    id:            r.studentCode,
    name:          r.studentName,
    course:        r.courseName ?? "",
    level:         r.levelNumber != null ? `Level ${r.levelNumber}` : "",
    section:       r.sectionName ?? "",
    timing:        r.schedule ?? "",
    enrollDate:    r.enrollDate ?? "",
    paymentStatus: (r.paymentStatus ?? "Pending") as "Paid" | "Pending" | "Overdue",
    amountDue:     parseFloat(r.amountDue ?? "150"),
    amountPaid:    parseFloat(r.amountPaid ?? "0"),
    paymentMethod: r.paymentMethod ?? "-",
    receiptId:     r.receiptId ?? "-",
  }));
}

// GET /api/admin/students/meta  — returns next student code + available courses/levels/sections
router.get("/meta", async (req, res) => {
  try {
    // Next student code
    const [last] = await db
      .select({ code: studentsTable.studentCode })
      .from(studentsTable)
      .orderBy(desc(studentsTable.id))
      .limit(1);

    let nextNum = 1;
    if (last?.code) {
      const m = last.code.match(/(\d+)$/);
      if (m) nextNum = parseInt(m[1]) + 1;
    }
    const nextCode = `GK-${String(nextNum).padStart(3, "0")}`;

    // All active courses with their levels and sections
    const rows = await db
      .select({
        courseId:    coursesTable.id,
        courseName:  coursesTable.name,
        courseIcon:  coursesTable.icon,
        levelId:     courseLevelsTable.id,
        levelNumber: courseLevelsTable.levelNumber,
        className:   courseLevelsTable.className,
        sectionId:   courseSectionsTable.id,
        sectionName: courseSectionsTable.sectionName,
        schedule:    courseSectionsTable.schedule,
      })
      .from(coursesTable)
      .innerJoin(courseLevelsTable, eq(courseLevelsTable.courseId, coursesTable.id))
      .leftJoin(courseSectionsTable, eq(courseSectionsTable.courseLevelId, courseLevelsTable.id))
      .where(sql`${coursesTable.archivedAt} is null`)
      .orderBy(asc(coursesTable.name), asc(courseLevelsTable.levelNumber), asc(courseSectionsTable.sectionName));

    // Nest into courses → levels → sections
    const courseMap = new Map<number, { id: number; name: string; icon: string; levels: Map<number, { id: number; levelNumber: number; className: string; sections: { id: number; sectionName: string; schedule: string }[] }> }>();
    for (const r of rows) {
      if (!courseMap.has(r.courseId)) {
        courseMap.set(r.courseId, { id: r.courseId, name: r.courseName, icon: r.courseIcon ?? "", levels: new Map() });
      }
      const course = courseMap.get(r.courseId)!;
      if (!course.levels.has(r.levelId)) {
        course.levels.set(r.levelId, { id: r.levelId, levelNumber: r.levelNumber, className: r.className, sections: [] });
      }
      if (r.sectionId) {
        course.levels.get(r.levelId)!.sections.push({ id: r.sectionId, sectionName: r.sectionName!, schedule: r.schedule ?? "" });
      }
    }

    const courses = Array.from(courseMap.values()).map(c => ({
      ...c,
      levels: Array.from(c.levels.values()),
    }));

    res.json({ nextCode, courses });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch student meta");
    res.status(500).json({ error: "Failed to fetch student meta" });
  }
});

// POST /api/admin/students — register a new student with optional enrollments
router.post("/", async (req, res) => {
  try {
    const {
      studentCode, firstName, lastName, dob, grade, isNewStudent,
      memberId,
      motherName, motherPhone, motherEmail, motherEmployer,
      fatherName, fatherPhone, fatherEmail, fatherEmployer,
      address,
      volunteerParent, volunteerArea,
      enrollments = [],
    } = req.body as {
      studentCode?: string;
      firstName: string; lastName: string;
      dob?: string; grade?: string; isNewStudent?: boolean;
      memberId?: number;
      motherName?: string; motherPhone?: string; motherEmail?: string; motherEmployer?: string;
      fatherName?: string; fatherPhone?: string; fatherEmail?: string; fatherEmployer?: string;
      address?: string;
      volunteerParent?: boolean; volunteerArea?: string;
      enrollments: { courseLevelId: number; sectionId?: number | null; enrollDate?: string; amountDue?: string }[];
    };

    if (!firstName?.trim() || !lastName?.trim()) {
      return res.status(400).json({ error: "First name and last name are required" });
    }

    // Auto-generate code if not provided
    let code = studentCode?.trim();
    if (!code) {
      const [last] = await db
        .select({ code: studentsTable.studentCode })
        .from(studentsTable)
        .orderBy(desc(studentsTable.id))
        .limit(1);
      let num = 1;
      if (last?.code) { const m = last.code.match(/(\d+)$/); if (m) num = parseInt(m[1]) + 1; }
      code = `GK-${String(num).padStart(3, "0")}`;
    }

    const [student] = await db.insert(studentsTable).values({
      studentCode:    code,
      name:           `${firstName.trim()} ${lastName.trim()}`,
      dob:            dob || null,
      grade:          grade || null,
      isNewStudent:   isNewStudent ?? true,
      memberId:       memberId ?? null,
      motherName:     motherName?.trim() || null,
      motherPhone:    motherPhone?.trim() || null,
      motherEmail:    motherEmail?.trim() || null,
      motherEmployer: motherEmployer?.trim() || null,
      fatherName:     fatherName?.trim() || null,
      fatherPhone:    fatherPhone?.trim() || null,
      fatherEmail:    fatherEmail?.trim() || null,
      fatherEmployer: fatherEmployer?.trim() || null,
      address:        address?.trim() || null,
      volunteerParent: volunteerParent ?? false,
      volunteerArea:   volunteerArea?.trim() || null,
    }).returning({ id: studentsTable.id, studentCode: studentsTable.studentCode });

    // Insert enrollments + payments
    for (const enr of enrollments) {
      if (!enr.courseLevelId) continue;
      const [enrollment] = await db.insert(enrollmentsTable).values({
        studentId:    student.id,
        courseLevelId: enr.courseLevelId,
        sectionId:    enr.sectionId ?? null,
        enrollDate:   enr.enrollDate ?? new Date().toISOString().slice(0, 10),
      }).returning({ id: enrollmentsTable.id });

      await db.insert(paymentsTable).values({
        enrollmentId:  enrollment.id,
        amountDue:     enr.amountDue ?? "35.00",
        amountPaid:    "0.00",
        paymentStatus: "Pending",
      });
    }

    res.status(201).json({ success: true, studentCode: student.studentCode, studentId: student.id });
  } catch (err: unknown) {
    req.log.error({ err }, "Failed to register student");
    const msg = err instanceof Error ? err.message : "Failed to register student";
    res.status(500).json({ error: msg });
  }
});

// DELETE /api/admin/students/:code — remove a student by student code
router.delete("/:code", async (req, res) => {
  try {
    const [student] = await db
      .select({ id: studentsTable.id })
      .from(studentsTable)
      .where(eq(studentsTable.studentCode, req.params.code));

    if (!student) return res.status(404).json({ error: "Student not found" });

    await db.delete(studentsTable).where(eq(studentsTable.id, student.id));
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Failed to delete student");
    res.status(500).json({ error: "Failed to delete student" });
  }
});

// GET /api/admin/students
router.get("/", async (req, res) => {
  try {
    res.json(await buildStudentList());
  } catch (err) {
    req.log.error({ err }, "Failed to fetch students");
    res.status(500).json({ error: "Failed to fetch students" });
  }
});

// PATCH /api/admin/students/enrollments/:id/section
// Assigns (or unassigns) a student enrollment to a specific section.
// Body: { sectionId: number | null }
router.patch("/enrollments/:id/section", async (req, res) => {
  try {
    const enrollmentId = parseInt(req.params.id);
    const { sectionId } = req.body as { sectionId: number | null };

    if (isNaN(enrollmentId)) {
      return res.status(400).json({ error: "Invalid enrollment ID" });
    }

    // Load the enrollment to get its courseLevelId
    const [enrollment] = await db
      .select({ courseLevelId: enrollmentsTable.courseLevelId })
      .from(enrollmentsTable)
      .where(eq(enrollmentsTable.id, enrollmentId));

    if (!enrollment) {
      return res.status(404).json({ error: "Enrollment not found" });
    }

    // If assigning to a section, validate the section belongs to the same level
    if (sectionId != null) {
      const [section] = await db
        .select({ courseLevelId: courseSectionsTable.courseLevelId })
        .from(courseSectionsTable)
        .where(eq(courseSectionsTable.id, sectionId));

      if (!section) return res.status(404).json({ error: "Section not found" });

      if (section.courseLevelId !== enrollment.courseLevelId) {
        return res.status(400).json({ error: "Section does not belong to this enrollment's level" });
      }
    }

    await db
      .update(enrollmentsTable)
      .set({ sectionId: sectionId ?? null })
      .where(eq(enrollmentsTable.id, enrollmentId));

    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Failed to update enrollment section");
    res.status(500).json({ error: "Failed to update enrollment section" });
  }
});

export default router;
