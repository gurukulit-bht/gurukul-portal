import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  Send, Trash2, Pencil, Loader2, BookOpen, Lock, X, Check,
  Eye, AlertTriangle, Bell, ChevronDown, ChevronRight, Pin,
  StickyNote, MessageSquare, CalendarDays, MapPin, Clock, RefreshCw,
} from "lucide-react";
import { adminApi } from "@/lib/adminApi";
import { useAuth } from "../AuthContext";
import { toast } from "sonner";
import NotesTab from "../components/NotesTab";

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

type RawLevel   = { id: number; className: string; schedule: string; courseName: string; courseId: number };
type SectionOpt = { id: number; sectionName: string; schedule: string };

type Notice = {
  id: number;
  title: string;
  content: string;
  date: string;
  isUrgent: boolean;
  isActive: boolean;
  category: string;
  expiryDate: string | null;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function todayStr() { return new Date().toISOString().split("T")[0]; }

function fmtDate(d: string) {
  if (!d) return "";
  const [y, m, day] = d.split("-");
  return new Date(+y, +m - 1, +day).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

function fmtDateLong(d: string) {
  if (!d) return "";
  const [y, m, day] = d.split("-");
  return new Date(+y, +m - 1, +day).toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });
}

function initials(name: string) {
  return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) || "T";
}


// ─── Notice Board ─────────────────────────────────────────────────────────────

const CATEGORY_COLORS: Record<string, string> = {
  General:      "bg-gray-100 text-gray-700",
  Events:       "bg-blue-100 text-blue-700",
  Holiday:      "bg-purple-100 text-purple-700",
  Registration: "bg-green-100 text-green-700",
  Urgent:       "bg-red-100 text-red-700",
};

