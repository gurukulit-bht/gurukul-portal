import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  teachersTable,
  portalUsersTable,
  sectionAssignmentsTable,
  courseSectionsTable,
  courseLevelsTable,
  coursesTable,
  teacherAssignmentsTable,
} from "@workspace/db/schema";
import { eq, sql } from "drizzle-orm";
import bcrypt from "bcryptjs";

function generatePin(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}

const router: IRouter = Router();

// Build the full teacher list — combines section_assignments (specific section
// assignments) and teacher_assignments (course-level assignments) so something
// is always shown even before sections are individually assigned.
async function buildTeacherList() {
  const teachers = await db.select().from(teachersTable).orderBy(teachersTable.id);

  // Fetch portal login data for last login timestamp (keyed by phone)
  const portalUsers = await db
    .select({ phone: portalUsersTable.phone, lastLoginAt: portalUsersTable.lastLoginAt, role: portalUsersTable.role })
    .from(portalUsersTable);
  const lastLoginByPhone = new Map(portalUsers.map((p) => [p.phone, p.lastLoginAt ?? null]));

  // Section-level assignments (Course Management UI)
  const sectionRows = await db
    .select({
      teacherId:   sectionAssignmentsTable.teacherId,
      role:        sectionAssignmentsTable.role,
      sectionId:   courseSectionsTable.id,
      sectionName: courseSectionsTable.sectionName,
      levelName:   courseLevelsTable.className,
      courseName:  coursesTable.name,
      courseId:    coursesTable.id,
    })
    .from(sectionAssignmentsTable)
    .leftJoin(courseSectionsTable, eq(sectionAssignmentsTable.sectionId, courseSectionsTable.id))
    .leftJoin(courseLevelsTable,   eq(courseSectionsTable.courseLevelId,  courseLevelsTable.id))
    .leftJoin(coursesTable,        eq(courseLevelsTable.courseId,          coursesTable.id));

  // Course-level assignments (teacher_assignments table)
  const courseRows = await db
    .select({
      teacherId:  teacherAssignmentsTable.teacherId,
      courseId:   teacherAssignmentsTable.courseId,
      courseName: coursesTable.name,
    })
    .from(teacherAssignmentsTable)
    .leftJoin(coursesTable, eq(teacherAssignmentsTable.courseId, coursesTable.id));

  // Build a lookup: id → name for all teachers
  const nameById = new Map(teachers.map((t) => [t.id, t.name]));

  return teachers.map((t) => {
    const mySectionRows = sectionRows.filter((r) => r.teacherId === t.id);

    // Courses already covered by section-level assignments
    const sectionCourseIds = new Set(mySectionRows.map((r) => r.courseId).filter(Boolean));

    // Course-level rows for courses NOT already represented in section assignments
    const myCourseRows = courseRows.filter(
      (r) => r.teacherId === t.id && r.courseId !== null && !sectionCourseIds.has(r.courseId)
    );

    const allCourseNames = [
      ...new Set([
        ...mySectionRows.map((r) => r.courseName),
        ...myCourseRows.map((r) => r.courseName),
      ].filter(Boolean)),
    ] as string[];

    // Combine into a single assignments array for display
    const assignments = [
      ...mySectionRows.map((r) => ({
        sectionId:   r.sectionId,
        sectionName: r.sectionName,
        levelName:   r.levelName,
        courseName:  r.courseName,
        role:        r.role,
      })),
      // Course-level entries shown without section/level detail
      ...myCourseRows.map((r) => ({
        sectionId:   null as number | null,
        sectionName: null as string | null,
        levelName:   null as string | null,
        courseName:  r.courseName,
        role:        "lead",
      })),
    ];

    // For Teacher rows: which assistant is paired
    const assistantName = t.assistantId ? (nameById.get(t.assistantId) ?? null) : null;

    // For Assistant rows: which teacher they are paired with
    const linkedTeacher = teachers.find(
      (other) => other.category !== "Assistant" && other.assistantId === t.id
    );

    const cleanPhone = (t.phone ?? "").replace(/\D/g, "");

    return {
      id:                t.id,
      name:              t.name,
      email:             t.email,
      phone:             t.phone ?? "",
      category:          t.category,
      status:            t.status,
      assistantId:       t.assistantId ?? null,
      assistantName,
      linkedTeacherId:   linkedTeacher?.id   ?? null,
      linkedTeacherName: linkedTeacher?.name ?? null,
      courseNames:       allCourseNames,
      assignments,
      lastLoginAt:       cleanPhone ? (lastLoginByPhone.get(cleanPhone) ?? null) : null,
    };
  });
}

