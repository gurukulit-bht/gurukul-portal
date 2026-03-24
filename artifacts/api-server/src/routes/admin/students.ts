import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  studentsTable,
  enrollmentsTable,
  courseLevelsTable,
  coursesTable,
  courseSectionsTable,
  paymentsTable,
} from "@workspace/db/schema";
import { eq, asc, and, desc, sql, inArray } from "drizzle-orm";

const router: IRouter = Router();

async function buildStudentList() {
  const rows = await db
    .select({
      // Student core
      studentId:      studentsTable.id,
      studentCode:    studentsTable.studentCode,
      studentName:    studentsTable.name,
      dob:            studentsTable.dob,
      grade:          studentsTable.grade,
      curriculumYear: studentsTable.curriculumYear,
      isNewStudent:   studentsTable.isNewStudent,
      isActive:       studentsTable.isActive,
      // Parent contacts
      motherName:     studentsTable.motherName,
      motherPhone:    studentsTable.motherPhone,
      motherEmail:    studentsTable.motherEmail,
      fatherName:     studentsTable.fatherName,
      fatherPhone:    studentsTable.fatherPhone,
      fatherEmail:    studentsTable.fatherEmail,
      address:        studentsTable.address,
      createdAt:      studentsTable.createdAt,
      // Enrollment
      enrollmentId:   enrollmentsTable.id,
      enrollDate:     enrollmentsTable.enrollDate,
      enrollStatus:   enrollmentsTable.status,
      levelNumber:    courseLevelsTable.levelNumber,
      schedule:       courseLevelsTable.schedule,
      courseName:     coursesTable.name,
      courseIcon:     coursesTable.icon,
      sectionName:    courseSectionsTable.sectionName,
      sectionId:      courseSectionsTable.id,
      // Payment
      paymentStatus:  paymentsTable.paymentStatus,
      amountDue:      paymentsTable.amountDue,
      amountPaid:     paymentsTable.amountPaid,
      paymentMethod:  paymentsTable.paymentMethod,
      receiptId:      paymentsTable.receiptId,
    })
    .from(studentsTable)
    .leftJoin(enrollmentsTable, eq(enrollmentsTable.studentId, studentsTable.id))
    .leftJoin(courseLevelsTable, eq(courseLevelsTable.id, enrollmentsTable.courseLevelId))
    .leftJoin(coursesTable, eq(coursesTable.id, courseLevelsTable.courseId))
    .leftJoin(courseSectionsTable, eq(courseSectionsTable.id, enrollmentsTable.sectionId))
    .leftJoin(paymentsTable, eq(paymentsTable.enrollmentId, enrollmentsTable.id))
    .orderBy(asc(studentsTable.studentCode), asc(enrollmentsTable.id));

  return rows.map((r) => ({
    id:             r.studentCode,
    studentDbId:    r.studentId,
    name:           r.studentName,
    dob:            r.dob ?? "",
    grade:          r.grade ?? "",
    curriculumYear: r.curriculumYear ?? "",
    isNewStudent:   r.isNewStudent ?? true,
    isActive:       r.isActive ?? true,
    motherName:     r.motherName ?? "",
    motherPhone:    r.motherPhone ?? "",
    motherEmail:    r.motherEmail ?? "",
    fatherName:     r.fatherName ?? "",
    fatherPhone:    r.fatherPhone ?? "",
    fatherEmail:    r.fatherEmail ?? "",
    address:        r.address ?? "",
    enrollmentId:   r.enrollmentId ?? null,
    enrollDate:     r.enrollDate ?? "",
    enrollStatus:   r.enrollStatus ?? "Enrolled",
    course:         r.courseName ?? "",
    courseIcon:     r.courseIcon ?? "",
    level:          r.levelNumber != null ? `Level ${r.levelNumber}` : "",
    levelNum:       r.levelNumber ?? 0,
    section:        r.sectionName ?? "",
    timing:         r.schedule ?? "",
    paymentStatus:  (r.paymentStatus ?? "Pending") as "Paid" | "Pending" | "Overdue",
    amountDue:      parseFloat(r.amountDue ?? "0"),
    amountPaid:     parseFloat(r.amountPaid ?? "0"),
    paymentMethod:  r.paymentMethod ?? "-",
    receiptId:      r.receiptId ?? "-",
  }));
}

