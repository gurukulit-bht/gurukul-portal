import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { weeklyUpdatesTable } from "@workspace/db/schema";
import { eq, desc } from "drizzle-orm";

const router: IRouter = Router();

// GET /api/weekly-updates — public, only Published records
router.get("/", async (req, res) => {
  try {
    const rows = await db
      .select()
      .from(weeklyUpdatesTable)
      .where(eq(weeklyUpdatesTable.status, "Published"))
      .orderBy(desc(weeklyUpdatesTable.weekStart));

    res.json(
      rows.map((u) => ({
        id:             u.id,
        courseName:     u.courseName,
        levelName:      u.levelName,
        sectionName:    u.sectionName,
        weekStart:      u.weekStart,
        weekEnd:        u.weekEnd,
        title:          u.title,
        content:        u.content,
        topicsCovered:  u.topicsCovered ?? "",
        homework:       u.homework ?? "",
        upcomingPlan:   u.upcomingPlan ?? "",
        reminders:      u.reminders ?? "",
        attachmentLink: u.attachmentLink ?? "",
        teacherName:    u.teacherName,
        publishedAt:    u.publishedAt ? u.publishedAt.toISOString() : null,
      }))
    );
  } catch (err) {
    req.log.error({ err }, "Failed to fetch public weekly updates");
    res.status(500).json({ error: "Failed to fetch weekly updates" });
  }
});

export default router;
