import { useState, useEffect } from "react";
import { adminApi } from "@/lib/adminApi";
import { Plus, Edit2, Trash2, Check, X, Search, Phone, Mail, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Teacher = {
  id: number; name: string; email: string; phone: string;
  assignedCourse: string; assignedLevel: string; timing: string; status: "Active" | "Inactive";
};

const courses = ["Hindi", "Dharma", "Telugu", "Tamil", "Sanskrit", "Gujarati"];
const levels = ["All Levels", "Beginner (L1-L3)", "Advanced (L4-L7)", "Level 1", "Level 2", "Level 3", "Level 4", "Level 5", "Level 6", "Level 7"];
const emptyForm: Omit<Teacher, "id"> = { name: "", email: "", phone: "", assignedCourse: "Hindi", assignedLevel: "All Levels", timing: "", status: "Active" };

export default function Teachers() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [filterCourse, setFilterCourse] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Teacher | null>(null);
  const [form, setForm] = useState<Omit<Teacher, "id">>(emptyForm);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    adminApi.teachers.list().then((d) => setTeachers(d as Teacher[])).finally(() => setLoading(false));
  }, []);

  const filtered = teachers.filter((t) =>
    (filterCourse === "All" || t.assignedCourse === filterCourse) &&
    (t.name.toLowerCase().includes(search.toLowerCase()) || t.email.toLowerCase().includes(search.toLowerCase()))
  );

  function openAdd() { setEditing(null); setForm(emptyForm); setError(""); setShowModal(true); }
  function openEdit(t: Teacher) {
    setEditing(t);
    setForm({ name: t.name, email: t.email, phone: t.phone, assignedCourse: t.assignedCourse, assignedLevel: t.assignedLevel, timing: t.timing, status: t.status });
    setError(""); setShowModal(true);
  }

  async function handleSave() {
    if (!form.name.trim() || !form.email.trim() || !form.timing.trim()) { setError("Please fill in all required fields."); return; }
    const conflict = teachers.find((t) => t.timing === form.timing && t.assignedCourse === form.assignedCourse && (!editing || t.id !== editing.id));
    if (conflict) { setError(`Conflict: ${conflict.name} is already assigned to ${form.assignedCourse} at this time.`); return; }
    setSaving(true);
    try {
      if (editing) {
        const updated = await adminApi.teachers.update(editing.id, form);
        setTeachers((prev) => prev.map((t) => t.id === editing.id ? updated as Teacher : t));
      } else {
        const created = await adminApi.teachers.create(form);
        setTeachers((prev) => [...prev, created as Teacher]);
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
      setDeleteConfirm(null);
    } catch {
      /* silent */
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-secondary">Teacher Assignment</h2>
          <p className="text-sm text-muted-foreground">{teachers.filter((t) => t.status === "Active").length} active teachers</p>
        </div>
        <Button onClick={openAdd} className="gap-2 rounded-xl shrink-0">
          <Plus className="w-4 h-4" /> Add Teacher
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search teachers..." className="pl-9 rounded-xl" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex flex-wrap gap-2">
          {["All", ...courses].map((c) => (
            <button key={c} onClick={() => setFilterCourse(c)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filterCourse === c ? "bg-primary text-white" : "bg-white border border-border text-muted-foreground hover:border-primary"}`}>
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-border">
              <tr>
                {["Teacher", "Contact", "Course", "Level", "Timing", "Status", "Actions"].map((h) => (
                  <th key={h} className="text-left font-semibold text-muted-foreground px-4 py-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="text-center py-12 text-muted-foreground">No teachers found.</td></tr>
              )}
              {filtered.map((t) => (
                <tr key={t.id} className="border-b border-border/50 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-primary/10 text-primary rounded-full flex items-center justify-center font-bold text-sm shrink-0">
                        {t.name.split(" ").pop()?.charAt(0) ?? "T"}
                      </div>
                      <div className="font-medium text-secondary">{t.name}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Mail className="w-3 h-3" />{t.email}</div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Phone className="w-3 h-3" />{t.phone}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 bg-primary/10 text-primary rounded-lg text-xs font-medium">{t.assignedCourse || "—"}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{t.assignedLevel || "—"}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{t.timing || "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${t.status === "Active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>{t.status}</span>
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

      <div className="bg-white rounded-2xl border border-border p-6">
        <h3 className="font-bold text-secondary mb-4">Teacher–Course Mapping</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map((course) => {
            const assigned = teachers.filter((t) => t.assignedCourse === course && t.status === "Active");
            return (
              <div key={course} className="p-4 bg-gray-50 rounded-xl">
                <div className="font-semibold text-secondary mb-2">{course}</div>
                {assigned.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">No teacher assigned</p>
                ) : assigned.map((t) => (
                  <div key={t.id} className="text-xs text-muted-foreground mb-1">• {t.name} — {t.assignedLevel}</div>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-border">
              <h3 className="text-lg font-bold text-secondary">{editing ? "Edit Teacher" : "Add Teacher"}</h3>
            </div>
            <div className="p-6 space-y-4">
              {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm">{error}</div>}
              <div className="space-y-1.5"><Label>Full Name *</Label><Input placeholder="Teacher name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="rounded-xl" /></div>
              <div className="space-y-1.5"><Label>Email *</Label><Input type="email" placeholder="Email address" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} className="rounded-xl" /></div>
              <div className="space-y-1.5"><Label>Phone</Label><Input placeholder="Phone number" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} className="rounded-xl" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Assigned Course</Label>
                  <select value={form.assignedCourse} onChange={(e) => setForm((f) => ({ ...f, assignedCourse: e.target.value }))} className="w-full border border-input rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-ring">
                    {courses.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label>Level</Label>
                  <select value={form.assignedLevel} onChange={(e) => setForm((f) => ({ ...f, assignedLevel: e.target.value }))} className="w-full border border-input rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-ring">
                    {levels.map((l) => <option key={l}>{l}</option>)}
                  </select>
                </div>
              </div>
              <div className="space-y-1.5"><Label>Class Timing *</Label><Input placeholder="e.g. Sundays 10:00–11:00 AM" value={form.timing} onChange={(e) => setForm((f) => ({ ...f, timing: e.target.value }))} className="rounded-xl" /></div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as "Active" | "Inactive" }))} className="w-full border border-input rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-ring">
                  <option>Active</option><option>Inactive</option>
                </select>
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
