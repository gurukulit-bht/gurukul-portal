import { useState, useEffect, useCallback } from "react";
import { adminApi } from "@/lib/adminApi";
import {
  Edit2, Check, X, Users, BookOpen, Loader2,
  ChevronDown, ChevronRight, GraduationCap, Phone, Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type LevelStudent = {
  enrollmentId: number;
  enrollDate: string;
  enrollStatus: "Enrolled" | "Completed" | "Withdrawn";
  studentId: number;
  studentCode: string;
  studentName: string;
  parentName: string;
  email: string | null;
  phone: string | null;
  motherName: string | null;
  motherPhone: string | null;
  motherEmail: string | null;
  fatherName: string | null;
  fatherPhone: string | null;
  fatherEmail: string | null;
};

type CourseLevel = {
  id: number; level: number; className: string; schedule: string; teacher: string;
  enrolled: number; capacity: number; status: "Active" | "Inactive";
};

type AdminCourse = {
  id: number; name: string; icon: string; description: string;
  curriculumYear: string | null; levels: CourseLevel[];
};

const ENROLL_COLORS: Record<string, string> = {
  Enrolled: "bg-blue-100 text-blue-700",
  Completed: "bg-purple-100 text-purple-700",
  Withdrawn: "bg-gray-100 text-gray-500",
};

function LevelRow({
  level,
  courseId,
  isEditing,
  editForm,
  saving,
  onEdit,
  onSave,
  onCancel,
  onChange,
}: {
  level: CourseLevel;
  courseId: number;
  isEditing: boolean;
  editForm: Partial<CourseLevel>;
  saving: boolean;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onChange: (patch: Partial<CourseLevel>) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [students, setStudents] = useState<LevelStudent[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [studentsFetched, setStudentsFetched] = useState(false);

  const toggleExpand = useCallback(async () => {
    if (isEditing) return;
    const next = !expanded;
    setExpanded(next);
    if (next && !studentsFetched) {
      setLoadingStudents(true);
      try {
        const data = await adminApi.courses.levelStudents(level.id);
        setStudents(data as LevelStudent[]);
        setStudentsFetched(true);
      } catch {
        /* silent */
      } finally {
        setLoadingStudents(false);
      }
    }
  }, [expanded, isEditing, level.id, studentsFetched]);

  const refetchStudents = useCallback(async () => {
    setLoadingStudents(true);
    try {
      const data = await adminApi.courses.levelStudents(level.id);
      setStudents(data as LevelStudent[]);
    } catch {
      /* silent */
    } finally {
      setLoadingStudents(false);
    }
  }, [level.id]);

  useEffect(() => {
    if (expanded && studentsFetched) refetchStudents();
  }, [level.enrolled]);

  return (
    <div className="border-b border-border last:border-b-0">
      {isEditing ? (
        <div className="px-6 py-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Schedule</Label>
              <Input value={editForm.schedule ?? ""} onChange={(e) => onChange({ schedule: e.target.value })} className="rounded-lg h-8 text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Capacity</Label>
              <Input type="number" min={0} value={editForm.capacity ?? 0} onChange={(e) => onChange({ capacity: +e.target.value })} className="rounded-lg h-8 text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Status</Label>
              <select value={editForm.status ?? "Active"} onChange={(e) => onChange({ status: e.target.value as "Active" | "Inactive" })} className="w-full border border-input rounded-lg px-2 py-1 text-sm bg-white h-8">
                <option>Active</option><option>Inactive</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={onSave} className="rounded-lg gap-1.5 h-7 text-xs" disabled={saving}>
              {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />} Save
            </Button>
            <Button size="sm" variant="outline" onClick={onCancel} className="rounded-lg h-7 text-xs" disabled={saving}>
              <X className="w-3 h-3" /> Cancel
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div
            className="px-6 py-4 hover:bg-gray-50 transition-colors cursor-pointer select-none"
            onClick={toggleExpand}
          >
            <div className="flex items-center gap-4">
              <div className="w-5 shrink-0 text-muted-foreground">
                {expanded
                  ? <ChevronDown className="w-4 h-4" />
                  : <ChevronRight className="w-4 h-4" />}
              </div>
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">{level.level}</div>
              <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-3 min-w-0">
                <div>
                  <div className="text-xs text-muted-foreground">Class</div>
                  <div className="text-sm font-medium text-secondary">{level.className}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Schedule</div>
                  <div className="text-xs text-secondary">{level.schedule || "TBD"}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Teacher</div>
                  <div className="text-xs text-secondary truncate">{level.teacher}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Enrollment</div>
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-semibold text-secondary">{level.enrolled}/{level.capacity}</div>
                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden max-w-16">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(100, Math.round((level.enrolled / level.capacity) * 100))}%` }} />
                    </div>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${level.status === "Active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>{level.status}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); onEdit(); }}
                className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 flex items-center justify-center transition-colors shrink-0"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {expanded && (
            <div className="bg-slate-50 border-t border-border px-6 py-4">
              {loadingStudents ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading enrolled students…
                </div>
              ) : students.length === 0 ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                  <GraduationCap className="w-4 h-4" />
                  No students enrolled in this level yet.
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                    {students.length} student{students.length !== 1 ? "s" : ""} enrolled
                  </div>
                  <div className="rounded-xl border border-border overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-white border-b border-border">
                          <th className="text-left px-4 py-2 text-xs font-semibold text-muted-foreground">Code</th>
                          <th className="text-left px-4 py-2 text-xs font-semibold text-muted-foreground">Student</th>
                          <th className="text-left px-4 py-2 text-xs font-semibold text-muted-foreground hidden sm:table-cell">Parent Contact</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {students.map((s) => (
                          <tr key={s.enrollmentId} className="bg-white hover:bg-slate-50 transition-colors align-top">
                            <td className="px-4 py-2.5 whitespace-nowrap">
                              <span className="font-mono text-xs text-muted-foreground">{s.studentCode}</span>
                            </td>
                            <td className="px-4 py-2.5">
                              <div className="font-medium text-secondary text-sm">{s.studentName}</div>
                              <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${ENROLL_COLORS[s.enrollStatus] ?? "bg-gray-100 text-gray-500"}`}>
                                {s.enrollStatus}
                              </span>
                            </td>
                            <td className="px-4 py-2.5 hidden sm:table-cell">
                              <div className="space-y-1">
                                {(s.motherName || s.motherPhone || s.motherEmail) && (
                                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
                                    <span className="font-semibold text-pink-500 shrink-0">M</span>
                                    {s.motherName && <span className="font-medium text-secondary">{s.motherName}</span>}
                                    {s.motherPhone && <span className="flex items-center gap-0.5 text-muted-foreground"><Phone className="w-3 h-3" />{s.motherPhone}</span>}
                                    {s.motherEmail && <span className="flex items-center gap-0.5 text-muted-foreground"><Mail className="w-3 h-3" />{s.motherEmail}</span>}
                                  </div>
                                )}
                                {(s.fatherName || s.fatherPhone || s.fatherEmail) && (
                                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
                                    <span className="font-semibold text-blue-500 shrink-0">F</span>
                                    {s.fatherName && <span className="font-medium text-secondary">{s.fatherName}</span>}
                                    {s.fatherPhone && <span className="flex items-center gap-0.5 text-muted-foreground"><Phone className="w-3 h-3" />{s.fatherPhone}</span>}
                                    {s.fatherEmail && <span className="flex items-center gap-0.5 text-muted-foreground"><Mail className="w-3 h-3" />{s.fatherEmail}</span>}
                                  </div>
                                )}
                                {!s.motherName && !s.motherPhone && !s.motherEmail && !s.fatherName && !s.fatherPhone && !s.fatherEmail && (
                                  <span className="text-xs text-muted-foreground">{s.parentName}</span>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function CoursesAdmin() {
  const [courses, setCourses] = useState<AdminCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<number>(0);
  const [levelFilter, setLevelFilter] = useState<number | "all">("all");
  const [editingLevel, setEditingLevel] = useState<{ courseId: number; levelId: number } | null>(null);
  const [editForm, setEditForm] = useState<Partial<CourseLevel>>({});

  useEffect(() => {
    adminApi.courses.list().then((d) => setCourses(d as AdminCourse[])).finally(() => setLoading(false));
  }, []);

  const course = courses[selectedCourse];
  const visibleLevels = course
    ? (levelFilter === "all" ? course.levels : course.levels.filter(l => l.level === levelFilter))
    : [];

  function openEditLevel(level: CourseLevel) {
    setEditingLevel({ courseId: course.id, levelId: level.id });
    setEditForm({ ...level });
  }

  async function saveLevel() {
    if (!editingLevel) return;
    setSaving(true);
    try {
      const updated = await adminApi.courses.updateLevel(editingLevel.levelId, {
        schedule: editForm.schedule,
        capacity: editForm.capacity,
        status: editForm.status,
      });
      setCourses((prev) =>
        prev.map((c) =>
          c.id === editingLevel.courseId
            ? { ...c, levels: c.levels.map((l) => l.id === editingLevel.levelId ? { ...l, ...(updated as Partial<CourseLevel>) } : l) }
            : c
        )
      );
      setEditingLevel(null);
    } catch { /* silent */ }
    finally { setSaving(false); }
  }

  const totalEnrolled = courses.reduce((a, c) => a + c.levels.reduce((b, l) => b + l.enrolled, 0), 0);
  const totalCapacity = courses.reduce((a, c) => a + c.levels.reduce((b, l) => b + l.capacity, 0), 0);

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-secondary">Courses & Classes</h2>
        <p className="text-sm text-muted-foreground">{courses.length} courses • {totalEnrolled} enrolled of {totalCapacity} capacity</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {courses.map((c, i) => {
          const enrolled = c.levels.reduce((a, l) => a + l.enrolled, 0);
          const cap = c.levels.reduce((a, l) => a + l.capacity, 0);
          return (
            <button key={c.id} onClick={() => { setSelectedCourse(i); setEditingLevel(null); setLevelFilter("all"); }}
              className={`p-4 rounded-2xl border text-center transition-all ${selectedCourse === i ? "bg-primary/10 border-primary shadow-sm" : "bg-white border-border hover:border-primary/50"}`}>
              <div className="text-3xl mb-2">{c.icon}</div>
              <div className="font-semibold text-secondary text-sm">{c.name}</div>
              <div className="text-xs text-muted-foreground mt-1">{enrolled}/{cap}</div>
            </button>
          );
        })}
      </div>

      {course && (
        <>
          <div className="bg-white rounded-2xl border border-border p-5">
            <div className="flex items-start gap-4">
              <div className="text-4xl">{course.icon}</div>
              <div>
                <h3 className="text-lg font-bold text-secondary">{course.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">{course.description}</p>
                <div className="flex gap-4 mt-3 flex-wrap">
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Users className="w-4 h-4" />
                    {course.levels.reduce((a, l) => a + l.enrolled, 0)} enrolled
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <BookOpen className="w-4 h-4" />
                    {course.levels.filter((l) => l.status === "Active").length} active levels
                  </div>
                  {course.curriculumYear && (
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium self-center">
                      📅 {course.curriculumYear}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-border overflow-hidden">
            <div className="px-6 py-4 border-b border-border bg-gray-50 flex items-center justify-between gap-3 flex-wrap">
              <h3 className="font-bold text-secondary">Class Levels</h3>
              <div className="flex items-center gap-3 flex-wrap">
                {course.levels.length > 1 && (
                  <select
                    value={levelFilter === "all" ? "all" : String(levelFilter)}
                    onChange={e => setLevelFilter(e.target.value === "all" ? "all" : Number(e.target.value))}
                    className="text-xs border border-border rounded-lg px-2 py-1 bg-white text-secondary h-7 focus:outline-none focus:border-primary"
                  >
                    <option value="all">All Levels</option>
                    {course.levels.map(l => (
                      <option key={l.id} value={l.level}>Level {l.level} — {l.className}</option>
                    ))}
                  </select>
                )}
                <span className="text-xs text-muted-foreground">Click a row to see enrolled students • Click ✏️ to edit</span>
              </div>
            </div>
            <div>
              {visibleLevels.map((level) => (
                <LevelRow
                  key={level.id}
                  level={level}
                  courseId={course.id}
                  isEditing={editingLevel?.levelId === level.id}
                  editForm={editForm}
                  saving={saving}
                  onEdit={() => openEditLevel(level)}
                  onSave={saveLevel}
                  onCancel={() => setEditingLevel(null)}
                  onChange={(patch) => setEditForm((f) => ({ ...f, ...patch }))}
                />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
