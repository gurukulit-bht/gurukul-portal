import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  weeklyUpdatesTable,
  studentsTable,
  membersTable,
  enrollmentsTable,
} from "@workspace/db/schema";
import { eq, desc, inArray, or, sql } from "drizzle-orm";

const router: IRouter = Router();

function mapUpdate(u: typeof weeklyUpdatesTable.$inferSelect) {
  const courseName  = u.courseName  ?? "";
  const levelName   = u.levelName   ?? "";
  const sectionName = u.sectionName ?? "";
  let audience = "All Students";
  if (courseName)  audience = `All ${courseName} Students`;
  if (levelName)   audience = `${courseName} – ${levelName}`;
  if (sectionName) audience = `${courseName} – ${levelName} – ${sectionName}`;
  return {
    id:             u.id,
    courseName,
    levelName,
    sectionName,
    audience,
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
    teacherName:    u.teacherName,
    publishedAt:    u.publishedAt ? u.publishedAt.toISOString() : null,
  };
}

// GET /api/weekly-updates — public, Published records
// Optional: ?phone=6145550123  → filters to updates relevant to that parent's enrolled children
router.get("/", async (req, res) => {
  try {
    const rawPhone = (req.query.phone as string | undefined)?.trim();
    const normalized = rawPhone ? rawPhone.replace(/\D/g, "") : null;

    // Fetch all published updates
    const allUpdates = await db
      .select()
      .from(weeklyUpdatesTable)
      .where(eq(weeklyUpdatesTable.status, "Published"))
      .orderBy(desc(weeklyUpdatesTable.weekStart));

    // If no phone supplied, return everything (e.g. admin preview / old callers)
    if (!normalized || normalized.length < 7) {
      return res.json(allUpdates.map(mapUpdate));
    }

    // ── Resolve parent's enrolled levels / sections ──────────────────────────

    // Find all students linked to this phone number.
    // Three lookup paths: member phone, mother's phone, father's phone.
    const matchedStudents = await db
      .select({ id: studentsTable.id })
      .from(studentsTable)
      .leftJoin(membersTable, eq(studentsTable.memberId, membersTable.id))
      .where(
        or(
          sql`regexp_replace(${membersTable.phone},   '[^0-9]', '', 'g') = ${normalized}`,
          sql`regexp_replace(${studentsTable.motherPhone}, '[^0-9]', '', 'g') = ${normalized}`,
          sql`regexp_replace(${studentsTable.fatherPhone}, '[^0-9]', '', 'g') = ${normalized}`,
        )
      );

    if (matchedStudents.length === 0) {
      // No children found for this phone — return empty list
      return res.json([]);
    }

    const studentIds = matchedStudents.map((s) => s.id);

    const enrollments = await db
      .select({
        courseLevelId: enrollmentsTable.courseLevelId,
        sectionId:     enrollmentsTable.sectionId,
      })
      .from(enrollmentsTable)
      .where(inArray(enrollmentsTable.studentId, studentIds));

    if (enrollments.length === 0) {
      return res.json([]);
    }

    // Build lookup structures:
    //  - enrolledLevelIds: Set of course level IDs the parent's children are in
    //  - enrolledPairs:    "levelId:sectionId" or "levelId:null" per enrollment
    const enrolledLevelIds = new Set<number>();
    const enrolledPairs    = new Set<string>();

    for (const e of enrollments) {
      enrolledLevelIds.add(e.courseLevelId);
      enrolledPairs.add(`${e.courseLevelId}:${e.sectionId ?? "null"}`);
    }

    // ── Filter updates ────────────────────────────────────────────────────────
    //
    // Visibility rules:
    //  1. Update MUST target a level the parent's child is enrolled in.
    //  2. If the update also targets a specific section:
    //     - Show if the child is enrolled in that exact section, OR
    //     - Show if the child is enrolled in the level but without a section
    //       assignment (sectionId = null) — they belong to the whole level.
    //  3. Level-wide updates (sectionId null on the update) → visible to all
    //     parents enrolled in that level regardless of section.

    const filtered = allUpdates.filter((u) => {
      if (!u.levelId) return false;
      if (!enrolledLevelIds.has(u.levelId)) return false;

      if (u.sectionId !== null) {
        // Section-specific update — child must be in this section OR unassigned
        return (
          enrolledPairs.has(`${u.levelId}:${u.sectionId}`) ||
          enrolledPairs.has(`${u.levelId}:null`)
        );
      }

      // Level-wide update — enrolled in the level is sufficient
      return true;
    });

    return res.json(filtered.map(mapUpdate));
  } catch (err) {
    req.log.error({ err }, "Failed to fetch public weekly updates");
    res.status(500).json({ error: "Failed to fetch weekly updates" });
  }
});

export default router;
