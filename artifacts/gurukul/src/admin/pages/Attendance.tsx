import { useState, useEffect, useCallback } from "react";
import { Calendar, CheckCircle2, XCircle, Clock, Save, ChevronDown, Users, AlertCircle, Tag } from "lucide-react";
import { useAuth } from "../AuthContext";
import { Button } from "@/components/ui/button";
import { adminApi } from "@/lib/adminApi";
import { toast } from "sonner";

type AttStatus = "Present" | "Absent" | "Late";

type LevelOption = {
  id: number; label: string; courseName: string; schedule: string;
};

type SectionOption = {
  id: number; sectionName: string; schedule: string;
};

type StudentRow = {
  studentId: number; studentCode: string; name: string; parentName: string; status: AttStatus;
};

type HistoryRow = {
  id: number; studentName: string; studentCode: string;
  date: string; status: AttStatus; recordedBy: string;
};

const STATUS_OPTS: AttStatus[] = ["Present", "Absent", "Late"];
const STATUS_COLORS: Record<AttStatus, string> = {
  Present: "bg-green-100 text-green-800 border-green-300",
  Absent:  "bg-red-100  text-red-800  border-red-300",
  Late:    "bg-yellow-100 text-yellow-800 border-yellow-300",
};
const STATUS_ICONS: Record<AttStatus, React.ElementType> = {
  Present: CheckCircle2, Absent: XCircle, Late: Clock,
};

function todayStr() { return new Date().toISOString().split("T")[0]; }