function NoticeBoard() {
  const [notices, setNotices]   = useState<Notice[]>([]);
  const [loading, setLoading]   = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    adminApi.announcements.list()
      .then(data => {
        const all = (data as Notice[]).filter(n => n.isActive);
        setNotices(all);
        // Auto-expand the most recent date group
        const dates = Array.from(new Set(all.map(n => n.date))).sort((a, b) => b.localeCompare(a));
        if (dates.length > 0) setExpanded({ [dates[0]]: true });
      })
      .catch(() => toast.error("Failed to load notices"))
      .finally(() => setLoading(false));
  }, []);

  // Group by date, descending
  const dateGroups = useMemo(() => {
    const map: Record<string, Notice[]> = {};
    for (const n of notices) {
      if (!map[n.date]) map[n.date] = [];
      map[n.date].push(n);
    }
    return Object.entries(map)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([date, items]) => ({ date, items }));
  }, [notices]);

  const toggle = (date: string) => setExpanded(prev => ({ ...prev, [date]: !prev[date] }));

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 text-muted-foreground py-16">
        <Loader2 className="w-5 h-5 animate-spin" /> Loading announcements…
      </div>
    );
  }

  if (dateGroups.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <Bell className="w-10 h-10 mx-auto mb-3 opacity-30" />
        <p className="font-medium text-sm">No announcements from admin</p>
        <p className="text-xs mt-1">Check back later for updates.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {dateGroups.map(({ date, items }) => {
        const isOpen = !!expanded[date];
        const hasUrgent = items.some(n => n.isUrgent);
        return (
          <div key={date} className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
            {/* Date header */}
            <button
              onClick={() => toggle(date)}
              className="w-full px-5 py-3.5 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left"
            >
              <div className="shrink-0 text-muted-foreground">
                {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </div>
              <div className="flex-1 flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-secondary text-sm">{fmtDateLong(date)}</span>
                <span className="text-xs text-muted-foreground bg-gray-100 px-2 py-0.5 rounded-full">
                  {items.length} announcement{items.length !== 1 ? "s" : ""}
                </span>
                {hasUrgent && (
                  <span className="inline-flex items-center gap-1 text-xs bg-red-100 text-red-700 border border-red-200 px-2 py-0.5 rounded-full font-medium">
                    <AlertTriangle className="w-3 h-3" /> Urgent
                  </span>
                )}
              </div>
            </button>

            {isOpen && (
              <div className="border-t border-border divide-y divide-border">
                {items.map(n => (
                  <div key={n.id} className={`px-5 py-4 ${n.isUrgent ? "bg-red-50/50" : ""}`}>
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                        n.isUrgent ? "bg-red-100 text-red-600" : "bg-primary/10 text-primary"
                      }`}>
                        {n.isUrgent ? <AlertTriangle className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="font-semibold text-secondary text-sm">{n.title}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[n.category] ?? "bg-gray-100 text-gray-700"}`}>
                            {n.category}
                          </span>
                          {n.isUrgent && (
                            <span className="text-xs bg-red-100 text-red-700 border border-red-200 px-2 py-0.5 rounded-full font-medium">
                              Urgent
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-secondary leading-relaxed whitespace-pre-wrap">{n.content}</p>
                        {n.expiryDate && (
                          <p className="text-xs text-muted-foreground mt-1.5">
                            Expires: {fmtDate(n.expiryDate)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Calendar Panel ──────────────────────────────────────────────────────────

type GEvent = {
  id: number;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  category: string;
  isRecurring: boolean;
};

const EVENT_CAT_COLORS: Record<string, string> = {
  General:   "bg-gray-100 text-gray-700",
  Holiday:   "bg-purple-100 text-purple-700",
  Festival:  "bg-orange-100 text-orange-700",
  Exam:      "bg-red-100 text-red-700",
  Workshop:  "bg-blue-100 text-blue-700",
  Closure:   "bg-slate-100 text-slate-700",
  Community: "bg-teal-100 text-teal-700",
};

function fmtTime(t: string) {
  if (!t) return "";
  const [h, m] = t.split(":");
  const hr = Number(h);
  const ampm = hr >= 12 ? "PM" : "AM";
  return `${hr % 12 || 12}:${m} ${ampm}`;
}

function CalendarPanel() {
  const [events,  setEvents]  = useState<GEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminApi.events.list();
      setEvents(data as GEvent[]);
    } catch {
      toast.error("Failed to load calendar events");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const today = todayStr();

  const upcoming = useMemo(() => events.filter(e => e.date >= today).sort((a, b) => a.date.localeCompare(b.date)), [events, today]);
  const past     = useMemo(() => events.filter(e => e.date <  today).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5), [events, today]);

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 text-muted-foreground py-16">
        <Loader2 className="w-5 h-5 animate-spin" /> Loading calendar…
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <CalendarDays className="w-10 h-10 mx-auto mb-3 opacity-30" />
        <p className="font-medium text-sm">No events scheduled</p>
        <p className="text-xs mt-1">Admin will add events to the calendar from the Events section.</p>
      </div>
    );
  }

  function EventCard({ e }: { e: GEvent }) {
    const catCls = EVENT_CAT_COLORS[e.category] ?? "bg-gray-100 text-gray-700";
    const isPast = e.date < today;
    return (
      <div className={`bg-white rounded-2xl border shadow-sm px-5 py-4 ${isPast ? "opacity-60" : "border-border"}`}>
        <div className="flex gap-4 items-start">
          {/* Date badge */}
          <div className={`shrink-0 w-12 text-center rounded-xl py-1.5 ${isPast ? "bg-gray-100" : "bg-primary/10"}`}>
            <p className={`text-lg font-bold leading-none ${isPast ? "text-muted-foreground" : "text-primary"}`}>
              {String(Number(e.date.split("-")[2]))}
            </p>
            <p className={`text-[10px] font-semibold uppercase tracking-wide ${isPast ? "text-muted-foreground" : "text-primary"}`}>
              {new Date(e.date + "T12:00:00").toLocaleDateString("en-US", { month: "short" })}
            </p>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="font-semibold text-secondary text-sm">{e.title}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${catCls}`}>{e.category}</span>
              {e.isRecurring && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium flex items-center gap-1">
                  <RefreshCw className="w-2.5 h-2.5" /> Recurring
                </span>
              )}
            </div>

            {e.description && (
              <p className="text-sm text-secondary leading-relaxed mb-2">{e.description}</p>
            )}

            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
              {e.time && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {fmtTime(e.time)}
                </span>
              )}
              {e.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {e.location}
                </span>
              )}
              <span>
                {new Date(e.date + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Refresh */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {upcoming.length} upcoming · {past.length} recent past event{past.length !== 1 ? "s" : ""}
        </p>
        <button
          onClick={load}
          className="text-xs text-primary hover:underline flex items-center gap-1"
        >
          <RefreshCw className="w-3 h-3" /> Refresh
        </button>
      </div>

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <CalendarDays className="w-3.5 h-3.5" /> Upcoming Events
          </h3>
          {upcoming.map(e => <EventCard key={e.id} e={e} />)}
        </div>
      )}

      {/* Past */}
      {past.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Recent Past (last 5)</h3>
          {past.map(e => <EventCard key={e.id} e={e} />)}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function WeeklyUpdates() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const textRef = useRef<HTMLTextAreaElement>(null);

  const [tab, setTab] = useState<"updates" | "notices" | "calendar" | "messages">("updates");

  // ── Admin Messages ──
  type AdminMsg = { id: number; subject: string; body: string; audienceType: string; sentAt: string; sentBy: string | null };
  const [adminMsgs, setAdminMsgs]       = useState<AdminMsg[]>([]);
  const [adminMsgsLoading, setAdminMsgsLoading] = useState(false);
  const [expandedMsg, setExpandedMsg]   = useState<number | null>(null);

  async function loadAdminMessages() {
    setAdminMsgsLoading(true);
    try {
      const data = await adminApi.messaging.teacherInbox();
      setAdminMsgs(data as AdminMsg[]);
    } catch {
      setAdminMsgs([]);
    } finally {
      setAdminMsgsLoading(false);
    }
  }

  const [updates, setUpdates]   = useState<Update[]>([]);
  const [allLevels, setAllLevels] = useState<RawLevel[]>([]);
  const [loading, setLoading]   = useState(true);
  const [posting, setPosting]   = useState(false);
  const [editingId, setEditingId]   = useState<number | null>(null);
  const [editText, setEditText]     = useState("");
  const [editSaving, setEditSaving] = useState(false);

  // Compose form
  const [message,     setMessage]     = useState("");
  const [date,        setDate]        = useState(todayStr);
  const [courseId,    setCourseId]    = useState<number | null>(null);
  const [courseName,  setCourseName]  = useState("");
  const [levelId,     setLevelId]     = useState<number | null>(null);
  const [levelName,   setLevelName]   = useState("");
  const [sectionId,   setSectionId]   = useState<number | null>(null);
  const [sectionName, setSectionName] = useState("");
  const [dynamicSections,   setDynamicSections]   = useState<SectionOpt[]>([]);
  const [loadingSections,   setLoadingSections]   = useState(false);

  // Derive course options and filtered levels from the flat level list (same as Attendance tab)
  const courseOptions = useMemo(() => {
    const seen = new Map<number, string>();
    for (const l of allLevels) {
      if (!seen.has(l.courseId)) seen.set(l.courseId, l.courseName);
    }
    return Array.from(seen.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [allLevels]);

  const levelsForCourse = allLevels.filter(l => l.courseId === courseId);

  const courseLocked  = courseOptions.length === 1;
  const levelLocked   = levelsForCourse.length === 1;
  const sectionLocked = dynamicSections.length === 1;

  // Load updates + levels (same /attendance/levels endpoint as Attendance tab)
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [rows, levels] = await Promise.all([
        adminApi.weeklyUpdates.list() as Promise<Update[]>,
        adminApi.courses.levels() as Promise<RawLevel[]>,
      ]);
      setUpdates(rows);
      setAllLevels(levels);

      // Auto-cascade when teacher has only one course or level
      const uniqueCourses = [...new Map(levels.map(l => [l.courseId, l.courseName])).entries()];
      if (uniqueCourses.length === 1) {
        const [cId, cName] = uniqueCourses[0];
        setCourseId(cId); setCourseName(cName);
        const lvls = levels.filter(l => l.courseId === cId);
        if (lvls.length === 1) {
          setLevelId(lvls[0].id); setLevelName(lvls[0].className);
          // sections will load via useEffect below
        }
      }
    } catch {
      toast.error("Failed to load updates");
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => { load(); }, [load]);

  // Fetch sections dynamically when level changes — same as Attendance tab
  useEffect(() => {
    setDynamicSections([]);
    setSectionId(null); setSectionName("");
    if (!levelId) return;
    setLoadingSections(true);
    adminApi.courses.levelSections(levelId)
      .then(data => {
        const s = data as SectionOpt[];
        setDynamicSections(s);
        if (s.length === 1) { setSectionId(s[0].id); setSectionName(s[0].sectionName); }
      })
      .catch(() => setDynamicSections([]))
      .finally(() => setLoadingSections(false));
  }, [levelId]);

  async function handlePost() {
    if (!message.trim()) { toast.error("Please write a message"); return; }
    if (!courseId)        { toast.error("Please select a course"); return; }
    setPosting(true);
    try {
      const title = message.trim().slice(0, 80) + (message.trim().length > 80 ? "…" : "");
      await adminApi.weeklyUpdates.create({
        courseId, courseName,
        levelId: levelId ?? null, levelName: levelName ?? "",
        sectionId: sectionId ?? null, sectionName: sectionName ?? "",
        weekStart: date, weekEnd: date,
        title, content: message.trim(),
        homework: "", reminders: "", topicsCovered: "", upcomingPlan: "", attachmentLink: "",
        priority: "Normal", status: "Published",
        teacherName: user?.displayName ?? user?.email ?? "",
        createdBy:   user?.email ?? "",
      });
      toast.success("Update posted! Parents can now see it.");
      setMessage(""); setDate(todayStr());
      await load();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to post");
    } finally {
      setPosting(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this update? It will be removed from the parent portal.")) return;
    try {
      await adminApi.weeklyUpdates.remove(id);
      toast.success("Deleted");
      await load();
    } catch { toast.error("Failed to delete"); }
  }

  function startEdit(u: Update) { setEditingId(u.id); setEditText(u.content); }

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
        homework: "", reminders: "", topicsCovered: "", upcomingPlan: "", attachmentLink: "",
        priority: "Normal", status: "Published",
        teacherName: u.teacherName, createdBy: u.createdBy,
      });
      toast.success("Update saved");
      setEditingId(null);
      await load();
    } catch { toast.error("Failed to save"); }
    finally { setEditSaving(false); }
  }

  // canEdit: admin always can; teachers can edit their own (matched by name OR email)
  function canEdit(u: Update) {
    if (isAdmin) return true;
    if (user?.email && u.createdBy === user.email) return true;
    if (!isAdmin && user?.displayName && u.teacherName === user.displayName) return true;
    return false;
  }

  return (
    <div className="space-y-4">

      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-secondary">Messaging Center</h1>
        <p className="text-sm text-muted-foreground">
          Post updates for parents · read announcements · check the school calendar
        </p>
      </div>

      {/* Two-column layout: main content + sticky notes sidebar */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">

        {/* ── Main content column ── */}
        <div className="xl:col-span-2 space-y-4">

          {/* Tabs */}
          <div className="flex gap-0 border-b border-border overflow-x-auto">
            <button
              onClick={() => setTab("updates")}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                tab === "updates" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-secondary"
              }`}
            >
              <Eye className="w-4 h-4" />
              <span className="hidden sm:inline">Weekly </span>Updates
              {updates.length > 0 && (
                <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-medium">
                  {updates.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setTab("notices")}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                tab === "notices" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-secondary"
              }`}
            >
              <Bell className="w-4 h-4" />
              Announcements
            </button>
            <button
              onClick={() => setTab("calendar")}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                tab === "calendar" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-secondary"
              }`}
            >
              <CalendarDays className="w-4 h-4" />
              Calendar
            </button>
            <button
              onClick={() => { setTab("messages"); loadAdminMessages(); }}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                tab === "messages" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-secondary"
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              From Admin
              {adminMsgs.length > 0 && (
                <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-medium">
                  {adminMsgs.length}
                </span>
              )}
            </button>
          </div>

      {/* ── Weekly Updates Tab ── */}
      {tab === "updates" && (
        <>
          {/* Parent visibility warning */}
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <Eye className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800">
              <span className="font-semibold">Visible to parents</span> — Updates you post here appear on the Parent Portal immediately. Please review your content carefully before posting.
            </p>
          </div>

          {/* Compose box */}
          <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
            <div className="px-5 pt-5 pb-4 space-y-4">

              {/* Date + Course + Level + Section */}
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
                    <div className="input h-9 px-3 flex items-center text-sm bg-gray-50 text-secondary font-medium">{courseName}</div>
                  ) : (
                    <select
                      className="input text-sm h-9 px-3"
                      value={courseId ?? ""}
                      onChange={e => {
                        const id = e.target.value ? Number(e.target.value) : null;
                        setCourseId(id);
                        setCourseName(courseOptions.find(c => c.id === id)?.name ?? "");
                        setLevelId(null); setLevelName("");
                      }}
                    >
                      <option value="">Course…</option>
                      {courseOptions.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  )}
                </div>

                {/* Level */}
                <div className="flex flex-col gap-1 min-w-[120px]">
                  <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                    Level {levelLocked && <Lock className="w-3 h-3" />}
                  </label>
                  {levelLocked ? (
                    <div className="input h-9 px-3 flex items-center text-sm bg-gray-50 text-secondary font-medium">{levelName}</div>
                  ) : (
                    <select
                      className="input text-sm h-9 px-3"
                      value={levelId ?? ""}
                      onChange={e => {
                        const id = e.target.value ? Number(e.target.value) : null;
                        setLevelId(id);
                        setLevelName(levelsForCourse.find(l => l.id === id)?.className ?? "");
                      }}
                      disabled={!courseId || levelsForCourse.length === 0}
                    >
                      <option value="">Level…</option>
                      {levelsForCourse.map(l => <option key={l.id} value={l.id}>{l.className}</option>)}
                    </select>
                  )}
                </div>

                {/* Section */}
                <div className="flex flex-col gap-1 min-w-[120px]">
                  <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                    Section {sectionLocked && <Lock className="w-3 h-3" />}
                  </label>
                  {sectionLocked ? (
                    <div className="input h-9 px-3 flex items-center text-sm bg-gray-50 text-secondary font-medium">{sectionName}</div>
                  ) : (
                    <select
                      className="input text-sm h-9 px-3"
                      value={sectionId ?? ""}
                      onChange={e => {
                        const id = e.target.value ? Number(e.target.value) : null;
                        setSectionId(id);
                        setSectionName(dynamicSections.find(s => s.id === id)?.sectionName ?? "");
                      }}
                      disabled={!levelId || loadingSections || dynamicSections.length === 0}
                    >
                      <option value="">{loadingSections ? "Loading…" : "All sections"}</option>
                      {dynamicSections.map(s => <option key={s.id} value={s.id}>{s.sectionName}</option>)}
                    </select>
                  )}
                </div>
              </div>

              {/* Message */}
              <textarea
                ref={textRef}
                className="w-full rounded-xl border border-border px-4 py-3 text-sm text-secondary placeholder:text-muted-foreground focus:outline-none focus:border-primary resize-none min-h-[90px]"
                placeholder="Write your update for parents… (e.g. This week we practiced Devanagari letters. Homework: pages 12–14.)"
                value={message}
                maxLength={5000}
                onChange={e => setMessage(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handlePost(); }}
              />
            </div>

            <div className="px-5 pb-4 flex items-center justify-between">
              <span className={`text-xs ${message.length >= 4750 ? (message.length >= 5000 ? "text-red-600 font-semibold" : "text-amber-600") : "text-muted-foreground"}`}>
                {message.length > 0 ? `${message.length} / 5000 chars${message.length < 5000 ? " · Ctrl+Enter to post" : " — limit reached"}` : "Ctrl+Enter to post · 5000 char limit"}
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

          {/* Feed */}
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
                const editable  = canEdit(u);
                const audience  = [u.courseName, u.levelName, u.sectionName].filter(Boolean).join(" · ");
                const name      = u.teacherName || u.createdBy || "Teacher";

                return (
                  <div key={u.id} className="bg-white rounded-2xl border border-border shadow-sm px-5 py-4">
                    <div className="flex items-start gap-3">
                      {/* Avatar */}
                      <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                        {initials(name)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-semibold text-secondary">{name}</span>
                          <span className="text-xs text-muted-foreground">{fmtDate(u.weekStart)}</span>
                          {audience && (
                            <span className="text-xs bg-primary/8 text-primary px-2 py-0.5 rounded-full font-medium">
                              {audience}
                            </span>
                          )}
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                            <Eye className="w-3 h-3" /> Visible to parents
                          </span>
                        </div>

                        {isEditing ? (
                          <div className="mt-2 space-y-2">
                            <textarea
                              className="w-full rounded-xl border border-border px-3 py-2 text-sm text-secondary focus:outline-none focus:border-primary resize-none min-h-[80px]"
                              value={editText}
                              maxLength={5000}
                              onChange={e => setEditText(e.target.value)}
                              autoFocus
                            />
                            <span className={`text-xs ${editText.length >= 4750 ? (editText.length >= 5000 ? "text-red-600 font-semibold" : "text-amber-600") : "text-muted-foreground"}`}>
                              {editText.length} / 5000
                            </span>
                            <div className="flex gap-2 items-center">
                              <button
                                onClick={() => saveEdit(u)}
                                disabled={editSaving}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors"
                              >
                                {editSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                                Save
                              </button>
                              <button
                                onClick={() => setEditingId(null)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs text-secondary hover:bg-gray-50 transition-colors"
                              >
                                <X className="w-3.5 h-3.5" /> Cancel
                              </button>
                              <span className="text-xs text-amber-600 flex items-center gap-1 ml-1">
                                <AlertTriangle className="w-3 h-3" /> Changes will update the parent portal
                              </span>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-secondary mt-1 whitespace-pre-wrap leading-relaxed">{u.content}</p>
                        )}
                      </div>

                      {/* Actions */}
                      {editable && !isEditing && (
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
        </>
      )}

      {/* ── Notice Board Tab ── */}
      {tab === "notices" && <NoticeBoard />}

      {/* ── Calendar Tab ── */}
      {tab === "calendar" && <CalendarPanel />}

      {/* ── From Admin Tab ── */}
      {tab === "messages" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {adminMsgs.length} message{adminMsgs.length !== 1 ? "s" : ""} from admin
            </p>
            <button
              onClick={loadAdminMessages}
              disabled={adminMsgsLoading}
              className="text-xs text-primary hover:underline flex items-center gap-1 disabled:opacity-50"
            >
              {adminMsgsLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
              Refresh
            </button>
          </div>

          {adminMsgsLoading ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
              <Loader2 className="w-5 h-5 animate-spin" /> Loading messages…
            </div>
          ) : adminMsgs.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium text-sm">No messages from admin yet</p>
              <p className="text-xs mt-1">Messages sent to teachers will appear here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {adminMsgs.map(msg => (
                <div key={msg.id} className="bg-white border border-border rounded-2xl shadow-sm p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-secondary text-sm truncate">{msg.subject}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(msg.sentAt).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })}
                        {msg.sentBy && <> · from {msg.sentBy}</>}
                      </p>
                    </div>
                    <button
                      onClick={() => setExpandedMsg(expandedMsg === msg.id ? null : msg.id)}
                      className="text-xs text-muted-foreground hover:text-secondary shrink-0 flex items-center gap-1"
                    >
                      {expandedMsg === msg.id
                        ? <><X className="w-3 h-3" /> Collapse</>
                        : <><Eye className="w-3 h-3" /> Read</>}
                    </button>
                  </div>
                  {expandedMsg === msg.id && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <pre className="text-sm text-secondary whitespace-pre-wrap bg-gray-50 rounded-xl p-4 font-sans leading-relaxed">{msg.body}</pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

        </div>{/* end main content column */}

        {/* ── Sticky Notes sidebar ── */}
        <div className="xl:col-span-1">
          <div className="sticky top-4 space-y-3">
            <div className="flex items-center gap-2 px-1">
              <StickyNote className="w-4 h-4 text-amber-500" />
              <h3 className="font-bold text-secondary text-sm">My Sticky Notes</h3>
              <span className="text-xs text-muted-foreground">(private)</span>
            </div>
            <NotesTab />
          </div>
        </div>

      </div>{/* end grid */}
    </div>
  );
}
