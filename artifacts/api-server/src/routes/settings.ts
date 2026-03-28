/**
 * Public settings endpoint — no auth required.
 * Returns only the settings that are safe to expose publicly.
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
  // ── Site content ───────────────────────────────────────────────────────────
  "home_hero_headline",
  "home_hero_subtitle",
  "home_cta_title",
  "home_cta_subtitle",
  "about_header_desc",
  "about_mission_p1",
  "about_mission_p2",
  "about_core_values",
  "contact_header_desc",
  "contact_address",
  "contact_phone",
  "contact_email",
  "footer_tagline",
  "footer_facebook_url",
  "footer_instagram_url",
] as const;

export const SITE_CONTENT_DEFAULTS: Record<string, string> = {
  active_curriculum_year: "2027-28",
  stripe_membership_fee:  "150",
  stripe_course_fee:      "35",
  home_hero_headline:     "Rooted in Tradition, Growing in Wisdom.",
  home_hero_subtitle:     "Empowering the next generation with cultural knowledge, spiritual values, and a profound understanding of Sanatana Dharma.",
  home_cta_title:         "Ready to join the Gurukul family?",
  home_cta_subtitle:      "Enroll today and give your child the gift of cultural heritage.",
  about_header_desc:      "Preserving and passing on the rich heritage of Sanatana Dharma to the next generation.",
  about_mission_p1:       "The Bhartiya Hindu Temple Gurukul is dedicated to providing a nurturing environment where children can learn, appreciate, and practice the values, culture, and traditions of Sanatana Dharma.",
  about_mission_p2:       "We believe that early exposure to our spiritual heritage builds character, instills confidence, and creates a strong foundation for a meaningful life.",
  about_core_values:      "Dharma (Righteousness & Duty)\nVidya (True Knowledge)\nSeva (Selfless Service)\nBhakti (Devotion)",
  contact_header_desc:    "We are here to answer your questions and welcome you to our community.",
  contact_address:        "3671 Hyatts Rd\nPowell, OH 43065",
  contact_phone:          "(740) 369-0717",
  contact_email:          "gurukul@bhtohio.org",
  footer_tagline:         "Nurturing the next generation with the profound wisdom, culture, and values of Sanatana Dharma in a welcoming community environment.",
  footer_facebook_url:    "",
  footer_instagram_url:   "",
};

// GET /api/settings — public, returns only safe settings
router.get("/", async (_req, res) => {
  const result: Record<string, string> = { ...SITE_CONTENT_DEFAULTS };
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