// GET /api/admin/students/meta
router.get("/meta", async (req, res) => {
  try {
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

// GET /api/admin/students
router.get("/", async (req, res) => {
  try {
    res.json(await buildStudentList());
  } catch (err) {
    req.log.error({ err }, "Failed to fetch students");
    res.status(500).json({ error: "Failed to fetch students" });
  }
});

// POST /api/admin/students — register new student
router.post("/", async (req, res) => {
  try {
    const {
      studentCode, firstName, lastName, dob, grade, isNewStudent,
      curriculumYear, memberId,
      motherName, motherPhone, motherEmail, motherEmployer,
      fatherName, fatherPhone, fatherEmail, fatherEmployer,
      address, volunteerParent, volunteerArea,
      enrollments = [],
    } = req.body as {
      studentCode?: string;
      firstName: string; lastName: string;
      dob?: string; grade?: string; isNewStudent?: boolean;
      curriculumYear?: string; memberId?: number;
      motherName?: string; motherPhone?: string; motherEmail?: string; motherEmployer?: string;
      fatherName?: string; fatherPhone?: string; fatherEmail?: string; fatherEmployer?: string;
      address?: string; volunteerParent?: boolean; volunteerArea?: string;
      enrollments: { courseLevelId: number; sectionId?: number | null; enrollDate?: string; amountDue?: string }[];
    };

    if (!firstName?.trim() || !lastName?.trim()) {
      return res.status(400).json({ error: "First name and last name are required" });
    }

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
      curriculumYear: curriculumYear?.trim() || null,
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

// PATCH /api/admin/students/bulk/status — bulk activate/deactivate
router.patch("/bulk/status", async (req, res) => {
  try {
    const { codes, isActive } = req.body as { codes: string[]; isActive: boolean };
    if (!Array.isArray(codes) || codes.length === 0) {
      return res.status(400).json({ error: "No student codes provided" });
    }
    await db
      .update(studentsTable)
      .set({ isActive })
      .where(inArray(studentsTable.studentCode, codes));
    res.json({ success: true, updated: codes.length });
  } catch (err) {
    req.log.error({ err }, "Failed to bulk update student status");
    res.status(500).json({ error: "Failed to update student status" });
  }
});

// DELETE /api/admin/students/bulk — bulk delete
router.delete("/bulk", async (req, res) => {
  try {
    const { codes } = req.body as { codes: string[] };
    if (!Array.isArray(codes) || codes.length === 0) {
      return res.status(400).json({ error: "No student codes provided" });
    }
    await db
      .delete(studentsTable)
      .where(inArray(studentsTable.studentCode, codes));
    res.json({ success: true, deleted: codes.length });
  } catch (err) {
    req.log.error({ err }, "Failed to bulk delete students");
    res.status(500).json({ error: "Failed to delete students" });
  }
});

// PATCH /api/admin/students/:code — edit student details
router.patch("/:code", async (req, res) => {
  try {
    const { code } = req.params;
    const {
      firstName, lastName, dob, grade, curriculumYear, isNewStudent,
      motherName, motherPhone, motherEmail,
      fatherName, fatherPhone, fatherEmail,
      address,
    } = req.body as {
      firstName?: string; lastName?: string;
      dob?: string; grade?: string; curriculumYear?: string; isNewStudent?: boolean;
      motherName?: string; motherPhone?: string; motherEmail?: string;
      fatherName?: string; fatherPhone?: string; fatherEmail?: string;
      address?: string;
    };

    const [existing] = await db
      .select({ id: studentsTable.id, name: studentsTable.name })
      .from(studentsTable)
      .where(eq(studentsTable.studentCode, code));

    if (!existing) return res.status(404).json({ error: "Student not found" });

    const updates: Record<string, unknown> = {};

    // Name update
    if (firstName !== undefined || lastName !== undefined) {
      const parts = existing.name.split(" ");
      const currentFirst = parts[0] ?? "";
      const currentLast  = parts.slice(1).join(" ");
      const newFirst = firstName?.trim() ?? currentFirst;
      const newLast  = lastName?.trim()  ?? currentLast;
      updates.name = `${newFirst} ${newLast}`.trim();
    }
    if (dob             !== undefined) updates.dob            = dob || null;
    if (grade           !== undefined) updates.grade          = grade || null;
    if (curriculumYear  !== undefined) updates.curriculumYear = curriculumYear || null;
    if (isNewStudent    !== undefined) updates.isNewStudent   = isNewStudent;
    if (motherName      !== undefined) updates.motherName     = motherName.trim() || null;
    if (motherPhone     !== undefined) updates.motherPhone    = motherPhone.trim() || null;
    if (motherEmail     !== undefined) updates.motherEmail    = motherEmail.trim() || null;
    if (fatherName      !== undefined) updates.fatherName     = fatherName.trim() || null;
    if (fatherPhone     !== undefined) updates.fatherPhone    = fatherPhone.trim() || null;
    if (fatherEmail     !== undefined) updates.fatherEmail    = fatherEmail.trim() || null;
    if (address         !== undefined) updates.address        = address.trim() || null;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    await db.update(studentsTable).set(updates).where(eq(studentsTable.id, existing.id));
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Failed to update student");
    res.status(500).json({ error: "Failed to update student" });
  }
});

// PATCH /api/admin/students/:code/status — single activate/deactivate
router.patch("/:code/status", async (req, res) => {
  try {
    const { isActive } = req.body as { isActive: boolean };
    const [existing] = await db
      .select({ id: studentsTable.id })
      .from(studentsTable)
      .where(eq(studentsTable.studentCode, req.params.code));
    if (!existing) return res.status(404).json({ error: "Student not found" });
    await db.update(studentsTable).set({ isActive }).where(eq(studentsTable.id, existing.id));
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Failed to update student status");
    res.status(500).json({ error: "Failed to update status" });
  }
});

// DELETE /api/admin/students/:code
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

// PATCH /api/admin/students/enrollments/:id/section
router.patch("/enrollments/:id/section", async (req, res) => {
  try {
    const enrollmentId = parseInt(req.params.id);
    const { sectionId } = req.body as { sectionId: number | null };
    if (isNaN(enrollmentId)) return res.status(400).json({ error: "Invalid enrollment ID" });

    const [enrollment] = await db
      .select({ courseLevelId: enrollmentsTable.courseLevelId })
      .from(enrollmentsTable)
      .where(eq(enrollmentsTable.id, enrollmentId));
    if (!enrollment) return res.status(404).json({ error: "Enrollment not found" });

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

    await db.update(enrollmentsTable).set({ sectionId: sectionId ?? null }).where(eq(enrollmentsTable.id, enrollmentId));
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Failed to update enrollment section");
    res.status(500).json({ error: "Failed to update enrollment section" });
  }
});

export default router;