export default function Attendance() {
  const { user } = useAuth();
  const [levels, setLevels]                   = useState<LevelOption[]>([]);
  const [selectedLevel, setLevel]             = useState<number | null>(null);
  const [sections, setSections]               = useState<SectionOption[]>([]);
  const [selectedSection, setSelectedSection] = useState<number | null>(null);
  const [date, setDate]                       = useState(todayStr());
  const [students, setStudents]               = useState<StudentRow[]>([]);
  const [existing, setExisting]               = useState<Record<number, AttStatus>>({});
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [loadingSections, setLoadingSections] = useState(false);
  const [loadingAtt, setLoadingAtt]           = useState(false);
  const [saving, setSaving]                   = useState(false);
  const [saved, setSaved]                     = useState(false);
  const [history, setHistory]                 = useState<HistoryRow[]>([]);
  const [tab, setTab]                         = useState<"mark" | "history">("mark");

  // Load all levels on mount
  useEffect(() => {
    adminApi.courses.levels()
      .then((data) => {
        const opts = (data as { id: number; className: string; courseName: string; schedule: string }[]).map(l => ({
          id: l.id,
          label: `${l.courseName} – ${l.className}`,
          courseName: l.courseName,
          schedule: l.schedule ?? "",
        }));
        setLevels(opts);
      })
      .catch(() => {});
  }, []);

  // When level changes, load its sections
  useEffect(() => {
    if (!selectedLevel) { setSections([]); setSelectedSection(null); return; }
    setLoadingSections(true);
    adminApi.courses.levelSections(selectedLevel)
      .then((data) => {
        const s = (data as SectionOption[]);
        setSections(s);
        setSelectedSection(null);
      })
      .catch(() => setSections([]))
      .finally(() => setLoadingSections(false));
  }, [selectedLevel]);

  const loadStudents = useCallback(async (levelId: number, sectionId?: number | null) => {
    setLoadingStudents(true);
    try {
      const data = await adminApi.courses.levelStudents(levelId, sectionId) as {
        studentId: number; studentCode: string; studentName: string; parentName: string;
      }[];
      setStudents(data.map(s => ({ studentId: s.studentId, studentCode: s.studentCode, name: s.studentName, parentName: s.parentName, status: "Present" as AttStatus })));
    } catch {
      setStudents([]);
    } finally {
      setLoadingStudents(false);
    }
  }, []);

  const loadAttendance = useCallback(async (levelId: number, d: string) => {
    setLoadingAtt(true);
    try {
      const data = await adminApi.attendance.get(levelId, d) as { studentId: number; status: AttStatus }[];
      const map: Record<number, AttStatus> = {};
      data.forEach(r => { map[r.studentId] = r.status; });
      setExisting(map);
      setStudents(prev => prev.map(s => ({ ...s, status: map[s.studentId] ?? "Present" })));
    } catch {
      setExisting({});
    } finally {
      setLoadingAtt(false);
    }
  }, []);

  const loadHistory = useCallback(async (levelId: number) => {
    try {
      const data = await adminApi.attendance.history(levelId) as HistoryRow[];
      setHistory(data);
    } catch { setHistory([]); }
  }, []);

  useEffect(() => {
    if (!selectedLevel) return;
    loadStudents(selectedLevel, selectedSection).then(() => loadAttendance(selectedLevel, date));
    loadHistory(selectedLevel);
  }, [selectedLevel, selectedSection, date]);

  function setStatus(studentId: number, status: AttStatus) {
    setStudents(prev => prev.map(s => s.studentId === studentId ? { ...s, status } : s));
  }

  async function handleSave() {
    if (!selectedLevel || !user) return;
    const selectedSectionObj = sections.find(s => s.id === selectedSection);
    setSaving(true);
    try {
      await adminApi.attendance.save({
        courseLevelId: selectedLevel,
        date,
        records: students.map(s => ({ studentId: s.studentId, status: s.status })),
        recordedBy: user.displayName + (selectedSectionObj ? ` [${selectedSectionObj.sectionName}]` : ""),
      });
      setSaved(true);
      toast.success("Attendance saved successfully!");
      setTimeout(() => setSaved(false), 3000);
      loadHistory(selectedLevel);
    } catch {
      toast.error("Failed to save attendance. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const selectedLevelLabel = levels.find(l => l.id === selectedLevel)?.label ?? "";
  const selectedSectionLabel = sections.find(s => s.id === selectedSection)?.sectionName ?? "All Students";

  const summary = {
    present: students.filter(s => s.status === "Present").length,
    absent:  students.filter(s => s.status === "Absent").length,
    late:    students.filter(s => s.status === "Late").length,
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="bg-white rounded-xl shadow-sm border border-border p-5">
        <div className="flex flex-wrap gap-4 items-end">
          {/* Level selector */}
          <div className="flex-1 min-w-[220px]">
            <label className="block text-xs font-semibold text-secondary mb-1.5">Select Class / Level</label>
            <div className="relative">
              <select
                value={selectedLevel ?? ""}
                onChange={e => { setLevel(Number(e.target.value)); setSaved(false); }}
                className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-primary appearance-none pr-8"
              >
                <option value="" disabled>Choose a class…</option>
                {levels.map(l => <option key={l.id} value={l.id}>{l.label}</option>)}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          {/* Section selector — shown only when sections exist */}
          {selectedLevel && (
            <div className="flex-1 min-w-[180px]">
              <label className="block text-xs font-semibold text-secondary mb-1.5 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5" /> Section
                {loadingSections && <span className="text-muted-foreground font-normal ml-1">(loading…)</span>}
              </label>
              <div className="relative">
                <select
                  value={selectedSection ?? ""}
                  onChange={e => setSelectedSection(e.target.value ? Number(e.target.value) : null)}
                  className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-primary appearance-none pr-8"
                  disabled={loadingSections}
                >
                  <option value="">All Students</option>
                  {sections.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.sectionName}{s.schedule ? ` (${s.schedule})` : ""}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              </div>
              {sections.length === 0 && !loadingSections && selectedLevel && (
                <p className="text-xs text-muted-foreground mt-1">No sections defined — showing all enrolled students.</p>
              )}
            </div>
          )}

          {/* Date picker */}
          <div>
            <label className="block text-xs font-semibold text-secondary mb-1.5">Date</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="text-sm border border-border rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-primary"
            />
          </div>
        </div>

        {/* Context pill */}
        {selectedLevel && (
          <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
            <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-medium">
              {selectedLevelLabel}
            </span>
            {selectedSection && (
              <>
                <span>→</span>
                <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                  <Tag className="w-3 h-3" /> {selectedSectionLabel}
                </span>
              </>
            )}
          </div>
        )}
      </div>

      {selectedLevel && (
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
                {t === "mark" ? "Mark Attendance" : "History"}
              </button>
            ))}
          </div>

          {tab === "mark" && (
            <div className="space-y-4">
              {/* Summary */}
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
                    {selectedSection
                      ? <span className="text-muted-foreground font-normal"> — {selectedSectionLabel}</span>
                      : <span className="text-muted-foreground font-normal"> (all enrolled)</span>
                    }
                  </span>
                  {Object.keys(existing).length > 0 && (
                    <span className="ml-auto text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                      Editing saved record
                    </span>
                  )}
                </div>

                {loadingStudents ? (
                  <div className="p-8 text-center text-muted-foreground text-sm">Loading students…</div>
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
                            <p className="text-xs text-muted-foreground">{s.studentCode} · Parent: {s.parentName}</p>
                          </div>
                          <div className="flex gap-1.5">
                            {STATUS_OPTS.map(opt => {
                              const OptIcon = STATUS_ICONS[opt];
                              return (
                                <button
                                  key={opt}
                                  onClick={() => setStatus(s.studentId, opt)}
                                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                                    s.status === opt
                                      ? STATUS_COLORS[opt]
                                      : "border-gray-200 text-gray-400 hover:border-gray-300"
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
                      Recording for: <span className="font-medium">{date}</span>
                      {selectedSection && (
                        <> · Section: <span className="font-medium">{selectedSectionLabel}</span></>
                      )}
                    </p>
                    <Button onClick={handleSave} disabled={saving || students.length === 0} className="flex items-center gap-2">
                      {saving ? <span>Saving…</span> : saved ? <><CheckCircle2 className="w-4 h-4" /> Saved!</> : <><Save className="w-4 h-4" /> Save Attendance</>}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {tab === "history" && (
            <div className="bg-white rounded-xl shadow-sm border border-border overflow-hidden">
              <div className="px-5 py-3.5 border-b border-border">
                <h3 className="text-sm font-semibold text-secondary">Attendance History</h3>
              </div>
              {history.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-sm">No attendance records yet.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-border">
                      <tr>
                        {["Date", "Student", "Code", "Status", "Recorded By"].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {history.map(r => {
                        const Icon = STATUS_ICONS[r.status];
                        return (
                          <tr key={r.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-secondary font-medium">{r.date}</td>
                            <td className="px-4 py-3 text-secondary">{r.studentName}</td>
                            <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{r.studentCode}</td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium ${STATUS_COLORS[r.status]}`}>
                                <Icon className="w-3 h-3" />{r.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-muted-foreground text-xs">{r.recordedBy}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {!selectedLevel && (
        <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-border">
          <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-secondary font-semibold mb-1">Select a class to get started</p>
          <p className="text-muted-foreground text-sm">Choose a course level above to view students and mark attendance.</p>
        </div>
      )}
    </div>
  );
}
