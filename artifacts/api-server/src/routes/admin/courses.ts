import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  coursesTable,
  courseLevelsTable,
  teacherAssignmentsTable,
  teachersTable,
  enrollmentsTable,
  studentsTable,
  paymentsTable,
} from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

async function buildAdminCourses() {
  const courses = await db.select().from(coursesTable).orderBy(coursesTable.id);
  const levels = await db.select().from(courseLevelsTable).orderBy(courseLevelsTable.levelNumber);
  const assignments = await db
    .select({
      courseId: teacherAssignmentsTable.courseId,
      levelFrom: teacherAssignmentsTable.levelFrom,
      levelTo: teacherAssignmentsTable.levelTo,
      teacherName: teachersTable.name,
      teacherStatus: teachersTable.status,
    })
    .from(teacherAssignmentsTable)
    .leftJoin(teachersTable, eq(teacherAssignmentsTable.teacherId, teachersTable.id));

  return courses.map((course) => {
    const courseLevels = levels
      .filter((l) => l.courseId === course.id)
      .map((l) => {
        const teacherNames = assignments
          .filter(
            (a) =>
              a.courseId === course.id &&
              a.levelFrom <= l.levelNumber &&
              a.levelTo >= l.levelNumber &&
              a.teacherStatus === "Active"
          )
          .map((a) => a.teacherName)
          .filter(Boolean);

        return {
          id: l.id,
          level: l.levelNumber,
          className: l.className,
          schedule: l.schedule ?? "",
          teacher: teacherNames.join(" / ") || "TBD",
          enrolled: l.enrolled,
          capacity: l.capacity,
          status: l.status,
        };
      });

    return {
      id: course.id,
      name: course.name,
      icon: course.icon,
      description: course.description,
      levels: courseLevels,
    };
  });
}

// GET /api/admin/courses
router.get("/", async (req, res) => {
  try {
    res.json(await buildAdminCourses());
  } catch (err) {
    req.log.error({ err }, "Failed to fetch admin courses");
    res.status(500).json({ error: "Failed to fetch admin courses" });
  }
});

// GET /api/admin/courses/levels/:id/students
// Returns all students enrolled in a specific course level, with payment status.
router.get("/levels/:id/students", async (req, res) => {
  try {
    const levelId = parseInt(req.params.id);
    const rows = await db
      .select({
        enrollmentId: enrollmentsTable.id,
        enrollDate: enrollmentsTable.enrollDate,
        enrollStatus: enrollmentsTable.status,
        studentId: studentsTable.id,
        studentCode: studentsTable.studentCode,
        studentName: studentsTable.name,
        parentName: studentsTable.parentName,
        email: studentsTable.email,
        phone: studentsTable.phone,
        paymentStatus: paymentsTable.paymentStatus,
        amountDue: paymentsTable.amountDue,
        amountPaid: paymentsTable.amountPaid,
        paymentDate: paymentsTable.paymentDate,
      })
      .from(enrollmentsTable)
      .innerJoin(studentsTable, eq(enrollmentsTable.studentId, studentsTable.id))
      .leftJoin(paymentsTable, eq(paymentsTable.enrollmentId, enrollmentsTable.id))
      .where(eq(enrollmentsTable.courseLevelId, levelId))
      .orderBy(studentsTable.name);

    res.json(rows);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch level students");
    res.status(500).json({ error: "Failed to fetch level students" });
  }
});

// PUT /api/admin/courses/levels/:id
router.put("/levels/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { schedule, capacity, enrolled, status } = req.body;
    const [level] = await db
      .update(courseLevelsTable)
      .set({
        schedule: schedule || undefined,
        capacity: capacity !== undefined ? parseInt(capacity) : undefined,
        enrolled: enrolled !== undefined ? parseInt(enrolled) : undefined,
        status: status || undefined,
      })
      .where(eq(courseLevelsTable.id, id))
      .returning();
    res.json(level);
  } catch (err) {
    req.log.error({ err }, "Failed to update course level");
    res.status(500).json({ error: "Failed to update course level" });
  }
});

export default router;
