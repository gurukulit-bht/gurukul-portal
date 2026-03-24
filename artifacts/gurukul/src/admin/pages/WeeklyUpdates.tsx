import { useState, useEffect, useCallback } from "react";
import {
  Plus, Pencil, Trash2, Send, Eye, EyeOff,
  Calendar, ChevronDown, ChevronUp, Save, X, Loader2, FileText, Lock,
} from "lucide-react";
import { adminApi } from "@/lib/adminApi";
import { useAuth } from "../AuthContext";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

type Status   = "Draft" | "Published";
type Priority = "High" | "Normal" | "Low";

type Update = {
  id: number;
  courseId: number | null;
  courseName: string;
  levelId: number | null;
  levelName: string;
  sectionId: number | null;
  sectionName: string;
  weekStart: string;
  weekEnd: string;
  title: string;
  content: string;
  homework: string;
  reminders: string;
  priority: Priority;
  status: Status;
  teacherName: string;
  createdBy: string;
  publishedAt: string | null;
  createdAt: string | null;
};

type CourseOpt  = { id: number; name: string };
type LevelOpt   = { id: number; courseId: number; name: string };
type SectionOpt = { id: number; levelId: number; name: string };

type FormMeta = {
  courses:  CourseOpt[];
  levels:   LevelOpt[];
  sections: SectionOpt[];
};

type FormState = {
  courseId: number | null; courseName: string;
  levelId:  number | null; levelName:  string;
  sectionId: number | null; sectionName: string;
  weekStart: string; weekEnd: string;
  title: string; content: string;
  homework: string; reminders: string;
  priority: Priority; status: Status;
};

const BLANK: FormState = {
  courseId: null, courseName: "",
  levelId: null,  levelName: "",
  sectionId: null, sectionName: "",
  weekStart: "", weekEnd: "",
  title: "", content: "", homework: "", reminders: "",
  priority: "Normal", status: "Draft",
};

function todayStr()    { return new Date().toISOString().split("T")[0]; }
function nextWeekStr() { const d = new Date(); d.setDate(d.getDate() + 6); return d.toISOString().split("T")[0]; }

// ─── Badges ───────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: Status }) {
  return status === "Published"
    ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-semibold"><Eye className="w-3 h-3" /> Published</span>
    : <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 text-xs font-semibold"><EyeOff className="w-3 h-3" /> Draft</span>;
}

