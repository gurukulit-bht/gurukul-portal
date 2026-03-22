import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { announcementsTable } from "@workspace/db/schema";
import { desc } from "drizzle-orm";

const router: IRouter = Router();

router.get("/", async (req, res) => {
  try {
    const announcements = await db
      .select()
      .from(announcementsTable)
      .orderBy(desc(announcementsTable.createdAt));
    res.json(
      announcements.map((a) => ({
        id: a.id,
        title: a.title,
        content: a.content,
        date: a.date,
        isUrgent: a.isUrgent,
        category: a.category,
      }))
    );
  } catch (err) {
    req.log.error({ err }, "Failed to fetch announcements");
    res.status(500).json({ error: "Failed to fetch announcements" });
  }
});

export default router;
