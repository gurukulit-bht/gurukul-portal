import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { testimonialsTable } from "@workspace/db/schema";
import { eq, asc } from "drizzle-orm";

const router: IRouter = Router();

function map(t: typeof testimonialsTable.$inferSelect) {
  return {
    id:          t.id,
    name:        t.name,
    detail:      t.detail,
    quote:       t.quote,
    avatarColor: t.avatarColor,
    isActive:    t.isActive,
    sortOrder:   t.sortOrder,
  };
}

// GET /api/admin/testimonials
router.get("/", async (req, res) => {
  try {
    const rows = await db.select().from(testimonialsTable).orderBy(asc(testimonialsTable.sortOrder), asc(testimonialsTable.createdAt));
    res.json(rows.map(map));
  } catch (err) {
    req.log.error({ err }, "Failed to fetch testimonials");
    res.status(500).json({ error: "Failed to fetch testimonials" });
  }
});

// POST /api/admin/testimonials — max 3 active at a time
router.post("/", async (req, res) => {
  try {
    const { name, detail, quote, avatarColor, isActive, sortOrder } = req.body;
    if (isActive !== false) {
      const existing = await db.select().from(testimonialsTable).where(eq(testimonialsTable.isActive, true));
      if (existing.length >= 3) {
        return res.status(400).json({ error: "Maximum of 3 active testimonials allowed. Deactivate one before adding a new one." });
      }
    }
    const [row] = await db.insert(testimonialsTable).values({
      name, detail, quote,
      avatarColor: avatarColor || "bg-orange-500",
      isActive:    isActive !== false,
      sortOrder:   Number(sortOrder) || 0,
    }).returning();
    res.json(map(row));
  } catch (err) {
    req.log.error({ err }, "Failed to create testimonial");
    res.status(500).json({ error: "Failed to create testimonial" });
  }
});

// PUT /api/admin/testimonials/:id
router.put("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, detail, quote, avatarColor, isActive, sortOrder } = req.body;
    if (isActive) {
      const existing = await db.select().from(testimonialsTable).where(eq(testimonialsTable.isActive, true));
      const othersActive = existing.filter(r => r.id !== id);
      if (othersActive.length >= 3) {
        return res.status(400).json({ error: "Maximum of 3 active testimonials allowed." });
      }
    }
    const [row] = await db.update(testimonialsTable).set({
      name, detail, quote,
      avatarColor: avatarColor || "bg-orange-500",
      isActive:    Boolean(isActive),
      sortOrder:   Number(sortOrder) || 0,
    }).where(eq(testimonialsTable.id, id)).returning();
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json(map(row));
  } catch (err) {
    req.log.error({ err }, "Failed to update testimonial");
    res.status(500).json({ error: "Failed to update testimonial" });
  }
});

// DELETE /api/admin/testimonials/:id
router.delete("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(testimonialsTable).where(eq(testimonialsTable.id, id));
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Failed to delete testimonial");
    res.status(500).json({ error: "Failed to delete testimonial" });
  }
});

export default router;
