import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  coursesTable,
  courseLevelsTable,
  courseSectionsTable,
  sectionAssignmentsTable,
  teacherAssignmentsTable,
  teachersTable,
  enrollmentsTable,
  studentsTable,
  paymentsTable,
} from "@workspace/db/schema";
import { eq, sql, isNull, and } from "drizzle-orm";

const router: IRouter = Router();

// ─── Build helpers ────────────────────────────────────────────────────────────

async function buildAdminCourses(includeArchived = false) {
  const courseRows = await db
    .select()
    .from(coursesTable)
    .where(includeArchived ? undefined : isNull(coursesTable.archivedAt))
    .orderBy(coursesTable.id);

  const levels = await db.select().from(courseLevelsTable).orderBy(courseLevelsTable.levelNumber);
  const sections = await db.select().from(courseSectionsTable).orderBy(courseSectionsTable.id);

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

  const enrollmentCounts = await db
    .select({
      courseLevelId: enrollmentsTable.courseLevelId,
      count: sql<number>`cast(count(*) as int)`,
    })
    .from(enrollmentsTable)
    .where(sql`${enrollmentsTable.status} = 'Enrolled'`)
    .groupBy(enrollmentsTable.courseLevelId);

  const countMap: Record<number, number> = {};
  for (const row of enrollmentCounts) countMap[row.courseLevelId] = row.count;

  return courseRows.map((course) => {
    const courseLevels = levels
      .filter((l) => l.courseId === course.id)
      .map((l) => {
        const teacherNames = assignments
          .filter(
            (a) =>
              a.courseId === course.id &&
              a.levelFrom <= l.levelNumber &&
              a.levelTo >= l.levelNumber &&
              a.teacherStatus === "Active",
          )
          .map((a) => a.teacherName)
          .filter(Boolean);

        const levelSections = sections
          .filter((s) => s.courseLevelId === l.id)
          .map((s) => ({
            id:          s.id,
            sectionName: s.sectionName,
            schedule:    s.schedule ?? "",
            capacity:    s.capacity,
            status:      s.status,
          }));

        return {
          id:        l.id,
          level:     l.levelNumber,
          className: l.className,
          schedule:  l.schedule ?? "",
          teacher:   teacherNames.join(" / ") || "TBD",
          enrolled:  countMap[l.id] ?? 0,
          capacity:  l.capacity,
          status:    l.status,
          sections:  levelSections,
        };
      });

    return {
      id:          course.id,
      name:        course.name,
      icon:        course.icon,
      description: course.description,
      schedule:    course.schedule,
      ageGroup:    course.ageGroup,
      instructor:  course.instructor,
      archivedAt:  course.archivedAt,
      levels:      courseLevels,
    };
  });
}

// ─── Course CRUD ──────────────────────────────────────────────────────────────

// GET /api/admin/courses?includeArchived=true
router.get("/", async (req, res) => {
  try {
    const includeArchived = req.query.includeArchived === "true";
    res.json(await buildAdminCourses(includeArchived));
  } catch (err) {
    req.log.error({ err }, "Failed to fetch admin courses");
    res.status(500).json({ error: "Failed to fetch admin courses" });
  }
});

// POST /api/admin/courses — create a new course with initial levels
router.post("/", async (req, res) => {
  try {
    const { name, description, icon, ageGroup, schedule, instructor, numLevels } = req.body as {
      name: string; description: string; icon: string; ageGroup: string;
      schedule: string; instructor: string; numLevels: number;
    };

    if (!name?.trim()) return res.status(400).json({ error: "Course name is required" });

    const existing = await db.select().from(coursesTable).where(eq(coursesTable.name, name.trim()));
    if (existing.length > 0) return res.status(409).json({ error: "A course with this name already exists" });

    const [course] = await db
      .insert(coursesTable)
      .values({
        name:        name.trim(),
        description: description ?? "",
        icon:        icon ?? "📚",
        ageGroup:    ageGroup ?? "All Ages",
        level:       "Beginner to Advanced",
        schedule:    schedule ?? "",
        instructor:  instructor ?? "TBD",
      })
      .returning();

    // Create levels
    const levelCount = Math.min(Math.max(1, numLevels ?? 7), 7);
    for (let i = 1; i <= levelCount; i++) {
      await db.insert(courseLevelsTable).values({
        courseId:    course.id,
        levelNumber: i,
        className:   `Level ${i}`,
        schedule:    schedule ?? "",
        capacity:    20,
        enrolled:    0,
      });
    }

    res.status(201).json((await buildAdminCourses(true)).find((c) => c.id === course.id));
  } catch (err) {
    req.log.error({ err }, "Failed to create course");
    res.status(500).json({ error: "Failed to create course" });
  }
});

