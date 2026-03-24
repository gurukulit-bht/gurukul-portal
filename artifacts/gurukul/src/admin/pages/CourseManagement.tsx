import { useState, useEffect, useCallback } from "react";
import { usePortalSettings } from "../contexts/PortalSettingsContext";
import {
  Plus, Edit2, Trash2, Archive, ArchiveRestore, ChevronDown, ChevronRight,
  BookOpen, Users, Layers, Tag, GraduationCap, Phone, Mail, AlertCircle,
  Check, X, Save, PlusCircle, Settings2,
} from "lucide-react";
import { adminApi } from "@/lib/adminApi";
import { useAuth } from "../AuthContext";
import { canAccess } from "../rbac";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

type SectionRow = {
  id: number; sectionName: string; schedule: string;
  capacity: number; status: string;
  teachers?: { id: number; name: string; role: string }[];
};

type LevelRow = {
  id: number; level: number; className: string; schedule: string;
  teacher: string; enrolled: number; capacity: number; status: string;
  sections: SectionRow[];
};

type CourseRow = {
  id: number; name: string; icon: string; description: string;
  schedule: string; ageGroup: string; curriculumYear: string | null;
  archivedAt: string | null;
  levels: LevelRow[];
};

type LevelStudent = {
  studentId: number; enrollmentId: number; studentCode: string; studentName: string;
  paymentStatus: string | null;
  sectionId: number | null; sectionName: string | null;
  motherName: string | null; motherPhone: string | null; motherEmail: string | null;
  fatherName: string | null; fatherPhone: string | null; fatherEmail: string | null;
};

type FormData = {
  name: string; description: string; icon: string;
  ageGroup: string; schedule: string; instructor: string;
  numLevels: number; numSectionsPerLevel: number; curriculumYear: string;
};


const ICONS = ["📚", "🕉️", "🌿", "☀️", "📝", "🎵", "🏛️", "🌺"];

// ─── Section Chip ─────────────────────────────────────────────────────────────

