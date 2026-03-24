import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Calendar, CheckCircle2, XCircle, Clock, Save,
  Users, AlertCircle, Loader2, ChevronDown, ChevronRight,
  AlertTriangle, TrendingDown,
} from "lucide-react";
import { useAuth } from "../AuthContext";
import { Button } from "@/components/ui/button";
import { adminApi } from "@/lib/adminApi";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

type AttStatus = "Present" | "Absent" | "Late";

type RawLevel = { id: number; className: string; courseName: string; schedule: string };
type SectionOption = { id: number; sectionName: string; schedule: string };
type StudentRow = { studentId: number; studentCode: string; name: string; status: AttStatus };
type HistoryRow = {
  id: number;
  studentId: number;
  studentName: string;
  studentCode: string;
  date: string;
  status: AttStatus;
  recordedBy: string;
};

const STATUS_OPTS: AttStatus[] = ["Present", "Absent", "Late"];
const STATUS_COLORS: Record<AttStatus, string> = {
  Present: "bg-green-100 text-green-800 border-green-300",
  Absent:  "bg-red-100  text-red-800  border-red-300",
  Late:    "bg-yellow-100 text-yellow-800 border-yellow-300",
};
const STATUS_ICONS: Record<AttStatus, React.ElementType> = {
  Present: CheckCircle2,
  Absent:  XCircle,
  Late:    Clock,
};

function todayStr() { return new Date().toISOString().split("T")[0]; }

function formatDate(d: string) {
  const dt = new Date(d + "T00:00:00");
  return dt.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}

// ─── Per-student streak computation ──────────────────────────────────────────
// Returns studentId → number of consecutive "Absent" records counting back from most recent date
function computeAbsentStreaks(history: HistoryRow[]): Record<number, number> {
  const byStudent: Record<number, HistoryRow[]> = {};
  for (const r of history) {
    if (!byStudent[r.studentId]) byStudent[r.studentId] = [];
    byStudent[r.studentId].push(r);
  }
  const streaks: Record<number, number> = {};
  for (const [sid, rows] of Object.entries(byStudent)) {
    const sorted = [...rows].sort((a, b) => b.date.localeCompare(a.date));
    let streak = 0;
    for (const row of sorted) {
      if (row.status === "Absent") streak++;
      else break;
    }
    streaks[Number(sid)] = streak;
  }
  return streaks;
}

// ─── History Panel ────────────────────────────────────────────────────────────

type DateGroup = {
  date: string;
  rows: HistoryRow[];
  present: number;
  absent: number;
  late: number;
  total: number;
};

