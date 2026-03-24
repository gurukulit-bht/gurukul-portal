import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  weeklyUpdatesTable,
  coursesTable,
  courseLevelsTable,
  courseSectionsTable,
  teachersTable,
  teacherAssignmentsTable,
} from "@workspace/db/schema";
import { eq, desc, and } from "drizzle-orm";

const router: IRouter = Router();

function buildAudience(courseName: string, levelName: string, sectionName: string): string {
  if (!courseName) return "All Students";
  if (!levelName)  return `All ${courseName} Students`;
  if (!sectionName) return `${courseName} – ${levelName}`;
  return `${courseName} – ${levelName} – ${sectionName}`;
}

function mapUpdate(u: typeof weeklyUpdatesTable.$inferSelect) {
  return {
    id:             u.id,
    courseId:       u.courseId,
    courseName:     u.courseName,
    levelId:        u.levelId,
    levelName:      u.levelName,
    sectionId:      u.sectionId,
    sectionName:    u.sectionName,
    audience:       buildAudience(u.courseName, u.levelName, u.sectionName),
    weekStart:      u.weekStart,
    weekEnd:        u.weekEnd,
    title:          u.title,
    content:        u.content,
    topicsCovered:  u.topicsCovered ?? "",
    homework:       u.homework ?? "",
    upcomingPlan:   u.upcomingPlan ?? "",
    reminders:      u.reminders ?? "",
    attachmentLink: u.attachmentLink ?? "",
    priority:       u.priority ?? "Normal",
    status:         u.status,
    teacherName:    u.teacherName,
    createdBy:      u.createdBy,
    publishedAt:    u.publishedAt ? u.publishedAt.toISOString() : null,
    createdAt:      u.createdAt ? u.createdAt.toISOString() : null,
    updatedAt:      u.updatedAt ? u.updatedAt.toISOString() : null,
  };
}

// ── Helper: get teacher row from email ──
async function getTeacherByEmail(email: string) {
  const [teacher] = await db.select().from(teachersTable).where(eq(teachersTable.email, email));
  return teacher ?? null;
}

// GET /api/admin/weekly-updates
// Admin → all; Teacher/Assistant → only their sections
router.get("/", async (req, res) => {
  try {
    const role  = (req.headers["x-user-role"]  as string) ?? "";
    const email = (req.headers["x-user-email"] as string) ?? "";

    let rows = await db
      .select()
      .from(weeklyUpdatesTable)
      .orderBy(desc(weeklyUpdatesTable.createdAt));

    // Scope teachers to their own updates
    if (role !== "admin") {
      rows = rows.filter((r) => r.createdBy === email);
    }

    res.json(rows.map(mapUpdate));
  } catch (err) {
    req.log.error({ err }, "Failed to fetch weekly updates");
    res.status(500).json({ error: "Failed to fetch weekly updates" });
  }
});

