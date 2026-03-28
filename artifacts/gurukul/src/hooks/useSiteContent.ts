import { useState, useEffect } from "react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export const SITE_CONTENT_DEFAULTS: Record<string, string> = {
  home_hero_headline:  "Rooted in Tradition, Growing in Wisdom.",
  home_hero_subtitle:  "Empowering the next generation with cultural knowledge, spiritual values, and a profound understanding of Sanatana Dharma.",
  home_cta_title:      "Ready to join the Gurukul family?",
  home_cta_subtitle:   "Enroll today and give your child the gift of cultural heritage.",
  about_header_desc:   "Preserving and passing on the rich heritage of Sanatana Dharma to the next generation.",
  about_mission_p1:    "The Bhartiya Hindu Temple Gurukul is dedicated to providing a nurturing environment where children can learn, appreciate, and practice the values, culture, and traditions of Sanatana Dharma.",
  about_mission_p2:    "We believe that early exposure to our spiritual heritage builds character, instills confidence, and creates a strong foundation for a meaningful life.",
  about_core_values:   "Dharma (Righteousness & Duty)\nVidya (True Knowledge)\nSeva (Selfless Service)\nBhakti (Devotion)",
  contact_header_desc: "We are here to answer your questions and welcome you to our community.",
  contact_address:     "3671 Hyatts Rd\nPowell, OH 43065",
  contact_phone:       "(740) 369-0717",
  contact_email:       "gurukul@bhtohio.org",
  footer_tagline:      "Nurturing the next generation with the profound wisdom, culture, and values of Sanatana Dharma in a welcoming community environment.",
  footer_facebook_url: "",
  footer_instagram_url:"",
};

// Module-level cache so we only fetch once per session
const _cache: { data: Record<string, string> | null; promise: Promise<void> | null } = {
  data: null,
  promise: null,
};

function fetchContent(): Promise<void> {
  if (_cache.promise) return _cache.promise;
  _cache.promise = fetch(`${BASE}/api/settings`)
    .then(r => r.json())
    .then((data: Record<string, string>) => {
      _cache.data = { ...SITE_CONTENT_DEFAULTS, ...data };
    })
    .catch(() => {
      _cache.data = { ...SITE_CONTENT_DEFAULTS };
    });
  return _cache.promise;
}

export function useSiteContent() {
  const [content, setContent] = useState<Record<string, string>>(
    _cache.data ?? SITE_CONTENT_DEFAULTS
  );

  useEffect(() => {
    if (_cache.data) {
      setContent(_cache.data);
      return;
    }
    fetchContent().then(() => {
      if (_cache.data) setContent(_cache.data);
    });
  }, []);

  function get(key: string): string {
    return content[key] ?? SITE_CONTENT_DEFAULTS[key] ?? "";
  }

  return { get, content };
}

/** Invalidate cache (call after admin saves new content) */
export function invalidateSiteContentCache() {
  _cache.data = null;
  _cache.promise = null;
}
