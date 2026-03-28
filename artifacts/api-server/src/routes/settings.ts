/**
 * Public settings endpoint — no auth required.
 * Returns only the settings that are safe to expose publicly
 * (e.g., active_curriculum_year for the public registration form).
 */
import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { portalSettingsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

const PUBLIC_KEYS = [
  "active_curriculum_year",
  "stripe_membership_fee",
  "stripe_course_fee",
] as const;

const DEFAULTS: Record<string, string> = {
  active_curriculum_year: "2027-28",
  stripe_membership_fee:  "150",
  stripe_course_fee:      "35",
};

// GET /api/settings — public, returns only safe settings
router.get("/", async (_req, res) => {
  const result: Record<string, string> = { ...DEFAULTS };
  for (const key of PUBLIC_KEYS) {
    const [row] = await db
      .select()
      .from(portalSettingsTable)
      .where(eq(portalSettingsTable.key, key));
    if (row) result[key] = row.value;
  }
  res.json(result);
});

export default router;