// PUT /api/admin/courses/:id — update course metadata
router.put("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, description, icon, ageGroup, schedule, instructor } = req.body;

    if (name) {
      const conflict = await db
        .select()
        .from(coursesTable)
        .where(and(eq(coursesTable.name, name.trim()), sql`id != ${id}`));
      if (conflict.length > 0) return res.status(409).json({ error: "A course with this name already exists" });
    }

    await db
      .update(coursesTable)
      .set({
        name:        name?.trim() || undefined,
        description: description ?? undefined,
        icon:        icon ?? undefined,
        ageGroup:    ageGroup ?? undefined,
        schedule:    schedule ?? undefined,
        instructor:  instructor ?? undefined,
      })
      .where(eq(coursesTable.id, id));

    res.json((await buildAdminCourses(true)).find((c) => c.id === id));
  } catch (err) {
    req.log.error({ err }, "Failed to update course");
    res.status(500).json({ error: "Failed to update course" });
  }
});

// PATCH /api/admin/courses/:id/archive — toggle archive
router.patch("/:id/archive", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const course = await db.select().from(coursesTable).where(eq(coursesTable.id, id));
    if (!course[0]) return res.status(404).json({ error: "Course not found" });

    const isArchived = course[0].archivedAt !== null;
    await db
      .update(coursesTable)
      .set({ archivedAt: isArchived ? null : new Date() })
      .where(eq(coursesTable.id, id));

    res.json({ archived: !isArchived });
  } catch (err) {
    req.log.error({ err }, "Failed to archive course");
    res.status(500).json({ error: "Failed to archive course" });
  }
});

// DELETE /api/admin/courses/:id
router.delete("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    // Check if any students are enrolled
    const levels = await db.select().from(courseLevelsTable).where(eq(courseLevelsTable.courseId, id));
    const levelIds = levels.map((l) => l.id);

    if (levelIds.length > 0) {
      const enrolled = await db
        .select({ count: sql<number>`cast(count(*) as int)` })
        .from(enrollmentsTable)
        .where(sql`${enrollmentsTable.courseLevelId} = ANY(ARRAY[${sql.raw(levelIds.join(","))}]::int[]) AND ${enrollmentsTable.status} = 'Enrolled'`);
      if ((enrolled[0]?.count ?? 0) > 0) {
        return res.status(400).json({ error: `Cannot delete: ${enrolled[0].count} student(s) enrolled. Archive instead.` });
      }
    }

    await db.delete(coursesTable).where(eq(coursesTable.id, id));
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Failed to delete course");
    res.status(500).json({ error: "Failed to delete course" });
  }
});

// ─── Level CRUD ───────────────────────────────────────────────────────────────

// POST /api/admin/courses/:id/levels — add a level
router.post("/:id/levels", async (req, res) => {
  try {
    const courseId = parseInt(req.params.id);
    const { levelNumber, className, schedule, capacity } = req.body;

    const existing = await db
      .select()
      .from(courseLevelsTable)
      .where(and(eq(courseLevelsTable.courseId, courseId), eq(courseLevelsTable.levelNumber, levelNumber)));
    if (existing.length > 0) return res.status(409).json({ error: `Level ${levelNumber} already exists for this course` });

    const [level] = await db
      .insert(courseLevelsTable)
      .values({ courseId, levelNumber, className: className || `Level ${levelNumber}`, schedule: schedule || null, capacity: capacity || 20, enrolled: 0 })
      .returning();

    res.status(201).json(level);
  } catch (err) {
    req.log.error({ err }, "Failed to add level");
    res.status(500).json({ error: "Failed to add level" });
  }
});

// PUT /api/admin/courses/levels/:id
router.put("/levels/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { className, schedule, capacity, status } = req.body;
    const [level] = await db
      .update(courseLevelsTable)
      .set({
        className: className || undefined,
        schedule:  schedule  || undefined,
        capacity:  capacity !== undefined ? parseInt(capacity) : undefined,
        status:    status || undefined,
      })
      .where(eq(courseLevelsTable.id, id))
      .returning();
    res.json(level);
  } catch (err) {
    req.log.error({ err }, "Failed to update course level");
    res.status(500).json({ error: "Failed to update course level" });
  }
});

// DELETE /api/admin/courses/levels/:id
router.delete("/levels/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const enrolled = await db
      .select({ count: sql<number>`cast(count(*) as int)` })
      .from(enrollmentsTable)
      .where(and(eq(enrollmentsTable.courseLevelId, id), sql`${enrollmentsTable.status} = 'Enrolled'`));

    if ((enrolled[0]?.count ?? 0) > 0) {
      return res.status(400).json({ error: `Cannot delete: ${enrolled[0].count} student(s) enrolled in this level` });
    }

    await db.delete(courseLevelsTable).where(eq(courseLevelsTable.id, id));
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Failed to delete level");
    res.status(500).json({ error: "Failed to delete level" });
  }
});

// ─── Section CRUD ─────────────────────────────────────────────────────────────