// GET /api/admin/weekly-updates/form-meta
// Returns courses+levels+sections scoped by teacher role
router.get("/form-meta", async (req, res) => {
  try {
    const role  = (req.headers["x-user-role"]  as string) ?? "";
    const email = (req.headers["x-user-email"] as string) ?? "";

    const courses  = await db.select().from(coursesTable).orderBy(coursesTable.name);
    const levels   = await db.select().from(courseLevelsTable).orderBy(courseLevelsTable.levelNumber);
    const sections = await db.select().from(courseSectionsTable).orderBy(courseSectionsTable.id);

    // Scope teacher to assigned course IDs
    let allowedCourseIds: number[] | null = null;
    if (role !== "admin") {
      const teacher = await getTeacherByEmail(email);
      if (teacher) {
        const assignments = await db
          .select({ courseId: teacherAssignmentsTable.courseId })
          .from(teacherAssignmentsTable)
          .where(eq(teacherAssignmentsTable.teacherId, teacher.id));
        allowedCourseIds = assignments.map((a) => a.courseId);
      }
    }

    const filteredCourses = allowedCourseIds
      ? courses.filter((c) => allowedCourseIds!.includes(c.id))
      : courses;

    const filteredLevels = allowedCourseIds
      ? levels.filter((l) => allowedCourseIds!.includes(l.courseId))
      : levels;

    const allowedLevelIds = filteredLevels.map((l) => l.id);
    const filteredSections = sections.filter((s) => allowedLevelIds.includes(s.courseLevelId));

    res.json({
      courses:  filteredCourses.map((c) => ({ id: c.id, name: c.name })),
      levels:   filteredLevels.map((l) => ({ id: l.id, courseId: l.courseId, name: l.className })),
      sections: filteredSections.map((s) => ({ id: s.id, levelId: s.courseLevelId, name: s.sectionName })),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch form meta");
    res.status(500).json({ error: "Failed to fetch form meta" });
  }
});

// POST /api/admin/weekly-updates
router.post("/", async (req, res) => {
  try {
    const email = (req.headers["x-user-email"] as string) ?? "unknown";
    const {
      courseId, courseName, levelId, levelName, sectionId, sectionName,
      weekStart, weekEnd, title, content,
      topicsCovered, homework, upcomingPlan, reminders, attachmentLink,
      status, teacherName,
    } = req.body;

    const [item] = await db
      .insert(weeklyUpdatesTable)
      .values({
        courseId:       courseId ?? null,
        courseName:     courseName ?? "",
        levelId:        levelId ?? null,
        levelName:      levelName ?? "",
        sectionId:      sectionId ?? null,
        sectionName:    sectionName ?? "",
        weekStart,
        weekEnd,
        title,
        content,
        topicsCovered:  topicsCovered || null,
        homework:       homework || null,
        upcomingPlan:   upcomingPlan || null,
        reminders:      reminders || null,
        attachmentLink: attachmentLink || null,
        status:         status === "Published" ? "Published" : "Draft",
        teacherName:    teacherName ?? email,
        createdBy:      email,
        publishedAt:    status === "Published" ? new Date() : null,
      })
      .returning();

    res.json(mapUpdate(item));
  } catch (err) {
    req.log.error({ err }, "Failed to create weekly update");
    res.status(500).json({ error: "Failed to create weekly update" });
  }
});

// PUT /api/admin/weekly-updates/:id
router.put("/:id", async (req, res) => {
  try {
    const id    = parseInt(req.params.id);
    const email = (req.headers["x-user-email"] as string) ?? "unknown";
    const {
      courseId, courseName, levelId, levelName, sectionId, sectionName,
      weekStart, weekEnd, title, content,
      topicsCovered, homework, upcomingPlan, reminders, attachmentLink,
      status, teacherName,
    } = req.body;

    const [existing] = await db.select().from(weeklyUpdatesTable).where(eq(weeklyUpdatesTable.id, id));
    if (!existing) return res.status(404).json({ error: "Not found" });

    const wasPublished = existing.status === "Published";
    const nowPublished = status === "Published";

    const [item] = await db
      .update(weeklyUpdatesTable)
      .set({
        courseId:       courseId ?? null,
        courseName:     courseName ?? "",
        levelId:        levelId ?? null,
        levelName:      levelName ?? "",
        sectionId:      sectionId ?? null,
        sectionName:    sectionName ?? "",
        weekStart,
        weekEnd,
        title,
        content,
        topicsCovered:  topicsCovered || null,
        homework:       homework || null,
        upcomingPlan:   upcomingPlan || null,
        reminders:      reminders || null,
        attachmentLink: attachmentLink || null,
        status:         nowPublished ? "Published" : "Draft",
        teacherName:    teacherName ?? email,
        publishedAt:    nowPublished ? (wasPublished ? existing.publishedAt : new Date()) : null,
        updatedAt:      new Date(),
      })
      .where(eq(weeklyUpdatesTable.id, id))
      .returning();

    res.json(mapUpdate(item));
  } catch (err) {
    req.log.error({ err }, "Failed to update weekly update");
    res.status(500).json({ error: "Failed to update weekly update" });
  }
});

// PATCH /api/admin/weekly-updates/:id/publish
router.patch("/:id/publish", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [item] = await db
      .update(weeklyUpdatesTable)
      .set({ status: "Published", publishedAt: new Date(), updatedAt: new Date() })
      .where(eq(weeklyUpdatesTable.id, id))
      .returning();
    if (!item) return res.status(404).json({ error: "Not found" });
    res.json(mapUpdate(item));
  } catch (err) {
    req.log.error({ err }, "Failed to publish weekly update");
    res.status(500).json({ error: "Failed to publish" });
  }
});

// DELETE /api/admin/weekly-updates/:id
router.delete("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(weeklyUpdatesTable).where(eq(weeklyUpdatesTable.id, id));
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Failed to delete weekly update");
    res.status(500).json({ error: "Failed to delete" });
  }
});

export default router;
