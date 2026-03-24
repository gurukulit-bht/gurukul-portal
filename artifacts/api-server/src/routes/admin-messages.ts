import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { adminMessagesTable } from "@workspace/db/schema";
import { desc, sql } from "drizzle-orm";

const router: IRouter = Router();

// ─── GET /api/admin-messages ──────────────────────────────────────────────────
// Public endpoint — returns in-app messages destined for parents.
// Used by the Parent Portal after the parent has unlocked with their phone.

router.get("/", async (_req, res) => {
  try {
    const msgs = await db
      .select()
      .from(adminMessagesTable)
      .where(sql`${adminMessagesTable.audienceType} IN ('parents', 'both')`)
      .orderBy(desc(adminMessagesTable.sentAt))
      .limit(50);

    return res.json(
      msgs.map(m => ({
        id:           m.id,
        subject:      m.subject,
        body:         m.body,
        sentAt:       m.sentAt,
        sentBy:       m.sentBy,
        filterCourse: m.filterCourse,
      }))
    );
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch messages" });
  }
});

export default router;