function SectionChip({
  section, isAdmin, allTeachers, onDelete, onEdit, onSectionUpdated,
}: {
  section: SectionRow; isAdmin: boolean;
  allTeachers: { id: number; name: string }[];
  onDelete: (id: number) => void; onEdit: (s: SectionRow) => void;
  onSectionUpdated: (s: SectionRow) => void;
}) {
  const [assigning, setAssigning]           = useState(false);
  const [selectedTeacherId, setSelectedTeacherId] = useState("");
  const [savingTeacher, setSavingTeacher]   = useState(false);

  const assignedIds      = new Set((section.teachers ?? []).map(t => t.id));
  const availableTeachers = allTeachers.filter(t => !assignedIds.has(t.id));

  async function handleAssignTeacher() {
    if (!selectedTeacherId) return;
    setSavingTeacher(true);
    try {
      await adminApi.courses.assignSection(section.id, { teacherId: Number(selectedTeacherId), role: "Teacher" });
      const teacher = allTeachers.find(t => t.id === Number(selectedTeacherId));
      onSectionUpdated({
        ...section,
        teachers: [...(section.teachers ?? []), { id: Number(selectedTeacherId), name: teacher?.name ?? "", role: "Teacher" }],
      });
      setSelectedTeacherId("");
      setAssigning(false);
      toast.success(`${teacher?.name} assigned to ${section.sectionName}`);
    } catch {
      toast.error("Failed to assign teacher");
    } finally {
      setSavingTeacher(false);
    }
  }

  async function handleRemoveTeacher(teacherId: number, teacherName: string) {
    try {
      await adminApi.courses.unassignSection(section.id, teacherId);
      onSectionUpdated({
        ...section,
        teachers: (section.teachers ?? []).filter(t => t.id !== teacherId),
      });
      toast.success(`${teacherName} removed from ${section.sectionName}`);
    } catch {
      toast.error("Failed to remove teacher");
    }
  }

  return (
    <div className="flex flex-col gap-1.5 px-2.5 py-2 rounded-xl bg-blue-50 border border-blue-200 text-xs min-w-0">
      {/* Header row */}
      <div className="flex items-center gap-1.5">
        <Tag className="w-3 h-3 text-blue-600 shrink-0" />
        <span className="font-semibold text-blue-800">{section.sectionName}</span>
        {section.schedule && <span className="text-blue-400 text-[10px]">· {section.schedule}</span>}
        {isAdmin && (
          <div className="ml-auto flex items-center gap-1">
            <button onClick={() => { onEdit(section); }} className="text-blue-400 hover:text-blue-700" title="Edit section">
              <Edit2 className="w-3 h-3" />
            </button>
            <button onClick={() => onDelete(section.id)} className="text-red-400 hover:text-red-600" title="Delete section">
              <X className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      {/* Teachers row */}
      <div className="flex items-center gap-1 flex-wrap pl-4">
        {(section.teachers ?? []).map(t => (
          <span key={t.id} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700 text-[10px] font-medium">
            <GraduationCap className="w-2.5 h-2.5 shrink-0" />
            {t.name}
            <span className="text-purple-400 text-[9px]">{t.role === "Assistant" ? "· Asst" : ""}</span>
            {isAdmin && (
              <button onClick={() => handleRemoveTeacher(t.id, t.name)} className="text-purple-300 hover:text-red-500 ml-0.5">
                <X className="w-2.5 h-2.5" />
              </button>
            )}
          </span>
        ))}

        {/* Assign teacher button */}
        {isAdmin && !assigning && availableTeachers.length > 0 && (
          <button
            onClick={() => setAssigning(true)}
            className="inline-flex items-center gap-0.5 text-[10px] text-blue-500 hover:text-blue-700 font-medium"
          >
            <PlusCircle className="w-3 h-3" /> Assign Teacher
          </button>
        )}

        {/* Assign teacher inline picker */}
        {assigning && (
          <div className="flex items-center gap-1">
            <select
              value={selectedTeacherId}
              onChange={e => setSelectedTeacherId(e.target.value)}
              className="text-[11px] border border-blue-200 rounded px-1 py-0.5 bg-white focus:outline-none"
            >
              <option value="">Select teacher…</option>
              {availableTeachers.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
            <button
              onClick={handleAssignTeacher}
              disabled={!selectedTeacherId || savingTeacher}
              className="px-1.5 py-0.5 bg-blue-600 text-white rounded text-[10px] disabled:opacity-50"
            >
              {savingTeacher ? "…" : "Assign"}
            </button>
            <button onClick={() => { setAssigning(false); setSelectedTeacherId(""); }} className="text-muted-foreground hover:text-secondary">
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        {(section.teachers ?? []).length === 0 && !assigning && (
          <span className="text-[10px] text-blue-300 italic">No teacher assigned</span>
        )}
      </div>
    </div>
  );
}

// ─── Add/Edit Section Inline Form ─────────────────────────────────────────────

function AddSectionForm({
  levelId, existing, onSave, onCancel,
}: {
  levelId: number; existing?: SectionRow;
  onSave: (s: SectionRow) => void; onCancel: () => void;
}) {
  const [name, setName]     = useState(existing?.sectionName ?? "");
  const [sched, setSched]   = useState(existing?.schedule ?? "");
  const [cap, setCap]       = useState(String(existing?.capacity ?? 20));
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { toast.error("Section name is required"); return; }
    setSaving(true);
    try {
      let s: SectionRow;
      if (existing) {
        s = await adminApi.courses.updateSection(existing.id, { sectionName: name.trim(), schedule: sched, capacity: Number(cap) }) as SectionRow;
      } else {
        s = await adminApi.courses.addSection(levelId, { sectionName: name.trim(), schedule: sched, capacity: Number(cap) }) as SectionRow;
      }
      toast.success(existing ? "Section updated!" : "Section added!");
      onSave(s);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to save section");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex items-center gap-2 mt-2 flex-wrap">
      <Input value={name} onChange={e => setName(e.target.value)} placeholder="Section name e.g. Morning Batch" className="h-8 text-xs w-44" />
      <Input value={sched} onChange={e => setSched(e.target.value)} placeholder="Schedule (optional)" className="h-8 text-xs w-40" />
      <Input value={cap} onChange={e => setCap(e.target.value)} type="number" min={1} placeholder="Capacity" className="h-8 text-xs w-20" />
      <Button type="submit" size="sm" className="h-8 px-3 text-xs" disabled={saving}>{saving ? "Saving…" : existing ? "Update" : "Add"}</Button>
      <button type="button" onClick={onCancel} className="text-muted-foreground hover:text-secondary"><X className="w-4 h-4" /></button>
    </form>
  );
}

// ─── Level Accordion Row ──────────────────────────────────────────────────────

function LevelAccordion({
  level, courseId, isAdmin, onSectionsChange,
}: {
  level: LevelRow; courseId: number; isAdmin: boolean;
  onSectionsChange: (levelId: number, sections: SectionRow[]) => void;
}) {
  const [expanded, setExpanded]               = useState(false);
  const [students, setStudents]               = useState<LevelStudent[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [addingSection, setAddingSection]     = useState(false);
  const [editingSection, setEditingSection]   = useState<SectionRow | null>(null);
  const [saving, setSaving]                   = useState<Set<number>>(new Set());
  const [allTeachers, setAllTeachers]         = useState<{ id: number; name: string }[]>([]);

  // Load teachers on mount so the Assign button works even when collapsed.
  // Exclude Assistants — they are not assigned as lead teachers to sections.
  useEffect(() => {
    adminApi.teachers.list()
      .then((data) => {
        const senior = (data as { id: number; name: string; category: string }[])
          .filter(t => t.category !== "Assistant")
          .map(t => ({ id: t.id, name: t.name }));
        setAllTeachers(senior);
      })
      .catch(() => { /* silent */ });
  }, []);

  async function handleSectionChange(s: LevelStudent, newSectionId: number | null) {
    setSaving(prev => new Set(prev).add(s.enrollmentId));
    try {
      await adminApi.students.assignSection(s.enrollmentId, newSectionId);
      const sec = newSectionId ? level.sections.find(sec => sec.id === newSectionId) : null;
      setStudents(prev => prev.map(st =>
        st.enrollmentId === s.enrollmentId
          ? { ...st, sectionId: newSectionId, sectionName: sec?.sectionName ?? null }
          : st
      ));
      toast.success(`${s.studentName} moved to ${sec?.sectionName ?? "Unassigned"}`);
    } catch {
      toast.error("Failed to update section");
    } finally {
      setSaving(prev => { const n = new Set(prev); n.delete(s.enrollmentId); return n; });
    }
  }

  async function toggleStudents() {
    if (!expanded) {
      setLoadingStudents(true);
      try {
        const studentData = await adminApi.courses.levelStudents(level.id) as LevelStudent[];
        setStudents(studentData);
      } catch { setStudents([]); }
      finally { setLoadingStudents(false); }
    }
    setExpanded(!expanded);
  }

  async function deleteSection(id: number) {
    if (!confirm("Remove this section?")) return;
    try {
      await adminApi.courses.deleteSection(id);
      onSectionsChange(level.id, level.sections.filter(s => s.id !== id));
      toast.success("Section removed.");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to remove section");
    }
  }

  function handleSectionSaved(s: SectionRow) {
    if (editingSection) {
      onSectionsChange(level.id, level.sections.map(sec => sec.id === s.id ? s : sec));
    } else {
      onSectionsChange(level.id, [...level.sections, s]);
    }
    setAddingSection(false);
    setEditingSection(null);
  }

  const enrollPct = Math.round((level.enrolled / level.capacity) * 100);
  const barColor = enrollPct >= 90 ? "bg-red-400" : enrollPct >= 70 ? "bg-yellow-400" : "bg-green-400";

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button
        onClick={toggleStudents}
        className="w-full flex items-center gap-3 px-4 py-3 bg-white hover:bg-gray-50 transition-colors text-left"
      >
        {expanded ? <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-secondary">{level.className}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${level.status === "Active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-500"}`}>
              {level.status}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground flex-wrap">
            {level.schedule && <span>🕐 {level.schedule}</span>}
            <span>👩‍🏫 {level.teacher}</span>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <span className="text-xs font-semibold text-secondary">{level.enrolled}/{level.capacity}</span>
            <div className="w-16 h-1.5 bg-gray-200 rounded-full mt-1">
              <div className={`h-full rounded-full ${barColor}`} style={{ width: `${Math.min(enrollPct, 100)}%` }} />
            </div>
          </div>
          {level.sections.length > 0 && (
            <div className="flex items-center gap-1 text-xs text-blue-600">
              <Layers className="w-3 h-3" />
              {level.sections.length}
            </div>
          )}
        </div>
      </button>

      {/* Sections */}
      <div className="px-4 pb-3 bg-gray-50 border-t border-border">
        <div className="flex items-center gap-2 flex-wrap mt-2">
          {level.sections.length > 0 ? (
            level.sections.map(s => (
              editingSection?.id === s.id ? (
                <AddSectionForm
                  key={s.id}
                  levelId={level.id}
                  existing={s}
                  onSave={handleSectionSaved}
                  onCancel={() => setEditingSection(null)}
                />
              ) : (
                <SectionChip
                  key={s.id}
                  section={s}
                  isAdmin={isAdmin}
                  allTeachers={allTeachers}
                  onDelete={deleteSection}
                  onEdit={sec => { setEditingSection(sec); setAddingSection(false); }}
                  onSectionUpdated={updated =>
                    onSectionsChange(level.id, level.sections.map(sec => sec.id === updated.id ? updated : sec))
                  }
                />
              )
            ))
          ) : (
            <span className="text-xs text-muted-foreground italic">No sections defined</span>
          )}
          {isAdmin && !addingSection && !editingSection && (
            <button
              onClick={() => setAddingSection(true)}
              className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80 font-medium"
            >
              <PlusCircle className="w-3.5 h-3.5" /> Add Section
            </button>
          )}
        </div>
        {addingSection && (
          <AddSectionForm levelId={level.id} onSave={handleSectionSaved} onCancel={() => setAddingSection(false)} />
        )}
      </div>

      {expanded && (
        <div className="border-t border-border">
          {loadingStudents ? (
            <div className="px-4 py-3 text-xs text-muted-foreground">Loading students…</div>
          ) : students.length === 0 ? (
            <div className="px-4 py-3 text-xs text-muted-foreground italic">No students enrolled in this level.</div>
          ) : (() => {
            // Group students by section
            const groups = new Map<string, { label: string; students: LevelStudent[] }>();
            for (const s of students) {
              const key = s.sectionId != null ? String(s.sectionId) : "__none__";
              const label = s.sectionName ?? "Unassigned";
              if (!groups.has(key)) groups.set(key, { label, students: [] });
              groups.get(key)!.students.push(s);
            }
            const sectionGroups = Array.from(groups.entries()).sort(([a], [b]) => {
              if (a === "__none__") return 1;
              if (b === "__none__") return -1;
              return 0;
            });
            return (
              <div className="divide-y divide-border">
                {sectionGroups.map(([key, group]) => (
                  <div key={key}>
                    <div className="px-4 py-1.5 bg-amber-50 flex items-center gap-2">
                      <Tag className="w-3 h-3 text-amber-600" />
                      <span className="text-[11px] font-semibold text-amber-800">{group.label}</span>
                      <span className="text-[10px] text-amber-600 ml-auto">{group.students.length} student{group.students.length !== 1 ? "s" : ""}</span>
                    </div>
                    <table className="w-full text-xs">
                      <thead className="bg-gray-50">
                        <tr>
                          {["Code", "Name", "Parent Contact", "Section"].map(h => (
                            <th key={h} className="px-3 py-2 text-left font-semibold text-muted-foreground">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {group.students.map(s => (
                          <tr key={s.studentId} className="hover:bg-gray-50 align-top">
                            <td className="px-3 py-2 font-mono whitespace-nowrap text-muted-foreground">{s.studentCode}</td>
                            <td className="px-3 py-2 font-semibold text-secondary">{s.studentName}</td>
                            <td className="px-3 py-2">
                              <div className="space-y-1">
                                {(s.motherName || s.motherPhone || s.motherEmail) && (
                                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                                    <span className="font-semibold text-pink-500 shrink-0">M</span>
                                    {s.motherName && <span className="font-medium text-secondary">{s.motherName}</span>}
                                    {s.motherPhone && <span className="flex items-center gap-0.5 text-muted-foreground"><Phone className="w-3 h-3" />{s.motherPhone}</span>}
                                    {s.motherEmail && <span className="flex items-center gap-0.5 text-muted-foreground"><Mail className="w-3 h-3" />{s.motherEmail}</span>}
                                  </div>
                                )}
                                {(s.fatherName || s.fatherPhone || s.fatherEmail) && (
                                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                                    <span className="font-semibold text-blue-500 shrink-0">F</span>
                                    {s.fatherName && <span className="font-medium text-secondary">{s.fatherName}</span>}
                                    {s.fatherPhone && <span className="flex items-center gap-0.5 text-muted-foreground"><Phone className="w-3 h-3" />{s.fatherPhone}</span>}
                                    {s.fatherEmail && <span className="flex items-center gap-0.5 text-muted-foreground"><Mail className="w-3 h-3" />{s.fatherEmail}</span>}
                                  </div>
                                )}
                                {!s.motherName && !s.motherPhone && !s.motherEmail && !s.fatherName && !s.fatherPhone && !s.fatherEmail && (
                                  <span className="text-muted-foreground">—</span>
                                )}
                              </div>
                            </td>
                            <td className="px-3 py-2">
                              {isAdmin ? (
                                <select
                                  value={s.sectionId ?? ""}
                                  disabled={saving.has(s.enrollmentId)}
                                  onChange={e => handleSectionChange(s, e.target.value ? Number(e.target.value) : null)}
                                  className="text-[11px] border border-border rounded px-1.5 py-0.5 bg-white disabled:opacity-50 disabled:cursor-wait focus:outline-none focus:ring-1 focus:ring-primary"
                                >
                                  <option value="">— Unassigned —</option>
                                  {level.sections.map(sec => (
                                    <option key={sec.id} value={sec.id}>{sec.sectionName}</option>
                                  ))}
                                </select>
                              ) : (
                                <span className="text-muted-foreground">{s.sectionName ?? "—"}</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}

// ─── Course Form Panel ────────────────────────────────────────────────────────

function CourseFormPanel({
  editing, onSave, onClose, loading,
}: {
  editing: CourseRow | null;
  onSave: (data: FormData) => void;
  onClose: () => void;
  loading: boolean;
}) {
  const { curriculumYears, activeCurriculumYear } = usePortalSettings();
  const [form, setForm] = useState<FormData>({
    name:                editing?.name           ?? "",
    description:         editing?.description    ?? "",
    icon:                editing?.icon           ?? "📚",
    ageGroup:            editing?.ageGroup       ?? "Ages 5–18",
    schedule:            editing?.schedule       ?? "Sundays 9 AM–1 PM",
    instructor:          "TBD",
    numLevels:           editing?.levels.length  ?? 6,
    numSectionsPerLevel: 1,
    curriculumYear:      editing?.curriculumYear ?? activeCurriculumYear,
  });

  // ── Editable structure state (edit mode only) ──
  const [localLevels, setLocalLevels] = useState<LevelRow[]>(
    () => (editing?.levels ?? []).slice().sort((a, b) => a.level - b.level)
  );
  const [busy, setBusy]             = useState<string | null>(null); // e.g. "lvl:5", "sec:3"
  const [editLvlId, setEditLvlId]   = useState<number | null>(null);
  const [editLvlName, setEditLvlName] = useState("");
  const [editSecId, setEditSecId]   = useState<number | null>(null);
  const [editSecName, setEditSecName] = useState("");
  const [addSecFor, setAddSecFor]   = useState<number | null>(null); // levelId
  const [newSecName, setNewSecName] = useState("");
  const [addingLevel, setAddingLevel] = useState(false);
  const [newLvlName, setNewLvlName] = useState("");

  // ── Helpers ──
  async function saveLevelName(lvlId: number) {
    const trimmed = editLvlName.trim();
    if (!trimmed) { setEditLvlId(null); return; }
    setBusy(`lvl:${lvlId}`);
    try {
      await adminApi.courses.updateLevel(lvlId, { className: trimmed });
      setLocalLevels(prev => prev.map(l => l.id === lvlId ? { ...l, className: trimmed } : l));
    } catch { toast.error("Failed to rename level"); }
    finally { setBusy(null); setEditLvlId(null); }
  }

  async function deleteLevel(lvl: LevelRow) {
    if (!confirm(`Delete "${lvl.className}"? This also deletes its sections. Students must be unenrolled first.`)) return;
    setBusy(`delLvl:${lvl.id}`);
    try {
      await adminApi.courses.deleteLevel(lvl.id);
      setLocalLevels(prev => prev.filter(l => l.id !== lvl.id));
      toast.success(`${lvl.className} deleted`);
    } catch (e: unknown) {
      const msg = (e instanceof Error ? e.message : "") || "Cannot delete level — students may be enrolled";
      toast.error(msg);
    }
    finally { setBusy(null); }
  }

  async function saveSectionName(secId: number, lvlId: number) {
    const trimmed = editSecName.trim();
    if (!trimmed) { setEditSecId(null); return; }
    setBusy(`sec:${secId}`);
    try {
      await adminApi.courses.updateSection(secId, { sectionName: trimmed });
      setLocalLevels(prev => prev.map(l =>
        l.id !== lvlId ? l : { ...l, sections: l.sections.map(s => s.id === secId ? { ...s, sectionName: trimmed } : s) }
      ));
    } catch { toast.error("Failed to rename section"); }
    finally { setBusy(null); setEditSecId(null); }
  }

  async function deleteSection(secId: number, lvlId: number) {
    setBusy(`delSec:${secId}`);
    try {
      await adminApi.courses.deleteSection(secId);
      setLocalLevels(prev => prev.map(l =>
        l.id !== lvlId ? l : { ...l, sections: l.sections.filter(s => s.id !== secId) }
      ));
    } catch { toast.error("Failed to delete section"); }
    finally { setBusy(null); }
  }

  async function addSection(lvlId: number) {
    const trimmed = newSecName.trim();
    if (!trimmed) return;
    setBusy(`addSec:${lvlId}`);
    try {
      const sec = await adminApi.courses.addSection(lvlId, { sectionName: trimmed }) as SectionRow;
      setLocalLevels(prev => prev.map(l =>
        l.id !== lvlId ? l : { ...l, sections: [...l.sections, sec] }
      ));
      setAddSecFor(null);
      setNewSecName("");
    } catch { toast.error("Failed to add section"); }
    finally { setBusy(null); }
  }

  async function addLevel() {
    if (!editing) return;
    const trimmed = newLvlName.trim();
    if (!trimmed) return;
    const nextNum = localLevels.length > 0 ? Math.max(...localLevels.map(l => l.level)) + 1 : 1;
    setBusy("addLvl");
    try {
      const lvl = await adminApi.courses.addLevel(editing.id, { levelNumber: nextNum, className: trimmed }) as LevelRow;
      setLocalLevels(prev => [...prev, { ...lvl, sections: [] }]);
      setAddingLevel(false);
      setNewLvlName("");
    } catch { toast.error("Failed to add level"); }
    finally { setBusy(null); }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white h-full overflow-y-auto shadow-2xl flex flex-col">
        <div className="px-6 py-5 border-b border-border flex items-center justify-between bg-secondary text-white">
          <h2 className="font-bold text-lg">{editing ? "Edit Course" : "Create Course"}</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-white/70 hover:text-white" /></button>
        </div>

        <div className="flex-1 p-6 space-y-5">
          {/* Icon picker */}
          <div>
            <label className="text-xs font-semibold text-secondary mb-2 block">Icon</label>
            <div className="flex gap-2 flex-wrap">
              {ICONS.map(icon => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, icon }))}
                  className={`w-10 h-10 rounded-xl text-2xl flex items-center justify-center transition-all border-2 ${form.icon === icon ? "border-primary bg-primary/10" : "border-transparent bg-gray-100 hover:border-primary/40"}`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-secondary mb-1 block">Course Name *</label>
            <Input
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="e.g., Marathi, Kannada"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-secondary mb-1 block">Description</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className="w-full text-sm border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-primary resize-none"
              placeholder="Brief description of the course"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-secondary mb-1 block">Curriculum Year</label>
            <select
              value={form.curriculumYear}
              onChange={e => setForm(f => ({ ...f, curriculumYear: e.target.value }))}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-primary"
            >
              <option value="">— No year assigned —</option>
              {curriculumYears.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-secondary mb-1 block">Age Group</label>
              <Input value={form.ageGroup} onChange={e => setForm(f => ({ ...f, ageGroup: e.target.value }))} placeholder="e.g., Ages 5–18" />
            </div>
            <div>
              <label className="text-xs font-semibold text-secondary mb-1 block">Default Schedule</label>
              <Input value={form.schedule} onChange={e => setForm(f => ({ ...f, schedule: e.target.value }))} placeholder="e.g., Sundays 9 AM" />
            </div>
          </div>

          {editing ? (
            /* ── Edit: editable levels & sections ── */
            <div className="space-y-3 p-4 bg-gray-50 rounded-xl border border-border">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-secondary uppercase tracking-wide">Current Structure</p>
                <span className="text-xs text-muted-foreground">{localLevels.length} level{localLevels.length !== 1 ? "s" : ""}</span>
              </div>

              <div className="space-y-2">
                {localLevels.map(lvl => (
                  <div key={lvl.id} className="rounded-lg border border-border bg-white overflow-hidden">
                    {/* Level header */}
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/5 border-b border-border">
                      <GraduationCap className="w-3.5 h-3.5 text-primary shrink-0" />

                      {editLvlId === lvl.id ? (
                        <input
                          autoFocus
                          className="flex-1 text-xs font-semibold text-secondary border border-primary rounded px-1.5 py-0.5 focus:outline-none min-w-0"
                          value={editLvlName}
                          onChange={e => setEditLvlName(e.target.value)}
                          onKeyDown={e => { if (e.key === "Enter") saveLevelName(lvl.id); if (e.key === "Escape") setEditLvlId(null); }}
                          onBlur={() => saveLevelName(lvl.id)}
                        />
                      ) : (
                        <button
                          type="button"
                          className="flex-1 text-xs font-semibold text-secondary text-left hover:text-primary transition-colors truncate"
                          title="Click to rename"
                          onClick={() => { setEditLvlId(lvl.id); setEditLvlName(lvl.className); }}
                        >
                          {lvl.className}
                        </button>
                      )}

                      <span className="shrink-0 text-[10px] text-muted-foreground ml-1">
                        {lvl.sections.length}sec
                      </span>

                      {/* Add section button */}
                      <button
                        type="button"
                        title="Add section"
                        onClick={() => { setAddSecFor(lvl.id); setNewSecName(""); }}
                        className="p-0.5 rounded hover:bg-primary/10 text-primary transition-colors shrink-0"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete level button */}
                      <button
                        type="button"
                        title="Delete level"
                        disabled={busy === `delLvl:${lvl.id}`}
                        onClick={() => deleteLevel(lvl)}
                        className="p-0.5 rounded hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors shrink-0 disabled:opacity-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Sections */}
                    <ul className="divide-y divide-border/50">
                      {lvl.sections.map(sec => (
                        <li key={sec.id} className="flex items-center gap-2 px-3 py-1.5">
                          <Tag className="w-3 h-3 text-blue-500 shrink-0" />

                          {editSecId === sec.id ? (
                            <input
                              autoFocus
                              className="flex-1 text-xs font-medium text-secondary border border-primary rounded px-1.5 py-0.5 focus:outline-none min-w-0"
                              value={editSecName}
                              onChange={e => setEditSecName(e.target.value)}
                              onKeyDown={e => { if (e.key === "Enter") saveSectionName(sec.id, lvl.id); if (e.key === "Escape") setEditSecId(null); }}
                              onBlur={() => saveSectionName(sec.id, lvl.id)}
                            />
                          ) : (
                            <button
                              type="button"
                              className="flex-1 text-xs font-medium text-secondary text-left hover:text-primary transition-colors truncate"
                              title="Click to rename"
                              onClick={() => { setEditSecId(sec.id); setEditSecName(sec.sectionName); }}
                            >
                              {sec.sectionName}
                            </button>
                          )}

                          <button
                            type="button"
                            title="Delete section"
                            disabled={busy === `delSec:${sec.id}`}
                            onClick={() => deleteSection(sec.id, lvl.id)}
                            className="p-0.5 rounded hover:bg-red-50 text-red-300 hover:text-red-500 transition-colors shrink-0 disabled:opacity-50"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </li>
                      ))}

                      {/* Add section inline form */}
                      {addSecFor === lvl.id && (
                        <li className="flex items-center gap-2 px-3 py-1.5 bg-blue-50/60">
                          <Plus className="w-3 h-3 text-blue-400 shrink-0" />
                          <input
                            autoFocus
                            className="flex-1 text-xs border border-primary rounded px-1.5 py-0.5 focus:outline-none min-w-0"
                            placeholder="Section name…"
                            value={newSecName}
                            onChange={e => setNewSecName(e.target.value)}
                            onKeyDown={e => { if (e.key === "Enter") addSection(lvl.id); if (e.key === "Escape") setAddSecFor(null); }}
                          />
                          <button
                            type="button"
                            disabled={busy === `addSec:${lvl.id}` || !newSecName.trim()}
                            onClick={() => addSection(lvl.id)}
                            className="text-[10px] font-semibold text-white bg-primary px-2 py-0.5 rounded disabled:opacity-50"
                          >
                            {busy === `addSec:${lvl.id}` ? "…" : "Add"}
                          </button>
                          <button type="button" onClick={() => setAddSecFor(null)} className="text-muted-foreground hover:text-secondary">
                            <X className="w-3 h-3" />
                          </button>
                        </li>
                      )}

                      {lvl.sections.length === 0 && addSecFor !== lvl.id && (
                        <li className="px-3 py-1.5 text-[10px] text-muted-foreground italic">No sections — click + to add one</li>
                      )}
                    </ul>
                  </div>
                ))}

                {/* Add level inline form */}
                {addingLevel ? (
                  <div className="flex items-center gap-2 p-2 rounded-lg border border-dashed border-primary bg-primary/5">
                    <GraduationCap className="w-3.5 h-3.5 text-primary shrink-0" />
                    <input
                      autoFocus
                      className="flex-1 text-xs border border-primary rounded px-2 py-1 focus:outline-none min-w-0"
                      placeholder="New level name…"
                      value={newLvlName}
                      onChange={e => setNewLvlName(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter") addLevel(); if (e.key === "Escape") setAddingLevel(false); }}
                    />
                    <button
                      type="button"
                      disabled={busy === "addLvl" || !newLvlName.trim()}
                      onClick={addLevel}
                      className="text-[10px] font-semibold text-white bg-primary px-2 py-1 rounded disabled:opacity-50"
                    >
                      {busy === "addLvl" ? "…" : "Add"}
                    </button>
                    <button type="button" onClick={() => setAddingLevel(false)} className="text-muted-foreground hover:text-secondary">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => { setAddingLevel(true); setNewLvlName(""); }}
                    className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg border border-dashed border-border text-xs text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Level
                  </button>
                )}
              </div>

              <p className="text-[10px] text-muted-foreground">Click any level or section name to rename it. Use the trash icon to delete.</p>
            </div>
          ) : (
            /* ── Create: show level & section pickers ── */
            <div className="space-y-4 p-4 bg-gray-50 rounded-xl border border-border">
              <p className="text-xs font-bold text-secondary uppercase tracking-wide">Initial Structure</p>

              <div>
                <label className="text-xs font-semibold text-secondary mb-2 block">Number of Levels <span className="text-muted-foreground font-normal">(1–7, default 6)</span></label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5, 6, 7].map(n => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, numLevels: n }))}
                      className={`w-9 h-9 rounded-lg text-sm font-semibold border-2 transition-colors ${form.numLevels === n ? "border-primary bg-primary text-white" : "border-border text-secondary hover:border-primary/50"}`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-secondary mb-2 block">Sections per Level <span className="text-muted-foreground font-normal">(1–4, default 1)</span></label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4].map(n => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, numSectionsPerLevel: n }))}
                      className={`w-9 h-9 rounded-lg text-sm font-semibold border-2 transition-colors ${form.numSectionsPerLevel === n ? "border-primary bg-primary text-white" : "border-border text-secondary hover:border-primary/50"}`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-1.5">
                  Creates {form.numLevels} level{form.numLevels !== 1 ? "s" : ""} × {form.numSectionsPerLevel} section{form.numSectionsPerLevel !== 1 ? "s" : ""} = <strong>{form.numLevels * form.numSectionsPerLevel}</strong> sections total. You can modify these after creation.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-border flex gap-3 justify-end bg-gray-50">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={() => onSave(form)}
            disabled={!form.name.trim() || loading}
            className="flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {loading ? "Saving…" : editing ? "Save Changes" : "Create Course"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Delete Confirmation ──────────────────────────────────────────────────────

function ConfirmDialog({
  title, message, confirmLabel, danger,
  onConfirm, onCancel,
}: {
  title: string; message: string; confirmLabel: string; danger?: boolean;
  onConfirm: () => void; onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4" onClick={e => e.stopPropagation()}>
        <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${danger ? "bg-red-100" : "bg-amber-100"}`}>
          <AlertCircle className={`w-6 h-6 ${danger ? "text-red-500" : "text-amber-600"}`} />
        </div>
        <h3 className="text-lg font-bold text-secondary text-center mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground text-center mb-6">{message}</p>
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onCancel}>Cancel</Button>
          <Button
            className={`flex-1 ${danger ? "bg-red-600 hover:bg-red-700 text-white" : ""}`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CourseManagement() {
  const { user } = useAuth();
  const isAdmin = user ? canAccess(user.role, "dashboard") : false;
  const { curriculumYears, activeCurriculumYear } = usePortalSettings();

  const [courses, setCourses]                   = useState<CourseRow[]>([]);
  const [loading, setLoading]                   = useState(true);
  const [showArchived, setShowArchived]         = useState(false);
  const [yearFilter, setYearFilter]             = useState<string>("2027-28");
  const [selectedId, setSelectedId]             = useState<number | null>(null);
  const [showForm, setShowForm]                 = useState(false);
  const [editingCourse, setEditingCourse]       = useState<CourseRow | null>(null);
  const [formLoading, setFormLoading]           = useState(false);
  const [confirm, setConfirm]                   = useState<{ type: "archive" | "delete"; course: CourseRow } | null>(null);
  const [addingLevelFor, setAddingLevelFor]     = useState<number | null>(null);
  const [newLevelName, setNewLevelName]         = useState("");

  // Sync year filter with portal's active curriculum year on first load
  useEffect(() => {
    if (activeCurriculumYear) setYearFilter(activeCurriculumYear);
  }, [activeCurriculumYear]);

  const loadCourses = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminApi.courses.list(showArchived) as CourseRow[];
      setCourses(data);
      setSelectedId(prev => {
        if (prev && data.some(c => c.id === prev)) return prev;
        return data.length > 0 ? data[0].id : null;
      });
    } catch { setCourses([]); }
    finally { setLoading(false); }
  }, [showArchived]);

  useEffect(() => { loadCourses(); }, [loadCourses]);

  const selectedCourse = courses.find(c => c.id === selectedId) ?? null;

  function updateSectionsInState(courseId: number, levelId: number, sections: SectionRow[]) {
    setCourses(prev => prev.map(c => c.id === courseId
      ? { ...c, levels: c.levels.map(l => l.id === levelId ? { ...l, sections } : l) }
      : c,
    ));
  }

  async function handleFormSave(data: FormData) {
    if (!data.name.trim()) { toast.error("Course name is required"); return; }
    setFormLoading(true);
    try {
      if (editingCourse) {
        await adminApi.courses.update(editingCourse.id, data);
        toast.success("Course updated!");
      } else {
        await adminApi.courses.create(data);
        toast.success(`Course "${data.name}" created with ${data.numLevels} level(s)!`);
      }
      setShowForm(false);
      setEditingCourse(null);
      loadCourses();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to save course");
    } finally {
      setFormLoading(false);
    }
  }

  async function handleArchive(course: CourseRow) {
    try {
      const res = await adminApi.courses.archive(course.id) as { archived: boolean };
      toast.success(res.archived ? `"${course.name}" archived.` : `"${course.name}" restored.`);
      loadCourses();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to archive course");
    }
    setConfirm(null);
  }

  async function handleDelete(course: CourseRow) {
    try {
      await adminApi.courses.remove(course.id);
      toast.success(`"${course.name}" deleted.`);
      if (selectedId === course.id) setSelectedId(null);
      loadCourses();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to delete course");
    }
    setConfirm(null);
  }

  async function handleAddLevel(courseId: number) {
    if (!newLevelName.trim()) { toast.error("Level name is required"); return; }
    const course = courses.find(c => c.id === courseId);
    if (!course) return;
    const nextLevelNum = Math.max(0, ...course.levels.map(l => l.level)) + 1;
    if (nextLevelNum > 7) { toast.error("Maximum 7 levels per course"); return; }
    try {
      await adminApi.courses.addLevel(courseId, { levelNumber: nextLevelNum, className: newLevelName.trim() });
      toast.success("Level added!");
      setAddingLevelFor(null);
      setNewLevelName("");
      loadCourses();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to add level");
    }
  }

  async function handleDeleteLevel(levelId: number, className: string) {
    if (!window.confirm(`Remove "${className}"? This cannot be undone.`)) return;
    try {
      await adminApi.courses.deleteLevel(levelId);
      toast.success("Level removed.");
      loadCourses();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to remove level");
    }
  }

  // Apply year filter (only applies if not "all")
  const filteredCourses = yearFilter === "all"
    ? courses
    : courses.filter(c => c.curriculumYear === yearFilter);

  function handleYearFilter(value: string) {
    setYearFilter(value);
    const filtered = value === "all" ? courses : courses.filter(c => c.curriculumYear === value);
    // Keep current selection if it's still in the filtered set; otherwise pick the first
    const stillSelected = filtered.find(c => c.id === selectedId);
    setSelectedId(stillSelected?.id ?? filtered[0]?.id ?? null);
  }

  // Stats
  const active   = courses.filter(c => !c.archivedAt);
  const archived = courses.filter(c => c.archivedAt);
  const totalLevels   = active.reduce((s, c) => s + c.levels.length, 0);
  const totalSections = active.reduce((s, c) => s + c.levels.reduce((ls, l) => ls + l.sections.length, 0), 0);
  const totalEnrolled = active.reduce((s, c) => s + c.levels.reduce((ls, l) => ls + l.enrolled, 0), 0);
  const uniqueTeachers = new Set<string>();
  active.forEach(c => c.levels.forEach(l => {
    if (l.teacher && l.teacher !== "TBD") l.teacher.split(" / ").forEach(t => uniqueTeachers.add(t.trim()));
  }));

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Active Courses",    value: active.length,          color: "text-secondary" },
          { label: "Students Enrolled", value: totalEnrolled,          color: "text-green-600" },
          { label: "Total Teachers",    value: uniqueTeachers.size,    color: "text-blue-600" },
          { label: "Total Sections",    value: totalSections,          color: "text-purple-600" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl p-4 shadow-sm border border-border">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Horizontal course tab bar */}
      <div className="bg-white rounded-xl border border-border shadow-sm p-3">
        <div className="flex items-center gap-2 mb-2.5">
          <BookOpen className="w-4 h-4 text-secondary shrink-0" />
          <span className="text-xs font-bold text-secondary uppercase tracking-wide">Courses</span>
          <div className="ml-auto flex items-center gap-2 flex-wrap justify-end">
            <select
              value={yearFilter}
              onChange={e => handleYearFilter(e.target.value)}
              className="text-xs border border-border rounded-lg px-2 py-1 bg-white text-secondary h-7 focus:outline-none focus:border-primary"
            >
              <option value="all">All Years</option>
              {curriculumYears.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <label className="flex items-center gap-1 text-xs text-muted-foreground cursor-pointer select-none">
              <input type="checkbox" checked={showArchived} onChange={e => setShowArchived(e.target.checked)} className="w-3 h-3" />
              Show archived
            </label>
            {isAdmin && (
              <Button size="sm" className="h-7 text-xs px-2.5" onClick={() => { setEditingCourse(null); setShowForm(true); }}>
                <Plus className="w-3 h-3 mr-1" /> New Course
              </Button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="text-sm text-muted-foreground py-2 text-center">Loading…</div>
        ) : filteredCourses.length === 0 ? (
          <div className="text-sm text-muted-foreground py-2 text-center">
            {courses.length === 0
              ? (isAdmin ? "No courses yet. Create one!" : "No courses assigned.")
              : "No courses for this year."}
          </div>
        ) : (
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
            {filteredCourses.map(c => {
              const sectionCount = c.levels.reduce((s, l) => s + l.sections.length, 0);
              const isSelected = selectedId === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setSelectedId(c.id)}
                  className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl whitespace-nowrap transition-all border shrink-0 ${
                    isSelected
                      ? "bg-primary text-white border-primary shadow-md"
                      : "bg-gray-50 border-border text-secondary hover:bg-primary/5 hover:border-primary/30"
                  } ${c.archivedAt ? "opacity-60" : ""}`}
                >
                  <span className="text-lg leading-none">{c.icon}</span>
                  <div className="text-left">
                    <p className={`text-sm font-semibold leading-tight ${isSelected ? "text-white" : "text-secondary"}`}>{c.name}</p>
                    <p className={`text-[11px] leading-tight mt-0.5 ${isSelected ? "text-white/70" : "text-muted-foreground"}`}>
                      {c.levels.length}L · {sectionCount}S
                      {c.archivedAt && " · Archived"}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Full-width course detail */}
      {selectedCourse ? (
        <div className="space-y-4">
            {/* Course header */}
            <div className="bg-white rounded-xl shadow-sm border border-border p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-4xl">{selectedCourse.icon}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-bold text-secondary">{selectedCourse.name}</h2>
                      {selectedCourse.archivedAt && (
                        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Archived</span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">{selectedCourse.description}</p>
                    <div className="flex gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                      {selectedCourse.ageGroup       && <span>👦 {selectedCourse.ageGroup}</span>}
                      {selectedCourse.schedule       && <span>🕐 {selectedCourse.schedule}</span>}
                      {selectedCourse.curriculumYear && (
                        <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                          📅 {selectedCourse.curriculumYear}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {isAdmin && (
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs"
                      onClick={() => { setEditingCourse(selectedCourse); setShowForm(true); }}
                    >
                      <Edit2 className="w-3.5 h-3.5 mr-1" /> Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs"
                      onClick={() => setConfirm({ type: "archive", course: selectedCourse })}
                    >
                      {selectedCourse.archivedAt
                        ? <><ArchiveRestore className="w-3.5 h-3.5 mr-1" /> Restore</>
                        : <><Archive className="w-3.5 h-3.5 mr-1" /> Archive</>
                      }
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs text-red-600 border-red-200 hover:bg-red-50"
                      onClick={() => setConfirm({ type: "delete", course: selectedCourse })}
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Levels */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-secondary flex items-center gap-2">
                  <Layers className="w-4 h-4" />
                  Levels & Sections
                  <span className="text-muted-foreground font-normal text-xs">
                    ({selectedCourse.levels.length} level{selectedCourse.levels.length !== 1 ? "s" : ""})
                  </span>
                </h3>
                {isAdmin && selectedCourse.levels.length < 7 && !selectedCourse.archivedAt && (
                  <button
                    onClick={() => { setAddingLevelFor(selectedCourse.id); setNewLevelName(`Level ${selectedCourse.levels.length + 1}`); }}
                    className="text-xs text-primary hover:underline font-medium flex items-center gap-1"
                  >
                    <PlusCircle className="w-3.5 h-3.5" /> Add Level
                  </button>
                )}
              </div>

              {addingLevelFor === selectedCourse.id && (
                <div className="flex items-center gap-2 bg-white rounded-xl p-3 border border-border">
                  <Input value={newLevelName} onChange={e => setNewLevelName(e.target.value)} placeholder="Level name" className="h-8 text-xs flex-1" />
                  <Button size="sm" className="h-8 text-xs px-3" onClick={() => handleAddLevel(selectedCourse.id)}>Add</Button>
                  <button onClick={() => setAddingLevelFor(null)}><X className="w-4 h-4 text-muted-foreground" /></button>
                </div>
              )}

              {selectedCourse.levels.length === 0 ? (
                <div className="bg-white rounded-xl p-8 text-center border border-dashed border-border">
                  <Layers className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No levels yet.{isAdmin ? " Add one above." : ""}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedCourse.levels.map(level => (
                    <div key={level.id} className="flex items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <LevelAccordion
                          level={level}
                          courseId={selectedCourse.id}
                          isAdmin={isAdmin}
                          onSectionsChange={(lvlId, sections) => updateSectionsInState(selectedCourse.id, lvlId, sections)}
                        />
                      </div>
                      {isAdmin && (
                        <button
                          onClick={() => handleDeleteLevel(level.id, level.className)}
                          className="mt-3 text-muted-foreground hover:text-red-500 transition-colors shrink-0"
                          title="Remove level"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
      ) : (
        <div className="flex items-center justify-center min-h-[300px] bg-white rounded-xl border border-dashed border-border">
          <div className="text-center">
            <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">Select a course above to view details</p>
          </div>
        </div>
      )}

      {/* Form panel */}
      {showForm && (
        <CourseFormPanel
          editing={editingCourse}
          onSave={handleFormSave}
          onClose={() => { setShowForm(false); setEditingCourse(null); loadCourses(); }}
          loading={formLoading}
        />
      )}

      {/* Confirm dialog */}
      {confirm && (
        confirm.type === "archive" ? (
          <ConfirmDialog
            title={confirm.course.archivedAt ? "Restore Course?" : "Archive Course?"}
            message={
              confirm.course.archivedAt
                ? `"${confirm.course.name}" will be restored and visible to teachers.`
                : `"${confirm.course.name}" will be hidden from teachers and students. You can restore it anytime.`
            }
            confirmLabel={confirm.course.archivedAt ? "Restore" : "Archive"}
            onConfirm={() => handleArchive(confirm.course)}
            onCancel={() => setConfirm(null)}
          />
        ) : (
          <ConfirmDialog
            danger
            title="Delete Course?"
            message={`Permanently delete "${confirm.course.name}"? This will remove all levels and sections. Students must be unenrolled first.`}
            confirmLabel="Delete"
            onConfirm={() => handleDelete(confirm.course)}
            onCancel={() => setConfirm(null)}
          />
        )
      )}
    </div>
  );
}
