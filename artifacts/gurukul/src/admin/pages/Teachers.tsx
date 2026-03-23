import { useState, useEffect, useMemo } from "react";
import { adminApi } from "@/lib/adminApi";
import { Plus, Edit2, Trash2, Check, X, Search, Phone, Mail, Loader2, Clock, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Teacher = {
  id: number;
  name: string;
  email: string;
  phone: string;
  category: string;
  status: "Active" | "Inactive";
  assignedCourse: string;
  assignedLevel: string;
  sectionId: number | null;
  sectionName: string | null;
  sectionSchedule: string | null;
  assistantTeacherId: number | null;
  assistantTeacherName: string | null;
};

type DbSection = { id: number; sectionName: string; schedule: string | null };
type DbLevel   = { id: number; levelNumber: number; className: string; sections: DbSection[] };
type DbCourse  = { id: number; name: string; icon: string; levels: DbLevel[] };
type Assistant = { id: number; name: string };

const CATEGORIES = ["Senior Teacher", "Assistant"];

type FormState = {
  name: string;
  email: string;
  phone: string;
  category: string;
  assignedCourse: string;
  assignedLevel: string;
  sectionId: number | null;
  assistantTeacherId: number | null;
};

const emptyForm: FormState = {
  name: "", email: "", phone: "",
  category: "Senior Teacher",
  assignedCourse: "", assignedLevel: "",
  sectionId: null,
  assistantTeacherId: null,
};

export default function Teachers() {
  const [teachers,    setTeachers]    = useState<Teacher[]>([]);
  const [dbCourses,   setDbCourses]   = useState<DbCourse[]>([]);
  const [assistants,  setAssistants]  = useState<Assistant[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [saving,      setSaving]      = useState(false);
  const [search,      setSearch]      = useState("");
  const [filterCourse, setFilterCourse] = useState("All");
  const [showModal,   setShowModal]   = useState(false);
  const [editing,     setEditing]     = useState<Teacher | null>(null);
  const [form,        setForm]        = useState<FormState>(emptyForm);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [error,       setError]       = useState("");

  useEffect(() => {
    Promise.all([
      adminApi.teachers.list().then((d) => setTeachers(d as Teacher[])),
      adminApi.courses.list().then((d) => {
        const courses = d as DbCourse[];
        setDbCourses(courses);
        setForm((f) => ({
          ...f,
          assignedCourse: courses[0]?.name ?? "",
          assignedLevel:  courses[0]?.levels?.[0]?.className ?? "",
        }));
      }),
      adminApi.teachers.assistants().then(setAssistants),
    ]).finally(() => setLoading(false));
  }, []);

  const courseNames = useMemo(() => dbCourses.map((c) => c.name), [dbCourses]);

  const levelsForCourse = useMemo((): DbLevel[] => {
    const course = dbCourses.find((c) => c.name === form.assignedCourse);
    if (!course) return [];
    return course.levels.slice().sort((a, b) => a.levelNumber - b.levelNumber);
  }, [dbCourses, form.assignedCourse]);

  const sectionsForLevel = useMemo((): DbSection[] => {
    const level = levelsForCourse.find((l) => l.className === form.assignedLevel);
    return level?.sections ?? [];
  }, [levelsForCourse, form.assignedLevel]);

  const selectedSection = useMemo(
    () => sectionsForLevel.find((s) => s.id === form.sectionId) ?? null,
    [sectionsForLevel, form.sectionId]
  );

  const filtered = teachers.filter((t) =>
    (filterCourse === "All" || t.assignedCourse === filterCourse) &&
    (t.name.toLowerCase().includes(search.toLowerCase()) || t.email.toLowerCase().includes(search.toLowerCase()))
  );

  function openAdd() {
    setEditing(null);
    const firstCourse = dbCourses[0];
    const firstLevel  = firstCourse?.levels?.slice().sort((a, b) => a.levelNumber - b.levelNumber)[0];
    setForm({
      ...emptyForm,
      assignedCourse: firstCourse?.name ?? "",
      assignedLevel:  firstLevel?.className ?? "",
    });
    setError("");
    setShowModal(true);
  }

  function openEdit(t: Teacher) {
    setEditing(t);
    setForm({
      name:               t.name,
      email:              t.email,
      phone:              t.phone,
      category:           t.category || "Senior Teacher",
      assignedCourse:     t.assignedCourse,
      assignedLevel:      t.assignedLevel,
      sectionId:          t.sectionId,
      assistantTeacherId: t.assistantTeacherId,
    });
    setError("");
    setShowModal(true);
  }

  function handleCourseChange(courseName: string) {
    const course     = dbCourses.find((c) => c.name === courseName);
    const firstLevel = course?.levels?.slice().sort((a, b) => a.levelNumber - b.levelNumber)[0];
    setForm((f) => ({
      ...f,
      assignedCourse: courseName,
      assignedLevel:  firstLevel?.className ?? "",
      sectionId:      null,
    }));
  }

  function handleLevelChange(levelName: string) {
    setForm((f) => ({ ...f, assignedLevel: levelName, sectionId: null }));
  }

  async function handleSave() {
    if (!form.name.trim())          { setError("Full name is required."); return; }
    if (!form.email.trim())         { setError("Email is required."); return; }
    if (!form.category)             { setError("Category is required."); return; }
    if (!form.assignedCourse)       { setError("Course is required."); return; }
    if (!form.assignedLevel)        { setError("Level is required."); return; }

    setSaving(true);
    try {
      if (editing) {
        const updated = await adminApi.teachers.update(editing.id, form);
        setTeachers((prev) => prev.map((t) => t.id === editing.id ? updated as Teacher : t));
      } else {
        const created = await adminApi.teachers.create(form);
        const newTeacher = created as Teacher;
        setTeachers((prev) => [...prev, newTeacher]);
        if (form.category === "Assistant") {
          setAssistants((prev) => [...prev, { id: newTeacher.id, name: newTeacher.name }]);
        }
      }
      setShowModal(false);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    try {
      await adminApi.teachers.remove(id);
      setTeachers((prev) => prev.filter((t) => t.id !== id));
      setAssistants((prev) => prev.filter((a) => a.id !== id));
      setDeleteConfirm(null);
    } catch {
      /* silent */
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  const selectCls = "w-full border border-input rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-ring";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-secondary">Teacher Assignment</h2>
          <p className="text-sm text-muted-foreground">{teachers.filter((t) => t.status === "Active").length} active teachers</p>
        </div>
        <Button onClick={openAdd} className="gap-2 rounded-xl shrink-0">
          <Plus className="w-4 h-4" /> Add Teacher
        </Button>
      </div>

      {/* Search + Course filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search teachers..." className="pl-9 rounded-xl" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex flex-wrap gap-2">
          {["All", ...courseNames].map((c) => (
            <button key={c} onClick={() => setFilterCourse(c)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filterCourse === c ? "bg-primary text-white" : "bg-white border border-border text-muted-foreground hover:border-primary"}`}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-border">
              <tr>
                {["Teacher", "Contact", "Category", "Course", "Level / Section", "Actions"].map((h) => (
                  <th key={h} className="text-left font-semibold text-muted-foreground px-4 py-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="text-center py-12 text-muted-foreground">No teachers found.</td></tr>
              )}
              {filtered.map((t) => (
                <tr key={t.id} className="border-b border-border/50 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-primary/10 text-primary rounded-full flex items-center justify-center font-bold text-sm shrink-0">
                        {t.name.split(" ").pop()?.charAt(0) ?? "T"}
                      </div>
                      <div>
                        <div className="font-medium text-secondary">{t.name}</div>
                        {t.assistantTeacherName && (
                          <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <User className="w-3 h-3" /> TA: {t.assistantTeacherName}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Mail className="w-3 h-3" />{t.email}</div>
                      {t.phone && <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Phone className="w-3 h-3" />{t.phone}</div>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${t.category === "Assistant" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"}`}>
                      {t.category || "Senior Teacher"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {t.assignedCourse
                      ? <span className="px-2 py-1 bg-primary/10 text-primary rounded-lg text-xs font-medium">{t.assignedCourse}</span>
                      : <span className="text-muted-foreground text-xs">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-xs">
                      <div className="font-medium text-secondary">{t.assignedLevel || "—"}</div>
                      {t.sectionName && (
                        <div className="text-muted-foreground mt-0.5">{t.sectionName}</div>
                      )}
                      {t.sectionSchedule && (
                        <div className="flex items-center gap-1 text-muted-foreground mt-0.5">
                          <Clock className="w-3 h-3" />{t.sectionSchedule}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(t)} className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 flex items-center justify-center transition-colors">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      {deleteConfirm === t.id ? (
                        <div className="flex gap-1">
                          <button onClick={() => handleDelete(t.id)} className="w-7 h-7 rounded-lg bg-red-500 text-white hover:bg-red-600 flex items-center justify-center"><Check className="w-3 h-3" /></button>
                          <button onClick={() => setDeleteConfirm(null)} className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center"><X className="w-3 h-3" /></button>
                        </div>
                      ) : (
                        <button onClick={() => setDeleteConfirm(t.id)} className="w-7 h-7 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 flex items-center justify-center">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Teacher–Course Mapping */}
      <div className="bg-white rounded-2xl border border-border p-6">
        <h3 className="font-bold text-secondary mb-4">Teacher–Course Mapping</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {dbCourses.map((course) => {
            const assigned = teachers.filter((t) => t.assignedCourse === course.name && t.status === "Active");
            return (
              <div key={course.id} className="p-4 bg-gray-50 rounded-xl">
                <div className="font-semibold text-secondary mb-2">{course.icon} {course.name}</div>
                {assigned.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">No teacher assigned</p>
                ) : assigned.map((t) => (
                  <div key={t.id} className="text-xs text-muted-foreground mb-1">
                    • {t.name} — {t.assignedLevel}
                    {t.sectionName && <span className="ml-1 text-xs">({t.sectionName})</span>}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-border">
              <h3 className="text-lg font-bold text-secondary">{editing ? "Edit Teacher" : "Add Teacher"}</h3>
            </div>
            <div className="p-6 space-y-4">
              {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm">{error}</div>}

              {/* Name */}
              <div className="space-y-1.5">
                <Label>Full Name <span className="text-red-500">*</span></Label>
                <Input placeholder="Teacher name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="rounded-xl" />
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <Label>Email <span className="text-red-500">*</span></Label>
                <Input type="email" placeholder="Email address" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} className="rounded-xl" />
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <Label>Phone</Label>
                <Input placeholder="Phone number" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} className="rounded-xl" />
              </div>

              {/* Category (mandatory) */}
              <div className="space-y-1.5">
                <Label>Category <span className="text-red-500">*</span></Label>
                <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} className={selectCls}>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {/* Course + Level (both mandatory) */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Course <span className="text-red-500">*</span></Label>
                  <select value={form.assignedCourse} onChange={(e) => handleCourseChange(e.target.value)} className={selectCls}>
                    {courseNames.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label>Level <span className="text-red-500">*</span></Label>
                  <select value={form.assignedLevel} onChange={(e) => handleLevelChange(e.target.value)} className={selectCls}>
                    {levelsForCourse.length === 0
                      ? <option value="">No levels</option>
                      : levelsForCourse.map((l) => <option key={l.id} value={l.className}>{l.className}</option>)
                    }
                  </select>
                </div>
              </div>

              {/* Section (optional) */}
              <div className="space-y-1.5">
                <Label>Section <span className="text-xs text-muted-foreground ml-1">(optional)</span></Label>
                <select
                  value={form.sectionId ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, sectionId: e.target.value ? parseInt(e.target.value) : null }))}
                  className={selectCls}
                >
                  <option value="">— No section —</option>
                  {sectionsForLevel.map((s) => (
                    <option key={s.id} value={s.id}>{s.sectionName}</option>
                  ))}
                </select>
                {/* Timing read-only when section selected */}
                {selectedSection?.schedule && (
                  <div className="flex items-center gap-2 mt-1.5 px-3 py-2 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-700">
                    <Clock className="w-3.5 h-3.5 shrink-0" />
                    <span>{selectedSection.schedule}</span>
                  </div>
                )}
                {sectionsForLevel.length === 0 && form.assignedLevel && (
                  <p className="text-xs text-muted-foreground mt-1">No sections defined for this level.</p>
                )}
              </div>

              {/* Teacher Assistant (optional) */}
              <div className="space-y-1.5">
                <Label>Teacher Assistant <span className="text-xs text-muted-foreground ml-1">(optional)</span></Label>
                <select
                  value={form.assistantTeacherId ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, assistantTeacherId: e.target.value ? parseInt(e.target.value) : null }))}
                  className={selectCls}
                >
                  <option value="">— None —</option>
                  {assistants
                    .filter((a) => !editing || a.id !== editing.id)
                    .map((a) => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))
                  }
                </select>
                {assistants.length === 0 && (
                  <p className="text-xs text-muted-foreground mt-1">No assistants found. Add a teacher with the "Assistant" category first.</p>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-border flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowModal(false)} className="rounded-xl" disabled={saving}>Cancel</Button>
              <Button onClick={handleSave} className="rounded-xl gap-2" disabled={saving}>
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {editing ? "Save Changes" : "Add Teacher"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