function HistoryPanel({ history }: { history: HistoryRow[] }) {
  // Compute consecutive absence streaks across the full history
  const streaks = useMemo(() => computeAbsentStreaks(history), [history]);

  // Group by date, sorted descending
  const dateGroups = useMemo<DateGroup[]>(() => {
    const map: Record<string, HistoryRow[]> = {};
    for (const r of history) {
      if (!map[r.date]) map[r.date] = [];
      map[r.date].push(r);
    }
    return Object.entries(map)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([date, rows]) => {
        const present = rows.filter(r => r.status === "Present").length;
        const absent  = rows.filter(r => r.status === "Absent").length;
        const late    = rows.filter(r => r.status === "Late").length;
        return { date, rows, present, absent, late, total: rows.length };
      });
  }, [history]);

  // Overall stats across all dates (unique students + overall rates)
  const overall = useMemo(() => {
    const totalRecords = history.length;
    const present = history.filter(r => r.status === "Present").length;
    const absent  = history.filter(r => r.status === "Absent").length;
    const late    = history.filter(r => r.status === "Late").length;
    const alertStudents = Object.values(streaks).filter(s => s > 2).length;
    return { totalRecords, present, absent, late, alertStudents, sessions: dateGroups.length };
  }, [history, streaks, dateGroups]);

  // Which date groups are expanded (default: only the latest)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  useEffect(() => {
    if (dateGroups.length > 0) {
      setExpanded({ [dateGroups[0].date]: true });
    }
  }, [dateGroups.length]);

  const toggle = (date: string) => setExpanded(prev => ({ ...prev, [date]: !prev[date] }));

  if (history.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-border p-12 text-center text-muted-foreground text-sm">
        No attendance records yet for this class.
      </div>
    );
  }

  return (
    <div className="space-y-4">

      {/* ── Overall summary cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-border p-4 text-center">
          <div className="text-2xl font-bold text-secondary">{overall.sessions}</div>
          <div className="text-xs text-muted-foreground mt-0.5">Sessions recorded</div>
        </div>
        <div className="bg-green-50 rounded-xl border border-green-200 p-4 text-center">
          <div className="text-2xl font-bold text-green-700">
            {overall.totalRecords > 0 ? Math.round((overall.present / overall.totalRecords) * 100) : 0}%
          </div>
          <div className="text-xs text-green-600 mt-0.5">Avg attendance rate</div>
        </div>
        <div className="bg-red-50 rounded-xl border border-red-200 p-4 text-center">
          <div className="text-2xl font-bold text-red-700">{overall.absent}</div>
          <div className="text-xs text-red-600 mt-0.5">Total absences</div>
        </div>
        {overall.alertStudents > 0 ? (
          <div className="bg-amber-50 rounded-xl border border-amber-300 p-4 text-center">
            <div className="text-2xl font-bold text-amber-700 flex items-center justify-center gap-1">
              <AlertTriangle className="w-5 h-5" />{overall.alertStudents}
            </div>
            <div className="text-xs text-amber-600 mt-0.5">Students with 3+ absences in a row</div>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-border p-4 text-center">
            <div className="text-2xl font-bold text-secondary">{overall.late}</div>
            <div className="text-xs text-muted-foreground mt-0.5">Total late arrivals</div>
          </div>
        )}
      </div>

      {/* ── Date groups ── */}
      <div className="space-y-3">
        {dateGroups.map(group => {
          const isOpen = !!expanded[group.date];
          const presentPct = group.total > 0 ? Math.round((group.present / group.total) * 100) : 0;
          const absentPct  = group.total > 0 ? Math.round((group.absent  / group.total) * 100) : 0;
          const latePct    = group.total > 0 ? Math.round((group.late    / group.total) * 100) : 0;

          const alertInGroup = group.rows.some(r => (streaks[r.studentId] ?? 0) > 2);

          return (
            <div key={group.date} className="bg-white rounded-xl border border-border overflow-hidden shadow-sm">
              {/* Date header */}
              <button
                onClick={() => toggle(group.date)}
                className="w-full px-5 py-4 flex items-center gap-4 hover:bg-gray-50 transition-colors text-left"
              >
                <div className="shrink-0 text-muted-foreground">
                  {isOpen
                    ? <ChevronDown  className="w-4 h-4" />
                    : <ChevronRight className="w-4 h-4" />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-secondary text-sm">{formatDate(group.date)}</span>
                    {alertInGroup && (
                      <span className="inline-flex items-center gap-1 text-xs bg-amber-100 text-amber-700 border border-amber-300 px-2 py-0.5 rounded-full font-medium">
                        <AlertTriangle className="w-3 h-3" /> Streak alert
                      </span>
                    )}
                  </div>

                  {/* Visual attendance bar */}
                  <div className="mt-2 flex items-center gap-3">
                    <div className="flex-1 h-2 rounded-full overflow-hidden bg-gray-100 flex">
                      <div className="h-full bg-green-500 transition-all" style={{ width: `${presentPct}%` }} />
                      <div className="h-full bg-yellow-400 transition-all" style={{ width: `${latePct}%` }} />
                      <div className="h-full bg-red-400 transition-all"   style={{ width: `${absentPct}%` }} />
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0 flex-wrap">
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
                        <span className="font-medium text-green-700">{presentPct}%</span> present
                      </span>
                      {group.absent > 0 && (
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-red-400 inline-block" />
                          <span className="font-medium text-red-600">{group.absent}</span> absent
                        </span>
                      )}
                      {group.late > 0 && (
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" />
                          <span className="font-medium text-yellow-600">{group.late}</span> late
                        </span>
                      )}
                      <span className="text-muted-foreground">{group.total} students</span>
                    </div>
                  </div>
                </div>
              </button>

              {/* Student rows */}
              {isOpen && (
                <div className="border-t border-border divide-y divide-border">
                  {group.rows
                    .slice()
                    .sort((a, b) => a.studentName.localeCompare(b.studentName))
                    .map(r => {
                      const Icon   = STATUS_ICONS[r.status];
                      const streak = streaks[r.studentId] ?? 0;
                      const alert  = streak > 2;
                      return (
                        <div
                          key={r.id}
                          className={`flex items-center gap-3 px-5 py-3 ${alert ? "bg-amber-50/60" : "hover:bg-gray-50"} transition-colors`}
                        >
                          {/* Avatar */}
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                            alert ? "bg-amber-200 text-amber-800" : "bg-primary/10 text-primary"
                          }`}>
                            {r.studentName.split(" ").map(n => n[0]).join("").slice(0, 2)}
                          </div>

                          {/* Name + code */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-medium text-secondary">{r.studentName}</span>
                              <span className="text-xs font-mono text-muted-foreground">{r.studentCode}</span>
                              {alert && (
                                <span className="inline-flex items-center gap-1 text-xs bg-amber-100 text-amber-700 border border-amber-300 px-1.5 py-0.5 rounded-full font-medium">
                                  <TrendingDown className="w-3 h-3" />
                                  {streak} absences in a row
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground mt-0.5">
                              Recorded by {r.recordedBy}
                            </div>
                          </div>

                          {/* Status badge */}
                          <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border font-medium shrink-0 ${STATUS_COLORS[r.status]}`}>
                            <Icon className="w-3 h-3" />{r.status}
                          </span>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Attendance() {
  const { user } = useAuth();

  const [allLevels,      setAllLevels]      = useState<RawLevel[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [selectedLevelId, setSelectedLevelId] = useState<number | null>(null);
  const [sections,       setSections]       = useState<SectionOption[]>([]);
  const [selectedSection, setSelectedSection] = useState<number | null>(null);

  const [date,     setDate]     = useState(todayStr());
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [existing, setExisting] = useState<Record<number, AttStatus>>({});
  const [history,  setHistory]  = useState<HistoryRow[]>([]);

  const [loadingLevels,    setLoadingLevels]    = useState(true);
  const [loadingSections,  setLoadingSections]  = useState(false);
  const [loadingStudents,  setLoadingStudents]  = useState(false);
  const [loadingHistory,   setLoadingHistory]   = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);
  const [tab, setTab] = useState<"mark" | "history">("mark");

  const courseNames     = Array.from(new Set(allLevels.map(l => l.courseName))).sort();
  const levelsForCourse = allLevels.filter(l => l.courseName === selectedCourse);

  // ── Load levels on mount ──
  useEffect(() => {
    setLoadingLevels(true);
    adminApi.courses.levels()
      .then(data => {
        const rows = data as RawLevel[];
        setAllLevels(rows);
        const names = Array.from(new Set(rows.map(l => l.courseName)));
        if (names.length === 1) {
          setSelectedCourse(names[0]);
          const levelsInCourse = rows.filter(l => l.courseName === names[0]);
          if (levelsInCourse.length === 1) setSelectedLevelId(levelsInCourse[0].id);
        }
      })
      .catch(() => toast.error("Failed to load classes"))
      .finally(() => setLoadingLevels(false));
  }, []);

  // ── When level changes → load sections ──
  useEffect(() => {
    setSections([]);
    setSelectedSection(null);
    setStudents([]);
    setExisting({});
    setHistory([]);
    if (!selectedLevelId) return;

    setLoadingSections(true);
    adminApi.courses.levelSections(selectedLevelId)
      .then(data => {
        const s = data as SectionOption[];
        setSections(s);
        if (s.length === 1) setSelectedSection(s[0].id);
      })
      .catch(() => setSections([]))
      .finally(() => setLoadingSections(false));
  }, [selectedLevelId]);

  const loadStudents = useCallback(async (levelId: number, sectionId: number | null) => {
    setLoadingStudents(true);
    try {
      const data = await adminApi.courses.levelStudents(levelId, sectionId) as {
        studentId: number; studentCode: string; studentName: string;
      }[];
      setStudents(data.map(s => ({ studentId: s.studentId, studentCode: s.studentCode, name: s.studentName, status: "Present" })));
    } catch { setStudents([]); }
    finally  { setLoadingStudents(false); }
  }, []);

  const loadAttendance = useCallback(async (levelId: number, d: string) => {
    try {
      const data = await adminApi.attendance.get(levelId, d) as { studentId: number; status: AttStatus }[];
      const map: Record<number, AttStatus> = {};
      data.forEach(r => { map[r.studentId] = r.status; });
      setExisting(map);
      setStudents(prev => prev.map(s => ({ ...s, status: map[s.studentId] ?? "Present" })));
    } catch { setExisting({}); }
  }, []);

  const loadHistory = useCallback(async (levelId: number) => {
    setLoadingHistory(true);
    try {
      const data = await adminApi.attendance.history(levelId) as HistoryRow[];
      setHistory(data);
    } catch { setHistory([]); }
    finally { setLoadingHistory(false); }
  }, []);

  useEffect(() => {
    if (!selectedLevelId) return;
    loadStudents(selectedLevelId, selectedSection).then(() => loadAttendance(selectedLevelId, date));
    loadHistory(selectedLevelId);
  }, [selectedLevelId, selectedSection, date]);

  function setStatus(studentId: number, status: AttStatus) {
    setStudents(prev => prev.map(s => s.studentId === studentId ? { ...s, status } : s));
  }

  async function handleSave() {
    if (!selectedLevelId || !user) return;
    const secLabel = sections.find(s => s.id === selectedSection)?.sectionName ?? "";
    setSaving(true);
    try {
      await adminApi.attendance.save({
        courseLevelId: selectedLevelId,
        date,
        records: students.map(s => ({ studentId: s.studentId, status: s.status })),
        recordedBy: (user.displayName ?? user.email ?? "Unknown") + (secLabel ? ` [${secLabel}]` : ""),
      });
      setSaved(true);
      toast.success("Attendance saved!");
      setTimeout(() => setSaved(false), 3000);
      loadHistory(selectedLevelId);
    } catch {
      toast.error("Failed to save attendance. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const levelLabel   = allLevels.find(l => l.id === selectedLevelId)?.className ?? "";
  const sectionLabel = sections.find(s => s.id === selectedSection)?.sectionName ?? "All Students";

  const summary = {
    present: students.filter(s => s.status === "Present").length,
    absent:  students.filter(s => s.status === "Absent").length,
    late:    students.filter(s => s.status === "Late").length,
  };

  const ready = !!selectedLevelId;

  return (
    <div className="space-y-6">

      {/* ── Selector Panel ── */}
      <div className="bg-white rounded-xl shadow-sm border border-border p-5 space-y-4">
        <h2 className="text-sm font-semibold text-secondary">Select Class</h2>

        {loadingLevels ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading your assigned classes…
          </div>
        ) : courseNames.length === 0 ? (
          <p className="text-sm text-muted-foreground py-2">
            No classes are assigned to you yet. Please contact the admin.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">

            {/* Course */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide">Course</label>
              {courseNames.length === 1 ? (
                <div className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-gray-50 text-secondary font-medium">{courseNames[0]}</div>
              ) : (
                <select
                  className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-primary"
                  value={selectedCourse}
                  onChange={e => { setSelectedCourse(e.target.value); setSelectedLevelId(null); setSelectedSection(null); setSections([]); setStudents([]); setSaved(false); }}
                >
                  <option value="">Choose course…</option>
                  {courseNames.map(name => <option key={name} value={name}>{name}</option>)}
                </select>
              )}
            </div>

            {/* Level */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide">Level / Class</label>
              {levelsForCourse.length === 1 ? (
                <div className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-gray-50 text-secondary font-medium">
                  {levelsForCourse[0].className}{levelsForCourse[0].schedule ? ` (${levelsForCourse[0].schedule})` : ""}
                </div>
              ) : (
                <select
                  className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-primary disabled:opacity-50"
                  value={selectedLevelId ?? ""}
                  disabled={!selectedCourse || levelsForCourse.length === 0}
                  onChange={e => { setSelectedLevelId(e.target.value ? Number(e.target.value) : null); setSelectedSection(null); setSaved(false); }}
                >
                  <option value="">Choose level…</option>
                  {levelsForCourse.map(l => <option key={l.id} value={l.id}>{l.className}{l.schedule ? ` (${l.schedule})` : ""}</option>)}
                </select>
              )}
            </div>

            {/* Section */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Section{loadingSections && <span className="text-muted-foreground font-normal ml-1">(loading…)</span>}
              </label>
              {!loadingSections && sections.length === 1 ? (
                <div className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-gray-50 text-secondary font-medium">
                  {sections[0].sectionName}{sections[0].schedule ? ` (${sections[0].schedule})` : ""}
                </div>
              ) : (
                <select
                  className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-primary disabled:opacity-50"
                  value={selectedSection ?? ""}
                  disabled={!selectedLevelId || loadingSections}
                  onChange={e => { setSelectedSection(e.target.value ? Number(e.target.value) : null); setSaved(false); }}
                >
                  <option value="">All Students</option>
                  {sections.map(s => <option key={s.id} value={s.id}>{s.sectionName}{s.schedule ? ` (${s.schedule})` : ""}</option>)}
                </select>
              )}
              {selectedLevelId && !loadingSections && sections.length === 0 && (
                <p className="text-xs text-muted-foreground mt-1">No sections — showing all enrolled students.</p>
              )}
            </div>

            {/* Date */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide">Date</label>
              <input
                type="date"
                value={date}
                onChange={e => { setDate(e.target.value); setSaved(false); }}
                className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-primary"
              />
            </div>
          </div>
        )}

        {/* Context pills */}
        {ready && (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-0.5 rounded-full font-medium">{selectedCourse}</span>
            <span className="text-xs text-muted-foreground">›</span>
            <span className="text-xs bg-primary/8 text-primary border border-primary/20 px-2.5 py-0.5 rounded-full font-medium">{levelLabel}</span>
            {selectedSection && (
              <>
                <span className="text-xs text-muted-foreground">›</span>
                <span className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-0.5 rounded-full font-medium">{sectionLabel}</span>
              </>
            )}
            <span className="text-xs text-muted-foreground ml-auto">{date}</span>
          </div>
        )}
      </div>

      {/* Empty state */}
      {!ready && !loadingLevels && courseNames.length > 0 && (
        <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-border">
          <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-secondary font-semibold mb-1">Select a course and level to begin</p>
          <p className="text-muted-foreground text-sm">Use the dropdowns above to choose a class.</p>
        </div>
      )}

      {/* Main content */}
      {ready && (
        <>
          {/* Tabs */}
          <div className="flex gap-2 border-b border-border">
            {(["mark", "history"] as const).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                  tab === t ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-secondary"
                }`}
              >
                {t === "mark" ? "Mark Attendance" : `History${history.length > 0 ? ` (${new Set(history.map(r => r.date)).size} sessions)` : ""}`}
              </button>
            ))}
          </div>

          {tab === "mark" && (
            <div className="space-y-4">
              {/* Summary cards */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Present", value: summary.present, color: "text-green-600 bg-green-50" },
                  { label: "Absent",  value: summary.absent,  color: "text-red-600 bg-red-50" },
                  { label: "Late",    value: summary.late,    color: "text-yellow-600 bg-yellow-50" },
                ].map(s => (
                  <div key={s.label} className={`rounded-xl p-3 text-center ${s.color}`}>
                    <div className="text-2xl font-bold">{s.value}</div>
                    <div className="text-xs font-medium">{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Student list */}
              <div className="bg-white rounded-xl shadow-sm border border-border overflow-hidden">
                <div className="px-5 py-3.5 border-b border-border flex items-center gap-2">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-semibold text-secondary">
                    {students.length} Student{students.length !== 1 ? "s" : ""}
                    <span className="text-muted-foreground font-normal"> — {selectedSection ? sectionLabel : "All enrolled"}</span>
                  </span>
                  {Object.keys(existing).length > 0 && (
                    <span className="ml-auto text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">Editing saved record</span>
                  )}
                </div>

                {loadingStudents ? (
                  <div className="p-8 text-center text-muted-foreground text-sm flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> Loading students…
                  </div>
                ) : students.length === 0 ? (
                  <div className="p-8 text-center">
                    <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground text-sm">No students enrolled in this class.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {students.map(s => {
                      const Icon = STATUS_ICONS[s.status];
                      return (
                        <div key={s.studentId} className="flex items-center gap-4 px-5 py-3.5">
                          <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-xs font-bold text-amber-800 shrink-0">
                            {s.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-secondary">{s.name}</p>
                            <p className="text-xs text-muted-foreground">{s.studentCode}</p>
                          </div>
                          <div className="flex gap-1.5">
                            {STATUS_OPTS.map(opt => {
                              const OptIcon = STATUS_ICONS[opt];
                              return (
                                <button
                                  key={opt}
                                  onClick={() => setStatus(s.studentId, opt)}
                                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                                    s.status === opt ? STATUS_COLORS[opt] : "border-gray-200 text-gray-400 hover:border-gray-300"
                                  }`}
                                >
                                  <OptIcon className="w-3 h-3" />
                                  <span className="hidden sm:inline">{opt}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {students.length > 0 && (
                  <div className="px-5 py-4 bg-gray-50 border-t border-border flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                      Recording for <span className="font-medium">{date}</span>
                      {selectedSection && <> · <span className="font-medium">{sectionLabel}</span></>}
                    </p>
                    <Button onClick={handleSave} disabled={saving || students.length === 0} className="flex items-center gap-2">
                      {saving
                        ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
                        : saved
                          ? <><CheckCircle2 className="w-4 h-4" /> Saved!</>
                          : <><Save className="w-4 h-4" /> Save Attendance</>}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {tab === "history" && (
            loadingHistory ? (
              <div className="flex items-center justify-center gap-2 text-muted-foreground py-12">
                <Loader2 className="w-5 h-5 animate-spin" /> Loading history…
              </div>
            ) : (
              <HistoryPanel history={history} />
            )
          )}
        </>
      )}
    </div>
  );
}