// GET /api/admin/teachers
router.get("/", async (req, res) => {
  try {
    res.json(await buildTeacherList());
  } catch (err) {
    req.log.error({ err }, "Failed to fetch teachers");
    res.status(500).json({ error: "Failed to fetch teachers" });
  }
});

// GET /api/admin/teachers/assistants
router.get("/assistants", async (req, res) => {
  try {
    const rows = await db
      .select({ id: teachersTable.id, name: teachersTable.name })
      .from(teachersTable)
      .where(eq(teachersTable.category, "Assistant"))
      .orderBy(teachersTable.name);
    res.json(rows);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch assistants");
    res.status(500).json({ error: "Failed to fetch assistants" });
  }
});

// POST /api/admin/teachers
// Body: { name, email, phone, category, assistantId?, linkedTeacherId? }
// Also creates / upserts a portal_users login entry with a fresh 4-digit PIN.
router.post("/", async (req, res) => {
  try {
    const { name, email, phone, category, assistantId, linkedTeacherId } = req.body;

    if (!name?.trim())  return res.status(400).json({ error: "Name is required." });
    if (!email?.trim()) return res.status(400).json({ error: "Email is required." });
    if (!phone?.trim()) return res.status(400).json({ error: "Phone number is required." });

    const cleanPhone    = phone.trim().replace(/\D/g, "");
    const isAssistant   = category === "Assistant";
    const parsedAssistantId = !isAssistant && assistantId ? parseInt(assistantId) : null;

    const [teacher] = await db
      .insert(teachersTable)
      .values({
        name:        name.trim(),
        email:       email.trim(),
        phone:       phone.trim(),
        category:    category || "Teacher",
        status:      "Active",
        assistantId: parsedAssistantId,
      })
      .returning();

    // If creating an assistant and a teacher was selected, update that teacher's assistantId
    if (isAssistant && linkedTeacherId) {
      await db
        .update(teachersTable)
        .set({ assistantId: teacher.id })
        .where(eq(teachersTable.id, parseInt(linkedTeacherId)));
    }

    // Create (or replace) the portal login entry for this staff member
    const pin     = generatePin();
    const pinHash = await bcrypt.hash(pin, 10);
    const role    = isAssistant ? "assistant" : "teacher";

    await db
      .insert(portalUsersTable)
      .values({ name: name.trim(), phone: cleanPhone, pinHash, role })
      .onConflictDoUpdate({
        target: portalUsersTable.phone,
        set:    { name: name.trim(), pinHash, role },
      });

    res.json({
      ...(await buildTeacherList()).find((t) => t.id === teacher.id),
      generatedPin: pin,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to create teacher");
    res.status(500).json({ error: "Failed to create teacher" });
  }
});

// GET /api/admin/teachers/:id/course-assignments — returns courseIds assigned via teacher_assignments
router.get("/:id/course-assignments", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const rows = await db
      .select({ courseId: teacherAssignmentsTable.courseId })
      .from(teacherAssignmentsTable)
      .where(eq(teacherAssignmentsTable.teacherId, id));
    res.json(rows.map((r) => r.courseId));
  } catch (err) {
    req.log.error({ err }, "Failed to fetch course assignments");
    res.status(500).json({ error: "Failed to fetch course assignments" });
  }
});

// PUT /api/admin/teachers/:id/course-assignments — replaces all teacher_assignments for this teacher
// Body: { courseIds: number[] }
router.put("/:id/course-assignments", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const courseIds: number[] = Array.isArray(req.body.courseIds) ? req.body.courseIds.map(Number) : [];

    // Delete existing assignments
    await db.delete(teacherAssignmentsTable).where(eq(teacherAssignmentsTable.teacherId, id));

    // Insert new ones — assign to all levels (levelFrom=1, levelTo=99)
    if (courseIds.length > 0) {
      await db.insert(teacherAssignmentsTable).values(
        courseIds.map((courseId) => ({ teacherId: id, courseId, levelFrom: 1, levelTo: 99 }))
      );
    }

    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Failed to update course assignments");
    res.status(500).json({ error: "Failed to update course assignments" });
  }
});

