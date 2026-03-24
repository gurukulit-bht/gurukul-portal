import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { portalSettingsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

// Default settings seeded on first access
const DEFAULTS: Record<string, string> = {
  active_curriculum_year: "2027-28",
};

async function ensureDefaults() {
  for (const [key, value] of Object.entries(DEFAULTS)) {
    const existing = await db
      .select()
      .from(portalSettingsTable)
      .where(eq(portalSettingsTable.key, key));
    if (existing.length === 0) {
      await db.insert(portalSettingsTable).values({ key, value });
    }
  }
}

// GET /api/admin/settings — returns all settings as a key-value object
router.get("/", async (_req, res) => {
  await ensureDefaults();
  const rows = await db.select().from(portalSettingsTable);
  const result: Record<string, string> = {};
  for (const row of rows) result[row.key] = row.value;
  res.json(result);
});

// PUT /api/admin/settings — updates one or more settings
// Body: { key: string, value: string } or { settings: Record<string, string> }
router.put("/", async (req, res) => {
  const { key, value, settings } = req.body as {
    key?: string;
    value?: string;
    settings?: Record<string, string>;
  };

  const updates: Record<string, string> = {};

  if (settings && typeof settings === "object") {
    Object.assign(updates, settings);
  } else if (key && value !== undefined) {
    updates[key] = value;
  } else {
    res.status(400).json({ error: "Provide { key, value } or { settings: {...} }" });
    return;
  }

  for (const [k, v] of Object.entries(updates)) {
    await db
      .insert(portalSettingsTable)
      .values({ key: k, value: v })
      .onConflictDoUpdate({
        target: portalSettingsTable.key,
        set: { value: v, updatedAt: new Date() },
      });
  }

  res.json({ success: true, updated: Object.keys(updates) });
});

export default router;
