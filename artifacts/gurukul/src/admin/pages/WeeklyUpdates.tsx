import { useState, useEffect, useCallback, useRef } from "react";
import {
  Send, Trash2, Pencil, Loader2, BookOpen, Lock, X, Check,
} from "lucide-react";
import { adminApi } from "@/lib/adminApi";
import { useAuth } from "../AuthContext";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

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
  status: string;
  teacherName: string;
  createdBy: string;
  publishedAt: string | null;
  createdAt: string | null;
};

type CourseOpt  = { id: number; name: string };
type LevelOpt   = { id: number; courseId: number; name: string };
type SectionOpt = { id: number; levelId: number; name: string };
type FormMeta   = { courses: CourseOpt[]; levels: LevelOpt[]; sections: SectionOpt[] };

function todayStr() { return new Date().toISOString().split("T")[0]; }

function fmtDate(d: string) {
  if (!d) return "";
  const [y, m, day] = d.split("-");
  return new Date(+y, +m - 1, +day).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

function initials(name: string) {
  return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) || "T";
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function WeeklyUpdates() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const textRef = useRef<HTMLTextAreaElement>(null);

  const [updates, setUpdates] = useState<Update[]>([]);
  const [meta, setMeta]       = useState<FormMeta>({ courses: [], levels: [], sections: [] });
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [editingId, setEditingId]   = useState<number | null>(null);
  const [editText, setEditText]     = useState("");
  const [editSaving, setEditSaving] = useState(false);

  // Compose form state
  const [message,    setMessage]    = useState("");
  const [date,       setDate]       = useState(todayStr);
  const [courseId,   setCourseId]   = useState<number | null>(null);
  const [courseName, setCourseName] = useState("");
  const [levelId,    setLevelId]    = useState<number | null>(null);
  const [levelName,  setLevelName]  = useState("");
  const [sectionId,  setSectionId]  = useState<number | null>(null);
  const [sectionName, setSectionName] = useState("");

  const courseLocked = !isAdmin && meta.courses.length === 1;

  const filteredLevels   = meta.levels.filter(l => l.courseId === courseId);
  const filteredSections = meta.sections.filter(s => s.levelId === levelId);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [rows, m] = await Promise.all([
        adminApi.weeklyUpdates.list() as Promise<Update[]>,
        adminApi.weeklyUpdates.formMeta() as Promise<FormMeta>,
      ]);
      setUpdates(rows);
      setMeta(m);

      // Auto-select single assigned course
      if (!isAdmin && m.courses.length === 1) {
        setCourseId(m.courses[0].id);
        setCourseName(m.courses[0].name);
      }
    } catch {
      toast.error("Failed to load updates");
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => { load(); }, [load]);

  // Reset level/section when course changes
  useEffect(() => {
    setLevelId(null); setLevelName("");
    setSectionId(null); setSectionName("");
  }, [courseId]);

  // Reset section when level changes
  useEffect(() => {
    setSectionId(null); setSectionName("");
  }, [levelId]);

  async function handlePost() {
    if (!message.trim()) { toast.error("Please write a message"); return; }
    if (!courseId)        { toast.error("Please select a course"); return; }

    setPosting(true);
    try {
      const title = message.trim().slice(0, 80) + (message.trim().length > 80 ? "…" : "");
      await adminApi.weeklyUpdates.create({
        courseId, courseName,
        levelId:    levelId   ?? null,
        levelName:  levelName  ?? "",
        sectionId:  sectionId  ?? null,
        sectionName: sectionName ?? "",
        weekStart: date,
        weekEnd:   date,
        title,
        content:    message.trim(),
        homework:   "",
        reminders:  "",
        topicsCovered: "",
        upcomingPlan:  "",
        attachmentLink: "",
        priority:   "Normal",
        status:     "Published",
        teacherName: user?.displayName ?? user?.email ?? "",
        createdBy:  user?.email ?? "",
      });
      toast.success("Update posted!");
      setMessage("");
      setDate(todayStr());
      await load();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to post");
    } finally {
      setPosting(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this update?")) return;
    try {
      await adminApi.weeklyUpdates.remove(id);
      toast.success("Deleted");
      await load();
    } catch { toast.error("Failed to delete"); }
  }

  function startEdit(u: Update) {
    setEditingId(u.id);
    setEditText(u.content);
  }

  async function saveEdit(u: Update) {
    if (!editText.trim()) return;
    setEditSaving(true);
    try {
      const title = editText.trim().slice(0, 80) + (editText.trim().length > 80 ? "…" : "");
      await adminApi.weeklyUpdates.update(u.id, {
        courseId: u.courseId, courseName: u.courseName,
        levelId: u.levelId, levelName: u.levelName,
        sectionId: u.sectionId, sectionName: u.sectionName,
        weekStart: u.weekStart, weekEnd: u.weekEnd,
        title, content: editText.trim(),
        homework: "", reminders: "", topicsCovered: "",
        upcomingPlan: "", attachmentLink: "",
        priority: "Normal", status: "Published",
        teacherName: u.teacherName, createdBy: u.createdBy,
      });
      toast.success("Updated");
      setEditingId(null);
      await load();
    } catch { toast.error("Failed to update"); }
    finally { setEditSaving(false); }
  }

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 max-w-2xl mx-auto">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-secondary">Weekly Updates</h1>
        <p className="text-sm text-muted-foreground">
          {isAdmin
            ? "All class updates posted by teachers"
            : "Post quick updates for parents to see on the website"}
        </p>
      </div>

      {/* ── Compose Box ── */}
      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="px-5 pt-5 pb-4 space-y-4">

          {/* Row 1: Date + Course + Level + Section */}
          <div className="flex flex-wrap gap-3 items-end">

            {/* Date */}
            <div className="flex flex-col gap-1 min-w-[130px]">
              <label className="text-xs font-medium text-muted-foreground">Date</label>
              <input
                type="date"
                className="input text-sm h-9 px-3"
                value={date}
                onChange={e => setDate(e.target.value)}
              />
            </div>

            {/* Course */}
            <div className="flex flex-col gap-1 min-w-[150px] flex-1">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                Course {courseLocked && <Lock className="w-3 h-3" />}
              </label>
              {courseLocked ? (
                <div className="input h-9 px-3 flex items-center text-sm bg-gray-50 text-secondary font-medium">
                  {courseName}
                </div>
              ) : (
                <select
                  className="input text-sm h-9 px-3"
                  value={courseId ?? ""}
                  onChange={e => {
                    const id = e.target.value ? Number(e.target.value) : null;
                    setCourseId(id);
                    setCourseName(meta.courses.find(c => c.id === id)?.name ?? "");
                  }}
                >
                  <option value="">Course…</option>
                  {meta.courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              )}
            </div>

            {/* Level */}
            <div className="flex flex-col gap-1 min-w-[120px]">
              <label className="text-xs font-medium text-muted-foreground">Level</label>
              <select
                className="input text-sm h-9 px-3"
                value={levelId ?? ""}
                onChange={e => {
                  const id = e.target.value ? Number(e.target.value) : null;
                  setLevelId(id);
                  setLevelName(filteredLevels.find(l => l.id === id)?.name ?? "");
                }}
                disabled={!courseId || filteredLevels.length === 0}
              >
                <option value="">Level…</option>
                {filteredLevels.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </div>

            {/* Section */}
            <div className="flex flex-col gap-1 min-w-[120px]">
              <label className="text-xs font-medium text-muted-foreground">Section</label>
              <select
                className="input text-sm h-9 px-3"
                value={sectionId ?? ""}
                onChange={e => {
                  const id = e.target.value ? Number(e.target.value) : null;
                  setSectionId(id);
                  setSectionName(filteredSections.find(s => s.id === id)?.name ?? "");
                }}
                disabled={!levelId || filteredSections.length === 0}
              >
                <option value="">All</option>
                {filteredSections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>

          {/* Row 2: Message */}
          <textarea
            ref={textRef}
            className="w-full rounded-xl border border-border px-4 py-3 text-sm text-secondary placeholder:text-muted-foreground focus:outline-none focus:border-primary resize-none min-h-[90px]"
            placeholder="Write your update for parents… (e.g. This week we practiced Devanagari letters. Homework: pages 12–14.)"
            value={message}
            onChange={e => setMessage(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handlePost();
            }}
          />
        </div>

        {/* Footer */}
        <div className="px-5 pb-4 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {message.length > 0 ? `${message.length} chars` : "Ctrl+Enter to post"}
          </span>
          <button
            onClick={handlePost}
            disabled={posting || !message.trim() || !courseId}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {posting
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Posting…</>
              : <><Send className="w-4 h-4" /> Post Update</>}
          </button>
        </div>
      </div>

      {/* ── Feed ── */}
      {loading ? (
        <div className="flex justify-center py-16 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading…
        </div>
      ) : updates.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium text-sm">No updates yet</p>
          <p className="text-xs mt-1">Post your first update above — parents will see it instantly.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {updates.map(u => {
            const isEditing = editingId === u.id;
            const canEdit   = isAdmin || u.createdBy === user?.email;
            const audience  = [u.courseName, u.levelName, u.sectionName].filter(Boolean).join(" · ");
            const name      = u.teacherName || u.createdBy;

            return (
              <div key={u.id} className="bg-white rounded-2xl border border-border shadow-sm px-5 py-4">

                {/* Top row */}
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    {initials(name)}
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Name + date */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-secondary">{name}</span>
                      <span className="text-xs text-muted-foreground">{fmtDate(u.weekStart)}</span>
                      {audience && (
                        <span className="text-xs bg-primary/8 text-primary px-2 py-0.5 rounded-full font-medium">
                          {audience}
                        </span>
                      )}
                    </div>

                    {/* Message */}
                    {isEditing ? (
                      <div className="mt-2 space-y-2">
                        <textarea
                          className="w-full rounded-xl border border-border px-3 py-2 text-sm text-secondary focus:outline-none focus:border-primary resize-none min-h-[80px]"
                          value={editText}
                          onChange={e => setEditText(e.target.value)}
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => saveEdit(u)}
                            disabled={editSaving}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors"
                          >
                            {editSaving
                              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              : <Check className="w-3.5 h-3.5" />}
                            Save
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs text-secondary hover:bg-gray-50 transition-colors"
                          >
                            <X className="w-3.5 h-3.5" /> Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-secondary mt-1 whitespace-pre-wrap leading-relaxed">
                        {u.content}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  {canEdit && !isEditing && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => startEdit(u)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                        title="Edit"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(u.id)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
