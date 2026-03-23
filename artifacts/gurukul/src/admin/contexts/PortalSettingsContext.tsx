import { createContext, useContext, useEffect, useState, useCallback } from "react";

// ─── Curriculum year list generation ─────────────────────────────────────────
// 50 years starting from 2024, in two formats:
//   short:  "2024-25", "2025-26", … "2073-74"   (courses, filters)
//   long:   "2024-2025", "2025-2026", … (students, registration)

const START_YEAR = 2024;
const NUM_YEARS  = 50;

export const CURRICULUM_YEARS_SHORT: string[] = Array.from({ length: NUM_YEARS }, (_, i) => {
  const s = START_YEAR + i;
  return `${s}-${String(s + 1).slice(-2)}`;
});

export const CURRICULUM_YEARS_LONG: string[] = Array.from({ length: NUM_YEARS }, (_, i) => {
  const s = START_YEAR + i;
  return `${s}-${s + 1}`;
});

/** Convert a short year "2027-28" to long "2027-2028" */
export function shortToLong(short: string): string {
  const [startStr, endSlice] = short.split("-");
  if (!startStr || !endSlice) return short;
  const start = parseInt(startStr, 10);
  const end = endSlice.length === 2
    ? Math.floor(start / 100) * 100 + parseInt(endSlice, 10)
    : parseInt(endSlice, 10);
  return `${start}-${end}`;
}

/** Convert a long year "2027-2028" to short "2027-28" */
export function longToShort(long: string): string {
  const [startStr, endStr] = long.split("-");
  if (!startStr || !endStr) return long;
  return `${startStr}-${endStr.slice(-2)}`;
}

// ─── Context shape ────────────────────────────────────────────────────────────

interface PortalSettingsContextValue {
  /** Active curriculum year in short format e.g. "2027-28" */
  activeCurriculumYear: string;
  /** Active curriculum year in long format e.g. "2027-2028" */
  activeCurriculumYearLong: string;
  /** Full 50-year list in short format */
  curriculumYears: string[];
  /** Full 50-year list in long format */
  curriculumYearsLong: string[];
  /** Whether the settings are still loading from the API */
  loading: boolean;
  /** Update the active curriculum year (admin only). Saves to the API. */
  setActiveCurriculumYear: (year: string) => Promise<void>;
}

const PortalSettingsContext = createContext<PortalSettingsContextValue>({
  activeCurriculumYear:     "2027-28",
  activeCurriculumYearLong: "2027-2028",
  curriculumYears:          CURRICULUM_YEARS_SHORT,
  curriculumYearsLong:      CURRICULUM_YEARS_LONG,
  loading:                  true,
  setActiveCurriculumYear:  async () => {},
});

// ─── Provider ─────────────────────────────────────────────────────────────────

export function PortalSettingsProvider({ children }: { children: React.ReactNode }) {
  const [activeYear, setActiveYear] = useState("2027-28");
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}api/settings`)
      .then(r => r.json())
      .then((data: Record<string, string>) => {
        if (data.active_curriculum_year) setActiveYear(data.active_curriculum_year);
      })
      .catch(() => { /* fall back to default */ })
      .finally(() => setLoading(false));
  }, []);

  const setActiveCurriculumYear = useCallback(async (year: string) => {
    setActiveYear(year);
    await fetch(`${import.meta.env.BASE_URL}api/admin/settings`, {
      method:  "PUT",
      headers: { "Content-Type": "application/json", "x-user-role": "admin" },
      body:    JSON.stringify({ key: "active_curriculum_year", value: year }),
    });
  }, []);

  return (
    <PortalSettingsContext.Provider value={{
      activeCurriculumYear:     activeYear,
      activeCurriculumYearLong: shortToLong(activeYear),
      curriculumYears:          CURRICULUM_YEARS_SHORT,
      curriculumYearsLong:      CURRICULUM_YEARS_LONG,
      loading,
      setActiveCurriculumYear,
    }}>
      {children}
    </PortalSettingsContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function usePortalSettings() {
  return useContext(PortalSettingsContext);
}
