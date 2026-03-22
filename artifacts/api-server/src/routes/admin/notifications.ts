import { Router } from "express";
import { db } from "@workspace/db";
import { parentNotificationsTable } from "@workspace/db/schema";
import { eq, desc } from "drizzle-orm";

const router = Router();

// GET /api/admin/notifications
router.get("/", async (_req, res) => {
  const rows = await db
    .select()
    .from(parentNotificationsTable)
    .orderBy(desc(parentNotificationsTable.createdAt));
  return res.json(rows);
});

// POST /api/admin/notifications
router.post("/", async (req, res) => {
  const { title, message, courseName, audience, priority, status, createdBy } = req.body as {
    title:      string;
    message:    string;
    courseName: string | null;
    audience:   string;
    priority:   "High" | "Normal" | "Low";
    status:     "Draft" | "Published" | "Sent";
    createdBy:  string;
  };

  if (!title || !message || !createdBy) {
    return res.status(400).json({ error: "title, message, and createdBy are required" });
  }

  const [row] = await db
    .insert(parentNotificationsTable)
    .values({
      title,
      message,
      courseName:  courseName ?? null,
      audience:    audience ?? "All Students",
      priority:    priority ?? "Normal",
      status:      status ?? "Draft",
      createdBy,
      publishedAt: status === "Published" || status === "Sent" ? new Date() : null,
    })
    .returning();

  return res.status(201).json(row);
});

// PATCH /api/admin/notifications/:id/status
router.patch("/:id/status", async (req, res) => {
  const id     = Number(req.params.id);
  const { status } = req.body as { status: "Draft" | "Published" | "Sent" };

  if (!status) return res.status(400).json({ error: "status is required" });

  const [row] = await db
    .update(parentNotificationsTable)
    .set({
      status,
      publishedAt: status === "Published" || status === "Sent" ? new Date() : undefined,
    })
    .where(eq(parentNotificationsTable.id, id))
    .returning();

  if (!row) return res.status(404).json({ error: "Notification not found" });
  return res.json(row);
});

export default router;
