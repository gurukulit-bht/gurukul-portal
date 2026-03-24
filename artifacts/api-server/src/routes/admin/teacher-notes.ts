import { Router } from "express";
import { db } from "@workspace/db";
import { teacherNotesTable } from "@workspace/db/schema";
import { and, eq, desc } from "drizzle-orm";

const router = Router();

/** Normalize to email (as-is) or digits-only phone — whichever is present. */
function resolveOwnerKey(email?: string, phone?: string): string | null {
  if (email) return email.toLowerCase().trim();
  if (phone) return phone.replace(/\D/g, "");
  return null;
}

// GET /api/admin/teacher-notes  — all notes for the authenticated teacher
router.get("/", async (req, res) => {
  const ownerKey = resolveOwnerKey(
    req.headers["x-user-email"] as string | undefined,
    req.headers["x-user-phone"] as string | undefined,
  );
  if (!ownerKey) return res.status(401).json({ error: "Not authenticated" });

  const notes = await db
    .select()
    .from(teacherNotesTable)
    .where(eq(teacherNotesTable.ownerKey, ownerKey))
    .orderBy(desc(teacherNotesTable.date), desc(teacherNotesTable.createdAt));

  return res.json(notes);
});

// POST /api/admin/teacher-notes  — create a note
router.post("/", async (req, res) => {
  const ownerKey = resolveOwnerKey(
    req.headers["x-user-email"] as string | undefined,
    req.headers["x-user-phone"] as string | undefined,
  );
  if (!ownerKey) return res.status(401).json({ error: "Not authenticated" });

  const { content, date, color } = req.body as {
    content: string; date: string; color?: string;
  };
  if (!content?.trim() || !date) return res.status(400).json({ error: "content and date are required" });

  const [note] = await db
    .insert(teacherNotesTable)
    .values({ ownerKey, content: content.trim(), date, color: color ?? "yellow" })
    .returning();

  return res.json(note);
});

// PUT /api/admin/teacher-notes/:id  — update content / color
router.put("/:id", async (req, res) => {
  const ownerKey = resolveOwnerKey(
    req.headers["x-user-email"] as string | undefined,
    req.headers["x-user-phone"] as string | undefined,
  );
  if (!ownerKey) return res.status(401).json({ error: "Not authenticated" });

  const id = Number(req.params.id);
  const { content, color } = req.body as { content?: string; color?: string };

  const updates: Partial<typeof teacherNotesTable.$inferInsert> = {
    updatedAt: new Date(),
  };
  if (content !== undefined) updates.content = content.trim();
  if (color   !== undefined) updates.color   = color;

  const [updated] = await db
    .update(teacherNotesTable)
    .set(updates)
    .where(and(eq(teacherNotesTable.id, id), eq(teacherNotesTable.ownerKey, ownerKey)))
    .returning();

  if (!updated) return res.status(404).json({ error: "Note not found" });
  return res.json(updated);
});

// DELETE /api/admin/teacher-notes/:id
router.delete("/:id", async (req, res) => {
  const ownerKey = resolveOwnerKey(
    req.headers["x-user-email"] as string | undefined,
    req.headers["x-user-phone"] as string | undefined,
  );
  if (!ownerKey) return res.status(401).json({ error: "Not authenticated" });

  const id = Number(req.params.id);
  await db
    .delete(teacherNotesTable)
    .where(and(eq(teacherNotesTable.id, id), eq(teacherNotesTable.ownerKey, ownerKey)));

  return res.json({ success: true });
});

export default router;
