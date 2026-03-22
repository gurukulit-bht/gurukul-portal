import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { announcementsTable } from "@workspace/db/schema";
import { eq, desc } from "drizzle-orm";

const router: IRouter = Router();

function mapAnnouncement(a: typeof announcementsTable.$inferSelect) {
  return {
    id: a.id,
    title: a.title,
    content: a.content,
    category: a.category,
    publishDate: a.date,
    expiryDate: a.expiryDate ?? "",
    isActive: a.isActive,
    isUrgent: a.isUrgent,
  };
}

// GET /api/admin/announcements
router.get("/", async (req, res) => {
  try {
    const items = await db
      .select()
      .from(announcementsTable)
      .orderBy(desc(announcementsTable.createdAt));
    res.json(items.map(mapAnnouncement));
  } catch (err) {
    req.log.error({ err }, "Failed to fetch announcements");
    res.status(500).json({ error: "Failed to fetch announcements" });
  }
});

// POST /api/admin/announcements
router.post("/", async (req, res) => {
  try {
    const { title, content, category, publishDate, expiryDate, isActive, isUrgent } = req.body;
    const [item] = await db
      .insert(announcementsTable)
      .values({
        title,
        content,
        category: category || "General",
        date: publishDate,
        expiryDate: expiryDate || null,
        isActive: Boolean(isActive),
        isUrgent: Boolean(isUrgent),
      })
      .returning();
    res.json(mapAnnouncement(item));
  } catch (err) {
    req.log.error({ err }, "Failed to create announcement");
    res.status(500).json({ error: "Failed to create announcement" });
  }
});

// PUT /api/admin/announcements/:id
router.put("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { title, content, category, publishDate, expiryDate, isActive, isUrgent } = req.body;
    const [item] = await db
      .update(announcementsTable)
      .set({
        title,
        content,
        category,
        date: publishDate,
        expiryDate: expiryDate || null,
        isActive: Boolean(isActive),
        isUrgent: Boolean(isUrgent),
      })
      .where(eq(announcementsTable.id, id))
      .returning();
    res.json(mapAnnouncement(item));
  } catch (err) {
    req.log.error({ err }, "Failed to update announcement");
    res.status(500).json({ error: "Failed to update announcement" });
  }
});

// PATCH /api/admin/announcements/:id/toggle
router.patch("/:id/toggle", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [current] = await db
      .select()
      .from(announcementsTable)
      .where(eq(announcementsTable.id, id));
    if (!current) return res.status(404).json({ error: "Not found" });
    const [item] = await db
      .update(announcementsTable)
      .set({ isActive: !current.isActive })
      .where(eq(announcementsTable.id, id))
      .returning();
    res.json(mapAnnouncement(item));
  } catch (err) {
    req.log.error({ err }, "Failed to toggle announcement");
    res.status(500).json({ error: "Failed to toggle announcement" });
  }
});

// DELETE /api/admin/announcements/:id
router.delete("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(announcementsTable).where(eq(announcementsTable.id, id));
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Failed to delete announcement");
    res.status(500).json({ error: "Failed to delete announcement" });
  }
});

export default router;
