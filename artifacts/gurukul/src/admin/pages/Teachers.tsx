import { useState, useEffect } from "react";
import { adminApi } from "@/lib/adminApi";
import {
  Plus, Edit2, Trash2, Check, X, Search, Phone, Mail, Loader2, BookOpen, UserCheck, KeyRound, Eye, EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Assignment = {
  sectionId:   number | null;
  sectionName: string | null;
  levelName:   string | null;
  courseName:  string | null;
  role:        string;
};

type Teacher = {
  id:                number;
  name:              string;
  email:             string;
  phone:             string;
  category:          string;
  status:            "Active" | "Inactive";
  assistantId:       number | null;
  assistantName:     string | null;
  linkedTeacherId:   number | null;
  linkedTeacherName: string | null;
  courseNames:       string[];
  assignments:       Assignment[];
};

const CATEGORIES = ["Teacher", "Assistant"];

type FormState = {
  name:            string;
  email:           string;
  phone:           string;
  category:        string;
  // For Teachers: the assistant they are paired with
  assistantId:     number | null;
  // For Assistants: the teacher they are paired with
  linkedTeacherId: number | null;
};

const emptyForm: FormState = {
  name: "", email: "", phone: "",
  category: "Teacher",
  assistantId:     null,
  linkedTeacherId: null,
};

export default function Teachers() {
  const [teachers,        setTeachers]        = useState<Teacher[]>([]);
  const [loading,         setLoading]         = useState(true);
  const [saving,          setSaving]          = useState(false);
  const [search,          setSearch]          = useState("");
  const [filterCat,       setFilterCat]       = useState("All");
  const [showModal,       setShowModal]       = useState(false);
  const [editing,         setEditing]         = useState<Teacher | null>(null);
  const [form,            setForm]            = useState<FormState>(emptyForm);
  const [deleteConfirm,   setDeleteConfirm]   = useState<number | null>(null);
  const [error,           setError]           = useState("");
  // PIN banner state — shown after create or reset
  const [pinBanner,       setPinBanner]       = useState<{ name: string; pin: string } | null>(null);
  const [showPin,         setShowPin]         = useState(false);
  const [resettingPin,    setResettingPin]    = useState<number | null>(null);

  useEffect(() => {
    adminApi.teachers.list().then((data) => {
      setTeachers(data as Teacher[]);
    }).finally(() => setLoading(false));
  }, []);

  // Derive lists for dropdowns from loaded teachers
  const assistantOptions = teachers.filter((t) => t.category === "Assistant");
  const teacherOptions   = teachers.filter((t) => t.category !== "Assistant");

  const filtered = teachers.filter((t) => {
    const matchesCat    = filterCat === "All" || t.category === filterCat;
    const matchesSearch =
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.email.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  function openAdd() {
    setEditing(null);
    setForm(emptyForm);
    setError("");
    setShowModal(true);
  }

  function openEdit(t: Teacher) {
    setEditing(t);
    setForm({
      name:            t.name,
      email:           t.email,
      phone:           t.phone,
      category:        t.category || "Teacher",
      assistantId:     t.assistantId,
      linkedTeacherId: t.linkedTeacherId,
    });
    setError("");
    setShowModal(true);
  }

  // When category changes, clear the pairing fields
  function handleCategoryChange(cat: string) {
    setForm((f) => ({ ...f, category: cat, assistantId: null, linkedTeacherId: null }));
  }

  async function handleSave() {
    if (!form.name.trim())  { setError("Full name is required."); return; }
    if (!form.email.trim()) { setError("Email is required."); return; }
    if (!form.phone.trim()) { setError("Phone number is required. It is used as the teacher's login identifier."); return; }
    if (!form.category)     { setError("Category is required."); return; }

    setSaving(true);
    try {
      const payload = { ...form };

      if (editing) {
        await adminApi.teachers.update(editing.id, payload);
        const fresh = await adminApi.teachers.list();
        setTeachers(fresh as Teacher[]);
      } else {
        const result = await adminApi.teachers.create(payload) as { id?: number; generatedPin?: string; name?: string };
        const fresh = await adminApi.teachers.list();
        setTeachers(fresh as Teacher[]);
        // Show the generated PIN banner
        if (result?.generatedPin) {
          setPinBanner({ name: form.name.trim(), pin: result.generatedPin });
          setShowPin(false);
        }
      }

      setShowModal(false);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleResetPin(teacher: Teacher) {
    setResettingPin(teacher.id);
    try {
      const result = await adminApi.teachers.resetPin(teacher.id);
      setPinBanner({ name: teacher.name, pin: result.pin });
      setShowPin(false);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Failed to reset PIN");
    } finally {
      setResettingPin(null);
    }
  }

  async function handleDelete(id: number) {
    try {
      await adminApi.teachers.remove(id);
      setTeachers((prev) => prev.filter((t) => t.id !== id));
      setDeleteConfirm(null);
    } catch { /* silent */ }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  const selectCls = "w-full border border-input rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-ring";

  // Build course → assignments summary
  const courseMap = new Map<string, { name: string; teachers: string[] }>();
  for (const t of teachers.filter((t) => t.status === "Active")) {
    for (const a of t.assignments) {
      const cName = a.courseName ?? "Unknown";
      if (!courseMap.has(cName)) courseMap.set(cName, { name: cName, teachers: [] });
      const label = `${t.name}${a.levelName ? ` (${a.levelName}${a.sectionName ? ` · ${a.sectionName}` : ""})` : ""}`;
      courseMap.get(cName)!.teachers.push(label);
    }
  }

  const isAssistantForm = form.category === "Assistant";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-secondary">Staff Management</h2>
          <p className="text-sm text-muted-foreground">
            {teachers.filter((t) => t.status === "Active").length} active staff ·{" "}
            <span className="text-orange-500 font-medium">Course assignments can be done in the course management section</span>
          </p>
        </div>
        <Button onClick={openAdd} className="gap-2 rounded-xl shrink-0">
          <Plus className="w-4 h-4" /> Add Staff
        </Button>
      </div>

      {/* PIN Banner — shown after create or reset */}
      {pinBanner && (
        <div className="bg-green-50 border border-green-300 rounded-2xl p-4 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-green-800 mb-1">
              🔑 Login credentials for <span className="font-black">{pinBanner.name}</span>
            </p>
            <p className="text-xs text-green-700 mb-2">
              Share these with the staff member. The PIN is shown <strong>once only</strong> and cannot be retrieved later.
            </p>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="bg-white border border-green-300 rounded-xl px-4 py-2 flex items-center gap-3 shadow-sm">
                <span className="text-xs text-green-600 font-semibold">PIN:</span>
                <span className="font-black text-xl tracking-widest text-green-900 font-mono">
                  {showPin ? pinBanner.pin : "••••"}
                </span>
                <button
                  onClick={() => setShowPin((v) => !v)}
                  className="text-green-600 hover:text-green-800 transition-colors"
                >
                  {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-green-600">
                Login: phone number as username · {pinBanner.pin.length}-digit PIN as password
              </p>
            </div>
          </div>
          <button
            onClick={() => setPinBanner(null)}
            className="text-green-600 hover:text-green-800 shrink-0 mt-0.5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Search + Category filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search staff..."
            className="pl-9 rounded-xl"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {["All", ...CATEGORIES].map((c) => (
            <button
              key={c}
              onClick={() => setFilterCat(c)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filterCat === c
                  ? "bg-primary text-white"
                  : "bg-white border border-border text-muted-foreground hover:border-primary"
              }`}
            >
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
                {["Staff Member", "Category / Paired", "Courses", "Actions"].map((h) => (
                  <th key={h} className="text-left font-semibold text-muted-foreground px-4 py-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={4} className="text-center py-12 text-muted-foreground">No staff found.</td></tr>
              )}
              {filtered.map((t) => {
                const pairedName = t.category !== "Assistant" ? t.assistantName : t.linkedTeacherName;
                return (
                <tr key={t.id} className="border-b border-border/50 hover:bg-gray-50 transition-colors align-top">
                  {/* Name + Contact */}
                  <td className="px-4 py-3 min-w-[200px]">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 bg-primary/10 text-primary rounded-full flex items-center justify-center font-bold text-sm shrink-0">
                        {t.name.split(" ").pop()?.charAt(0) ?? "T"}
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-secondary truncate">{t.name}</div>
                        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                          <Mail className="w-2.5 h-2.5 shrink-0" />
                          <span className="truncate">{t.email}</span>
                        </div>
                        {t.phone && (
                          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                            <Phone className="w-2.5 h-2.5 shrink-0" />
                            <span>{t.phone}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Category + Paired */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex flex-col gap-1">
                      <span className={`self-start text-xs px-2 py-0.5 rounded-full font-medium ${
                        t.category === "Assistant" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
                      }`}>
                        {t.category || "Teacher"}
                      </span>
                      {pairedName && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                          <UserCheck className="w-3 h-3 shrink-0" />
                          <span className="truncate max-w-[120px]">{pairedName}</span>
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Assigned sections — course · level · section per line */}
                  <td className="px-4 py-3">
                    {t.assignments.length === 0 ? (
                      <span className="text-xs text-muted-foreground italic">None assigned</span>
                    ) : (
                      <div className="space-y-1">
                        {t.assignments.map((a, i) => (
                          <div key={i} className="flex items-center gap-1 text-[11px] whitespace-nowrap">
                            <BookOpen className="w-2.5 h-2.5 text-primary shrink-0" />
                            <span className="font-medium text-secondary">{a.courseName}</span>
                            {a.levelName  && <><span className="text-muted-foreground/50">·</span><span className="text-muted-foreground">{a.levelName}</span></>}
                            {a.sectionName && <><span className="text-muted-foreground/50">·</span><span className="text-muted-foreground">{a.sectionName}</span></>}
                          </div>
                        ))}
                      </div>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => openEdit(t)}
                        title="Edit profile"
                        className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 flex items-center justify-center transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleResetPin(t)}
                        title="Reset login PIN"
                        disabled={resettingPin === t.id}
                        className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100 flex items-center justify-center transition-colors disabled:opacity-50"
                      >
                        {resettingPin === t.id
                          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          : <KeyRound className="w-3.5 h-3.5" />
                        }
                      </button>
                      {deleteConfirm === t.id ? (
                        <div className="flex gap-1">
                          <button onClick={() => handleDelete(t.id)} className="w-7 h-7 rounded-lg bg-red-500 text-white hover:bg-red-600 flex items-center justify-center">
                            <Check className="w-3 h-3" />
                          </button>
                          <button onClick={() => setDeleteConfirm(null)} className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirm(t.id)}
                          title="Delete staff member"
                          className="w-7 h-7 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 flex items-center justify-center"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Staff–Course Mapping */}
      {courseMap.size > 0 && (
        <div className="bg-white rounded-2xl border border-border p-6">
          <h3 className="font-bold text-secondary mb-4">Staff–Course Overview</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from(courseMap.values()).map((course) => (
              <div key={course.name} className="p-4 bg-gray-50 rounded-xl">
                <div className="font-semibold text-secondary mb-2">{course.name}</div>
                {course.teachers.map((label, i) => (
                  <div key={i} className="text-xs text-muted-foreground mb-0.5">• {label}</div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-border shrink-0">
              <h3 className="text-lg font-bold text-secondary">{editing ? "Edit Staff Profile" : "Add Staff Member"}</h3>
              <p className="text-xs text-muted-foreground mt-1">
                {editing
                  ? "Update profile details. To change login PIN, use the 🔑 button on the table row."
                  : "A 4-digit login PIN will be auto-generated and displayed once after saving."}
              </p>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm">{error}</div>
              )}

              <div className="space-y-1.5">
                <Label>Full Name <span className="text-red-500">*</span></Label>
                <Input
                  placeholder="Full name"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <Label>Email <span className="text-red-500">*</span></Label>
                <Input
                  type="email"
                  placeholder="Email address"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <Label>Phone <span className="text-red-500">*</span></Label>
                <Input
                  placeholder="e.g. (614) 555-0101"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  className="rounded-xl"
                />
                <p className="text-xs text-muted-foreground">Used as the primary login identifier for portal access.</p>
              </div>

              <div className="space-y-1.5">
                <Label>Category <span className="text-red-500">*</span></Label>
                <select
                  value={form.category}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className={selectCls}
                >
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {/* Pairing field — context-sensitive */}
              {!isAssistantForm && (
                <div className="space-y-1.5">
                  <Label>Teaching Assistant <span className="text-xs text-muted-foreground ml-1">(optional)</span></Label>
                  <select
                    value={form.assistantId ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, assistantId: e.target.value ? parseInt(e.target.value) : null }))}
                    className={selectCls}
                  >
                    <option value="">— None —</option>
                    {assistantOptions
                      .filter((a) => !editing || a.id !== editing.id)
                      .map((a) => <option key={a.id} value={a.id}>{a.name}</option>)
                    }
                  </select>
                  {assistantOptions.length === 0 && (
                    <p className="text-xs text-muted-foreground">No assistants found. Add a staff member with the "Assistant" category first.</p>
                  )}
                </div>
              )}

              {isAssistantForm && (
                <div className="space-y-1.5">
                  <Label>Assigned to Teacher <span className="text-xs text-muted-foreground ml-1">(optional)</span></Label>
                  <select
                    value={form.linkedTeacherId ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, linkedTeacherId: e.target.value ? parseInt(e.target.value) : null }))}
                    className={selectCls}
                  >
                    <option value="">— None —</option>
                    {teacherOptions
                      .filter((t) => !editing || t.id !== editing.id)
                      .map((t) => <option key={t.id} value={t.id}>{t.name}</option>)
                    }
                  </select>
                  {teacherOptions.length === 0 && (
                    <p className="text-xs text-muted-foreground">No teachers found. Add a teacher first.</p>
                  )}
                </div>
              )}

            </div>

            <div className="p-6 border-t border-border flex justify-end gap-3 shrink-0">
              <Button variant="outline" onClick={() => setShowModal(false)} className="rounded-xl" disabled={saving}>
                Cancel
              </Button>
              <Button onClick={handleSave} className="rounded-xl gap-2" disabled={saving}>
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {editing ? "Save Changes" : "Add Staff"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