function PriorityBadge({ priority }: { priority: Priority }) {
  const cls =
    priority === "High" ? "bg-red-100 text-red-700" :
    priority === "Low"  ? "bg-gray-100 text-gray-500" :
                          "bg-blue-100 text-blue-700";
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${cls}`}>{priority}</span>;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function WeeklyUpdates() {
  const { user } = useAuth();
  const isAdmin  = user?.role === "admin";

  const [updates, setUpdates]       = useState<Update[]>([]);
  const [meta, setMeta]             = useState<FormMeta>({ courses: [], levels: [], sections: [] });
  const [loading, setLoading]       = useState(true);
  const [showForm, setShowForm]     = useState(false);
  const [editing, setEditing]       = useState<Update | null>(null);
  const [saving, setSaving]         = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState<"" | Status>("");

  const [form, setForm]                     = useState<FormState>({ ...BLANK });
  const [filteredLevels, setFilteredLevels] = useState<LevelOpt[]>([]);
  const [filteredSections, setFilteredSections] = useState<SectionOpt[]>([]);

  // Is the course locked (teacher with exactly one assigned course)?
  const courseLocked = !isAdmin && meta.courses.length === 1;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [rows, m] = await Promise.all([
        adminApi.weeklyUpdates.list() as Promise<Update[]>,
        adminApi.weeklyUpdates.formMeta() as Promise<FormMeta>,
      ]);
      setUpdates(rows);
      setMeta(m);
    } catch {
      toast.error("Failed to load weekly updates");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Cascade: course → levels
  useEffect(() => {
    if (!form.courseId) { setFilteredLevels([]); setFilteredSections([]); return; }
    const lvls = meta.levels.filter((l) => l.courseId === form.courseId);
    setFilteredLevels(lvls);
    setFilteredSections([]);
    setForm((f) => ({ ...f, levelId: null, levelName: "", sectionId: null, sectionName: "" }));
  }, [form.courseId, meta.levels]);

  // Cascade: level → sections
  useEffect(() => {
    if (!form.levelId) { setFilteredSections([]); return; }
    setFilteredSections(meta.sections.filter((s) => s.levelId === form.levelId));
    setForm((f) => ({ ...f, sectionId: null, sectionName: "" }));
  }, [form.levelId, meta.sections]);

  function openNew() {
    const single = meta.courses.length === 1 ? meta.courses[0] : null;
    setForm({
      ...BLANK,
      weekStart: todayStr(),
      weekEnd:   nextWeekStr(),
      courseId:  single?.id   ?? null,
      courseName: single?.name ?? "",
    });
    setFilteredLevels(single ? meta.levels.filter((l) => l.courseId === single.id) : []);
    setFilteredSections([]);
    setEditing(null);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function openEdit(u: Update) {
    setForm({
      courseId: u.courseId, courseName: u.courseName,
      levelId:  u.levelId,  levelName:  u.levelName,
      sectionId: u.sectionId, sectionName: u.sectionName,
      weekStart: u.weekStart, weekEnd: u.weekEnd,
      title: u.title, content: u.content,
      homework: u.homework ?? "", reminders: u.reminders ?? "",
      priority: u.priority ?? "Normal",
      status: u.status,
    });
    setFilteredLevels(meta.levels.filter((l) => l.courseId === u.courseId));
    setFilteredSections(meta.sections.filter((s) => s.levelId === u.levelId));
    setEditing(u);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function closeForm() { setShowForm(false); setEditing(null); }
  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSave(publishNow = false) {
    if (!form.title.trim() || !form.content.trim() || !form.weekStart || !form.weekEnd) {
      toast.error("Title, class highlights, and week dates are required");
      return;
    }
    setSaving(true);
    try {
      const teacherName = user?.displayName ?? user?.email ?? "";
      const payload = {
        ...form,
        teacherName,
        createdBy: user?.email ?? "",
        status: publishNow ? "Published" : form.status,
        // Clear removed fields so API doesn't get stale data
        topicsCovered: "", upcomingPlan: "", attachmentLink: "",
      };
      if (editing) {
        await adminApi.weeklyUpdates.update(editing.id, payload);
        toast.success(publishNow ? "Update published!" : "Update saved");
      } else {
        await adminApi.weeklyUpdates.create(payload);
        toast.success(publishNow ? "Update published!" : "Draft saved");
      }
      await load();
      closeForm();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function handlePublish(id: number) {
    try {
      await adminApi.weeklyUpdates.publish(id);
      toast.success("Update published!");
      await load();
    } catch { toast.error("Failed to publish"); }
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this update?")) return;
    try {
      await adminApi.weeklyUpdates.remove(id);
      toast.success("Deleted");
      await load();
    } catch { toast.error("Failed to delete"); }
  }

  const displayed = updates.filter((u) => !filterStatus || u.status === filterStatus);

  // ─── Form Panel ──────────────────────────────────────────────────────────────

  const FormPanel = () => (
    <div className="bg-white rounded-2xl border border-border shadow-sm mb-6 overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-gray-50">
        <h2 className="font-bold text-secondary flex items-center gap-2">
          <FileText className="w-4 h-4" />
          {editing ? "Edit Weekly Update" : "New Weekly Update"}
        </h2>
        <Button variant="ghost" size="icon" onClick={closeForm}><X className="w-4 h-4" /></Button>
      </div>

      <div className="p-6 space-y-5">

        {/* ── Course / Level / Section ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="label flex items-center gap-1.5">
              Course {courseLocked && <Lock className="w-3 h-3 text-muted-foreground" />}
            </label>
            {courseLocked ? (
              <div className="input bg-gray-50 text-secondary font-medium flex items-center gap-2">
                <span>{form.courseName}</span>
                <span className="text-xs text-muted-foreground ml-auto">Your course</span>
              </div>
            ) : (
              <select
                className="input"
                value={form.courseId ?? ""}
                onChange={(e) => {
                  const id = e.target.value ? Number(e.target.value) : null;
                  const name = meta.courses.find((c) => c.id === id)?.name ?? "";
                  setForm((f) => ({ ...f, courseId: id, courseName: name }));
                }}
              >
                <option value="">Select course…</option>
                {meta.courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            )}
          </div>
          <div>
            <label className="label">Level</label>
            <select
              className="input"
              value={form.levelId ?? ""}
              onChange={(e) => {
                const id = e.target.value ? Number(e.target.value) : null;
                const name = filteredLevels.find((l) => l.id === id)?.name ?? "";
                setForm((f) => ({ ...f, levelId: id, levelName: name }));
              }}
              disabled={!form.courseId}
            >
              <option value="">Select level…</option>
              {filteredLevels.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Section</label>
            <select
              className="input"
              value={form.sectionId ?? ""}
              onChange={(e) => {
                const id = e.target.value ? Number(e.target.value) : null;
                const name = filteredSections.find((s) => s.id === id)?.name ?? "";
                setForm((f) => ({ ...f, sectionId: id, sectionName: name }));
              }}
              disabled={!form.levelId}
            >
              <option value="">All sections</option>
              {filteredSections.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        </div>

        {/* ── Week dates + Priority ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div>
            <label className="label">Week Start *</label>
            <input type="date" className="input" value={form.weekStart}
              onChange={(e) => setField("weekStart", e.target.value)} />
          </div>
          <div>
            <label className="label">Week End *</label>
            <input type="date" className="input" value={form.weekEnd}
              onChange={(e) => setField("weekEnd", e.target.value)} />
          </div>
          <div>
            <label className="label">Priority</label>
            <select className="input" value={form.priority}
              onChange={(e) => setField("priority", e.target.value as Priority)}>
              <option value="High">🔴 High</option>
              <option value="Normal">🔵 Normal</option>
              <option value="Low">⚪ Low</option>
            </select>
          </div>
        </div>

        {/* ── Title ── */}
        <div>
          <label className="label">Title *</label>
          <input
            className="input"
            placeholder="e.g. Week 3 – Introduction to Devanagari Script"
            value={form.title}
            onChange={(e) => setField("title", e.target.value)}
          />
        </div>

        {/* ── Class Highlights ── */}
        <div>
          <label className="label">Class Highlights *</label>
          <textarea
            className="input min-h-[100px] resize-y"
            placeholder="What did you cover in class this week? How did students do?"
            value={form.content}
            onChange={(e) => setField("content", e.target.value)}
          />
        </div>

        {/* ── Homework + Reminders ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Homework</label>
            <textarea className="input resize-y" rows={3}
              placeholder="Homework assigned this week…"
              value={form.homework}
              onChange={(e) => setField("homework", e.target.value)} />
          </div>
          <div>
            <label className="label">Reminders for Parents</label>
            <textarea className="input resize-y" rows={3}
              placeholder="Important reminders, upcoming dates…"
              value={form.reminders}
              onChange={(e) => setField("reminders", e.target.value)} />
          </div>
        </div>

        {/* ── Status toggle ── */}
        <div>
          <label className="label">Save as</label>
          <div className="flex gap-3">
            {(["Draft", "Published"] as Status[]).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setField("status", s)}
                className={`px-4 py-2 rounded-xl border-2 text-sm font-semibold transition-all ${
                  form.status === s
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:border-primary/50"
                }`}
              >
                {s === "Draft"
                  ? <><EyeOff className="w-3.5 h-3.5 inline mr-1" />Draft</>
                  : <><Eye className="w-3.5 h-3.5 inline mr-1" />Publish Now</>}
              </button>
            ))}
          </div>
        </div>

        {/* ── Actions ── */}
        <div className="flex gap-3 pt-2">
          <Button onClick={() => handleSave(false)} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            Save
          </Button>
          {form.status !== "Published" && (
            <Button variant="outline" onClick={() => handleSave(true)} disabled={saving}>
              <Send className="w-4 h-4 mr-2" /> Save & Publish
            </Button>
          )}
          <Button variant="ghost" onClick={closeForm} disabled={saving}>Cancel</Button>
        </div>
      </div>
    </div>
  );

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-secondary">Weekly Updates</h1>
          <p className="text-sm text-muted-foreground">
            {isAdmin
              ? "View and manage all class updates published by teachers"
              : "Publish weekly class updates for parents to read on the website"}
          </p>
        </div>
        {!isAdmin && (
          <Button onClick={openNew} className="flex items-center gap-2">
            <Plus className="w-4 h-4" /> New Update
          </Button>
        )}
        {isAdmin && (
          <Button onClick={openNew} className="flex items-center gap-2">
            <Plus className="w-4 h-4" /> New Update
          </Button>
        )}
      </div>

      {/* Form */}
      {showForm && <FormPanel />}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 bg-white rounded-xl border border-border px-4 py-3 items-center">
        <select
          className="input w-auto text-sm"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as "" | Status)}
        >
          <option value="">All Status</option>
          <option value="Draft">Draft</option>
          <option value="Published">Published</option>
        </select>
        <span className="text-sm text-muted-foreground ml-auto">
          {displayed.length} update{displayed.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-20 text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading…
        </div>
      ) : displayed.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No updates yet</p>
          <p className="text-sm mt-1">Click "New Update" to write your first weekly update.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayed.map((u) => {
            const expanded = expandedId === u.id;
            return (
              <div key={u.id} className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
                <div className="flex items-start gap-4 px-5 py-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <StatusBadge status={u.status} />
                      <PriorityBadge priority={u.priority ?? "Normal"} />
                      {u.courseName && (
                        <span className="text-xs text-muted-foreground bg-gray-100 px-2 py-0.5 rounded-full">{u.courseName}</span>
                      )}
                      {u.levelName && (
                        <span className="text-xs text-muted-foreground bg-gray-100 px-2 py-0.5 rounded-full">{u.levelName}</span>
                      )}
                      {u.sectionName && (
                        <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{u.sectionName}</span>
                      )}
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {u.weekStart} → {u.weekEnd}
                      </span>
                    </div>
                    <h3 className="font-bold text-secondary text-base">{u.title}</h3>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      By {u.teacherName || u.createdBy}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      className="text-muted-foreground hover:text-secondary p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                      onClick={() => setExpandedId(expanded ? null : u.id)}
                      title={expanded ? "Collapse" : "Expand"}
                    >
                      {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    <button
                      className="text-muted-foreground hover:text-primary p-1.5 rounded-lg hover:bg-primary/10 transition-colors"
                      onClick={() => openEdit(u)}
                      title="Edit"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    {u.status === "Draft" && (
                      <button
                        className="text-muted-foreground hover:text-green-600 p-1.5 rounded-lg hover:bg-green-50 transition-colors"
                        onClick={() => handlePublish(u.id)}
                        title="Publish"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      className="text-muted-foreground hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                      onClick={() => handleDelete(u.id)}
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {expanded && (
                  <div className="border-t border-border px-5 py-4 space-y-4 bg-gray-50">
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                        Class Highlights
                      </p>
                      <p className="text-sm text-secondary whitespace-pre-wrap">{u.content}</p>
                    </div>
                    {u.homework && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3">
                        <p className="text-xs font-semibold text-yellow-800 uppercase tracking-wider mb-1">
                          Homework
                        </p>
                        <p className="text-sm text-yellow-900 whitespace-pre-wrap">{u.homework}</p>
                      </div>
                    )}
                    {u.reminders && (
                      <div className="bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
                        <p className="text-xs font-semibold text-rose-800 uppercase tracking-wider mb-1">
                          Reminders
                        </p>
                        <p className="text-sm text-rose-900 whitespace-pre-wrap">{u.reminders}</p>
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {u.publishedAt
                        ? `Published ${new Date(u.publishedAt).toLocaleDateString()}`
                        : `Created ${u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "—"}`}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
