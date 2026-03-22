import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { eventsTable } from "@workspace/db/schema";
import { eq, asc } from "drizzle-orm";

const router: IRouter = Router();

function mapEvent(e: typeof eventsTable.$inferSelect) {
  return {
    id: e.id,
    title: e.title,
    description: e.description,
    date: e.date,
    time: e.time,
    location: e.location,
    category: e.category,
    isRecurring: e.isRecurring,
  };
}

// GET /api/admin/events
router.get("/", async (req, res) => {
  try {
    const items = await db.select().from(eventsTable).orderBy(asc(eventsTable.date));
    res.json(items.map(mapEvent));
  } catch (err) {
    req.log.error({ err }, "Failed to fetch events");
    res.status(500).json({ error: "Failed to fetch events" });
  }
});

// POST /api/admin/events
router.post("/", async (req, res) => {
  try {
    const { title, description, date, time, location, category, isRecurring } = req.body;
    const [item] = await db
      .insert(eventsTable)
      .values({ title, description: description || "", date, time, location: location || "", category: category || "General", isRecurring: Boolean(isRecurring) })
      .returning();
    res.json(mapEvent(item));
  } catch (err) {
    req.log.error({ err }, "Failed to create event");
    res.status(500).json({ error: "Failed to create event" });
  }
});

// PUT /api/admin/events/:id
router.put("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { title, description, date, time, location, category, isRecurring } = req.body;
    const [item] = await db
      .update(eventsTable)
      .set({ title, description, date, time, location, category, isRecurring: Boolean(isRecurring) })
      .where(eq(eventsTable.id, id))
      .returning();
    res.json(mapEvent(item));
  } catch (err) {
    req.log.error({ err }, "Failed to update event");
    res.status(500).json({ error: "Failed to update event" });
  }
});

// DELETE /api/admin/events/:id
router.delete("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(eventsTable).where(eq(eventsTable.id, id));
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Failed to delete event");
    res.status(500).json({ error: "Failed to delete event" });
  }
});

export default router;