// PUT /api/admin/teachers/:id
router.put("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, email, phone, category, assistantId, linkedTeacherId } = req.body;

    if (!name?.trim())  return res.status(400).json({ error: "Name is required." });
    if (!email?.trim()) return res.status(400).json({ error: "Email is required." });
    if (!phone?.trim()) return res.status(400).json({ error: "Phone number is required." });

    const cleanPhone    = phone.trim().replace(/\D/g, "");
    const isAssistant   = category === "Assistant";
    const parsedAssistantId = !isAssistant && assistantId ? parseInt(assistantId) : null;

    // Get old phone so we can update the portal user record
    const [existing] = await db.select().from(teachersTable).where(eq(teachersTable.id, id));
    const oldCleanPhone = existing?.phone?.replace(/\D/g, "") ?? null;

    await db
      .update(teachersTable)
      .set({
        name:        name.trim(),
        email:       email.trim(),
        phone:       phone.trim(),
        category:    category || "Teacher",
        assistantId: parsedAssistantId,
      })
      .where(eq(teachersTable.id, id));

    // If editing an assistant, sync the teacher pairing:
    // 1. Clear any teacher that currently points to this assistant
    // 2. Set the newly selected teacher to point to this assistant
    if (isAssistant) {
      await db
        .update(teachersTable)
        .set({ assistantId: null })
        .where(sql`${teachersTable.assistantId} = ${id}`);

      if (linkedTeacherId) {
        await db
          .update(teachersTable)
          .set({ assistantId: id })
          .where(eq(teachersTable.id, parseInt(linkedTeacherId)));
      }
    }

    // Sync the name (and phone if changed) in portal_users
    const role = isAssistant ? "assistant" : "teacher";
    if (oldCleanPhone && oldCleanPhone !== cleanPhone) {
      // Phone changed — update the portal user row's phone
      await db
        .update(portalUsersTable)
        .set({ name: name.trim(), phone: cleanPhone, role })
        .where(eq(portalUsersTable.phone, oldCleanPhone));
    } else if (cleanPhone) {
      await db
        .update(portalUsersTable)
        .set({ name: name.trim(), role })
        .where(eq(portalUsersTable.phone, cleanPhone));
    }

    res.json((await buildTeacherList()).find((t) => t.id === id));
  } catch (err) {
    req.log.error({ err }, "Failed to update teacher");
    res.status(500).json({ error: "Failed to update teacher" });
  }
});

// POST /api/admin/teachers/:id/reset-pin
// Generates a fresh 4-digit PIN for the given teacher/assistant.
router.post("/:id/reset-pin", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [teacher] = await db.select().from(teachersTable).where(eq(teachersTable.id, id));
    if (!teacher) return res.status(404).json({ error: "Teacher not found." });

    const cleanPhone = (teacher.phone ?? "").replace(/\D/g, "");
    if (!cleanPhone) return res.status(400).json({ error: "Teacher has no phone number on record." });

    const pin     = generatePin();
    const pinHash = await bcrypt.hash(pin, 10);
    const role    = teacher.category === "Assistant" ? "assistant" : "teacher";

    await db
      .insert(portalUsersTable)
      .values({ name: teacher.name, phone: cleanPhone, pinHash, role })
      .onConflictDoUpdate({
        target: portalUsersTable.phone,
        set:    { pinHash, name: teacher.name, role, loginAttempts: 0, lockedUntil: null },
      });

    res.json({ pin });
  } catch (err) {
    req.log.error({ err }, "Failed to reset PIN");
    res.status(500).json({ error: "Failed to reset PIN." });
  }
});

// DELETE /api/admin/teachers/:id
router.delete("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    // Remove the portal login too
    const [teacher] = await db.select().from(teachersTable).where(eq(teachersTable.id, id));
    if (teacher?.phone) {
      const cleanPhone = teacher.phone.replace(/\D/g, "");
      await db.delete(portalUsersTable).where(eq(portalUsersTable.phone, cleanPhone));
    }

    await db.delete(teachersTable).where(eq(teachersTable.id, id));
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Failed to delete teacher");
    res.status(500).json({ error: "Failed to delete teacher" });
  }
});

export default router;
