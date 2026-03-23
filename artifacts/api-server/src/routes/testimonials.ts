import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { testimonialsTable } from "@workspace/db/schema";
import { eq, asc } from "drizzle-orm";

const router: IRouter = Router();

// GET /api/testimonials — public, active only, sorted
router.get("/", async (req, res) => {
  try {
    const rows = await db
      .select()
      .from(testimonialsTable)
      .where(eq(testimonialsTable.isActive, true))
      .orderBy(asc(testimonialsTable.sortOrder), asc(testimonialsTable.createdAt))
      .limit(3);
    res.json(rows.map(r => ({
      id:          r.id,
      name:        r.name,
      detail:      r.detail,
      quote:       r.quote,
      avatarColor: r.avatarColor,
    })));
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch testimonials" });
  }
});

export default router;