// GET /api/admin/courses/levels/:id/sections
router.get("/levels/:id/sections", async (req, res) => {
  try {
    const levelId = parseInt(req.params.id);
    const sectionRows = await db
      .select({
        id:          courseSectionsTable.id,
        sectionName: courseSectionsTable.sectionName,
        schedule:    courseSectionsTable.schedule,
        capacity:    courseSectionsTable.capacity,
        status:      courseSectionsTable.status,
        teachers: sql<string>`
          coalesce(
            (SELECT json_agg(json_build_object('id', t.id, 'name', t.name, 'role', sa.role))
             FROM section_assignments sa
             JOIN teachers t ON t.id = sa.teacher_id
             WHERE sa.section_id = ${courseSectionsTable.id}),
            '[]'::json
          )
        `,
      })
      .from(courseSectionsTable)
      .where(eq(courseSectionsTable.courseLevelId, levelId))
      .orderBy(courseSectionsTable.id);

    res.json(sectionRows);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch sections");
    res.status(500).json({ error: "Failed to fetch sections" });
  }
});

// POST /api/admin/courses/levels/:id/sections
router.post("/levels/:id/sections", async (req, res) => {
  try {
    const levelId = parseInt(req.params.id);
    const { sectionName, schedule, capacity } = req.body;
    if (!sectionName?.trim()) return res.status(400).json({ error: "Section name is required" });

    const [section] = await db
      .insert(courseSectionsTable)
      .values({ courseLevelId: levelId, sectionName: sectionName.trim(), schedule: schedule || null, capacity: capacity || 20 })
      .returning();

    res.status(201).json(section);
  } catch (err) {
    req.log.error({ err }, "Failed to create section");
    res.status(500).json({ error: "Failed to create section" });
  }
});

// PUT /api/admin/courses/sections/:id
router.put("/sections/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { sectionName, schedule, capacity, status } = req.body;
    const [section] = await db
      .update(courseSectionsTable)
      .set({
        sectionName: sectionName?.trim() || undefined,
        schedule:    schedule ?? undefined,
        capacity:    capacity !== undefined ? parseInt(capacity) : undefined,
        status:      status || undefined,
      })
      .where(eq(courseSectionsTable.id, id))
      .returning();
    res.json(section);
  } catch (err) {
    req.log.error({ err }, "Failed to update section");
    res.status(500).json({ error: "Failed to update section" });
  }
});

// DELETE /api/admin/courses/sections/:id
router.delete("/sections/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(courseSectionsTable).where(eq(courseSectionsTable.id, id));
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Failed to delete section");
    res.status(500).json({ error: "Failed to delete section" });
  }
});

// ─── Section Teacher Assignments ──────────────────────────────────────────────

// POST /api/admin/courses/sections/:id/assign
router.post("/sections/:id/assign", async (req, res) => {
  try {
    const sectionId = parseInt(req.params.id);
    const { teacherId, role } = req.body;

    const existing = await db
      .select()
      .from(sectionAssignmentsTable)
      .where(and(eq(sectionAssignmentsTable.sectionId, sectionId), eq(sectionAssignmentsTable.teacherId, teacherId)));

    if (existing.length > 0) {
      await db
        .update(sectionAssignmentsTable)
        .set({ role: role || "Teacher" })
        .where(and(eq(sectionAssignmentsTable.sectionId, sectionId), eq(sectionAssignmentsTable.teacherId, teacherId)));
    } else {
      await db.insert(sectionAssignmentsTable).values({ sectionId, teacherId, role: role || "Teacher" });
    }

    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Failed to assign teacher to section");
    res.status(500).json({ error: "Failed to assign teacher" });
  }
});

// DELETE /api/admin/courses/sections/:sectionId/unassign/:teacherId
router.delete("/sections/:sectionId/unassign/:teacherId", async (req, res) => {
  try {
    const sectionId  = parseInt(req.params.sectionId);
    const teacherId  = parseInt(req.params.teacherId);
    await db
      .delete(sectionAssignmentsTable)
      .where(and(eq(sectionAssignmentsTable.sectionId, sectionId), eq(sectionAssignmentsTable.teacherId, teacherId)));
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Failed to unassign teacher");
    res.status(500).json({ error: "Failed to unassign teacher" });
  }
});

// ─── Level students (existing endpoint) ──────────────────────────────────────

router.get("/levels/:id/students", async (req, res) => {
  try {
    const levelId = parseInt(req.params.id);
    const rows = await db
      .select({
        enrollmentId: enrollmentsTable.id,
        enrollDate:   enrollmentsTable.enrollDate,
        enrollStatus: enrollmentsTable.status,
        studentId:    studentsTable.id,
        studentCode:  studentsTable.studentCode,
        studentName:  studentsTable.name,
        parentName:   studentsTable.parentName,
        email:        studentsTable.email,
        phone:        studentsTable.phone,
        paymentStatus: paymentsTable.paymentStatus,
        amountDue:    paymentsTable.amountDue,
        amountPaid:   paymentsTable.amountPaid,
        paymentDate:  paymentsTable.paymentDate,
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

export default router;
