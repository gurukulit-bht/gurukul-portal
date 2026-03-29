import { useState, useEffect, useCallback } from "react";
import { adminApi } from "@/lib/adminApi";
import { usePortalSettings } from "../contexts/PortalSettingsContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Mail, Send, Users, Filter, ChevronDown, ChevronUp,
  CheckCircle2, AlertCircle, Clock, RefreshCw, Eye, EyeOff,
  X, Loader2, Info, Inbox, Phone, MailOpen, Trash2,
  AlertTriangle, GraduationCap, Megaphone, Quote,
  Plus, Edit2, Check, Search, ToggleLeft, ToggleRight, Pencil,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types — Messaging ────────────────────────────────────────────────────────

type Recipient = {
  name: string; email: string; phone: string;
  relation: string; studentName: string; studentCode: string;
};

type AdminMessage = {
  id: number; subject: string; body: string; audienceType: string;
  recipientCount: number; teacherEmails: string | null;
  filterCourse: string | null; filterCurricYear: string | null;
  filterEmployer: string | null; sentBy: string | null; sentAt: string;
};

type InboxMessage = {
  id: number; senderName: string | null; senderEmail: string | null;
  senderPhone: string | null; message: string | null;
  isRead: boolean; createdAt: string;
};

// ─── Types — Announcements ────────────────────────────────────────────────────

type Announcement = {
  id: number; title: string; content: string; category: string;
  publishDate: string; expiryDate: string; isActive: boolean; isUrgent: boolean;
};

const ANN_CATEGORIES = ["All", "Registration", "Event", "Schedule", "Course", "Holiday", "Urgent", "General"];
const ANN_EMPTY: Omit<Announcement, "id"> = {
  title: "", content: "", category: "General",
  publishDate: "", expiryDate: "", isActive: true, isUrgent: false,
};
const ANN_CAT_COLORS: Record<string, string> = {
  Registration: "bg-blue-100 text-blue-700", Event: "bg-purple-100 text-purple-700",
  Schedule: "bg-green-100 text-green-700", Course: "bg-primary/10 text-primary",
  Holiday: "bg-yellow-100 text-yellow-700", Urgent: "bg-red-100 text-red-700",
  General: "bg-gray-100 text-gray-600",
};

// ─── Types — Testimonials ─────────────────────────────────────────────────────

type Testimonial = {
  id: number; name: string; detail: string; quote: string;
  avatarColor: string; isActive: boolean; sortOrder: number;
};

type TestimonialForm = {
  name: string; detail: string; quote: string;
  avatarColor: string; isActive: boolean; sortOrder: number;
};

const TEST_EMPTY: TestimonialForm = {
  name: "", detail: "", quote: "",
  avatarColor: "bg-orange-500", isActive: true, sortOrder: 0,
};

const COLOR_OPTIONS = [
  { label: "Orange", value: "bg-orange-500" }, { label: "Violet", value: "bg-violet-600" },
  { label: "Rose",   value: "bg-rose-600" },   { label: "Amber",  value: "bg-amber-600" },
  { label: "Teal",   value: "bg-teal-600" },   { label: "Sky",    value: "bg-sky-600" },
  { label: "Indigo", value: "bg-indigo-600" }, { label: "Green",  value: "bg-green-600" },
];

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const COURSES = ["All", "Hindi", "Dharma", "Telugu", "Tamil", "Sanskrit", "Gujarati"];

const AUDIENCE_LABEL: Record<string, string> = {
  parents: "Parents", teachers: "Teachers", both: "Parents + Teachers",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "numeric", minute: "2-digit",
  });
}

// ─── Tab type ─────────────────────────────────────────────────────────────────

type Tab = "announcements" | "compose" | "inbox" | "history" | "testimonials";

// ─── Main Component ───────────────────────────────────────────────────────────

export default function MessagingCenter() {
  const [tab, setTab] = useState<Tab>("announcements");

  // ── Messaging: Filters ──
  const [filterCourse,     setFilterCourse]     = useState("All");
  const { curriculumYearsLong, activeCurriculumYearLong } = usePortalSettings();
  const [filterCurricYear, setFilterCurricYear] = useState("2027-2028");
  useEffect(() => { if (activeCurriculumYearLong) setFilterCurricYear(activeCurriculumYearLong); }, [activeCurriculumYearLong]);
  const [filterEmployer, setFilterEmployer] = useState("All");
  const [employers,      setEmployers]      = useState<string[]>([]);
  const [showFilters,    setShowFilters]    = useState(true);

  // ── Messaging: Audience ──
  const [sendTo, setSendTo] = useState<"parents" | "teachers" | "both">("parents");

  // ── Messaging: Teachers ──
  type TeacherBasic = { id: number; name: string; email: string };
  const [teacherList,           setTeacherList]           = useState<TeacherBasic[]>([]);
  const [selectedTeacherEmails, setSelectedTeacherEmails] = useState<Set<string>>(new Set());
  const [showTeachers,          setShowTeachers]          = useState(false);

  // ── Messaging: Recipients ──
  const [recipients,        setRecipients]        = useState<Recipient[]>([]);
  const [recipientsLoading, setRecipientsLoading] = useState(false);
  const [selectedEmails,    setSelectedEmails]    = useState<Set<string>>(new Set());
  const [showRecipients,    setShowRecipients]    = useState(false);

  // ── Messaging: Compose ──
  const [subject,    setSubject]    = useState("");
  const [body,       setBody]       = useState("");
  const [sending,    setSending]    = useState(false);
  const [sendResult, setSendResult] = useState<{
    success: boolean; sent: number; failed: number; message: string; smtpConfigured: boolean;
  } | null>(null);

  // ── Messaging: History ──
  const [logs,        setLogs]        = useState<AdminMessage[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  // ── Messaging: Inbox ──
  const [inboxMessages, setInboxMessages] = useState<InboxMessage[]>([]);
  const [inboxLoading,  setInboxLoading]  = useState(false);

  // ── Announcements state ──
  const [annItems,   setAnnItems]   = useState<Announcement[]>([]);
  const [annLoading, setAnnLoading] = useState(true);
  const [annSaving,  setAnnSaving]  = useState(false);
  const [annSearch,  setAnnSearch]  = useState("");
  const [annFilterCat, setAnnFilterCat] = useState("All");
  const [annModal,   setAnnModal]   = useState(false);
  const [annEditing, setAnnEditing] = useState<Announcement | null>(null);
  const [annForm,    setAnnForm]    = useState<Omit<Announcement, "id">>(ANN_EMPTY);
  const [annDeleteId, setAnnDeleteId] = useState<number | null>(null);

  // ── Testimonials state ──
  const [testItems,    setTestItems]    = useState<Testimonial[]>([]);
  const [testLoading,  setTestLoading]  = useState(true);
  const [testSaving,   setTestSaving]   = useState(false);
  const [testError,    setTestError]    = useState("");
  const [testToast,    setTestToast]    = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [testModal,    setTestModal]    = useState(false);
  const [testEditId,   setTestEditId]   = useState<number | null>(null);
  const [testForm,     setTestForm]     = useState<TestimonialForm>(TEST_EMPTY);
  const [testFormErr,  setTestFormErr]  = useState("");
  const [testDeleteId, setTestDeleteId] = useState<number | null>(null);

  const showTestToast = (type: "success" | "error", msg: string) => {
    setTestToast({ type, msg });
    setTimeout(() => setTestToast(null), 3500);
  };

  // ── Load on mount ──
  useEffect(() => {
    adminApi.messaging.employers().then(list => setEmployers(list as string[])).catch(() => {});
    adminApi.messaging.inbox().then(d => setInboxMessages(d as InboxMessage[])).catch(() => {});
    adminApi.teachers.list().then(d => {
      const list = (d as TeacherBasic[]).filter(t => !!t.email);
      setTeacherList(list);
      setSelectedTeacherEmails(new Set(list.map(t => t.email)));
    }).catch(() => {});
    // Announcements
    adminApi.announcements.list()
      .then(d => setAnnItems(d as Announcement[]))
      .finally(() => setAnnLoading(false));
    // Testimonials
    adminApi.testimonials.list()
      .then(d => setTestItems(d as Testimonial[]))
      .catch(() => setTestError("Failed to load testimonials."))
      .finally(() => setTestLoading(false));
  }, []);

  // ── Messaging: load recipients on filter change ──
  const loadRecipients = useCallback(async () => {
    setRecipientsLoading(true);
    setSendResult(null);
    try {
      const data = await adminApi.messaging.recipients({
        course:     filterCourse !== "All" ? filterCourse : undefined,
        curricYear: filterCurricYear !== "All" ? filterCurricYear : undefined,
        employer:   filterEmployer !== "All" ? filterEmployer : undefined,
      });
      const list = data as Recipient[];
      setRecipients(list);
      setSelectedEmails(new Set(list.map(r => r.email || r.phone)));
    } catch {
      setRecipients([]);
    } finally {
      setRecipientsLoading(false);
    }
  }, [filterCourse, filterCurricYear, filterEmployer]);

  useEffect(() => { loadRecipients(); }, [loadRecipients]);

  const recipientKey = (r: Recipient) => r.email || r.phone;
  function toggleRecipient(key: string) {
    setSelectedEmails(prev => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n; });
  }
  function selectAll()   { setSelectedEmails(new Set(recipients.map(recipientKey))); }
  function deselectAll() { setSelectedEmails(new Set()); }

  function toggleTeacher(email: string) {
    setSelectedTeacherEmails(prev => { const n = new Set(prev); n.has(email) ? n.delete(email) : n.add(email); return n; });
  }
  function selectAllTeachers()   { setSelectedTeacherEmails(new Set(teacherList.map(t => t.email))); }
  function deselectAllTeachers() { setSelectedTeacherEmails(new Set()); }

  async function handleSend() {
    if (!subject.trim()) { alert("Please enter a subject."); return; }
    if (!body.trim())    { alert("Please write a message body."); return; }

    const parentR = sendTo !== "teachers"
      ? recipients.filter(r => selectedEmails.has(recipientKey(r)))
          .map(r => ({ name: r.name, email: r.email, phone: r.phone, studentName: r.studentName }))
      : [];

    const teacherR = sendTo !== "parents"
      ? teacherList.filter(t => selectedTeacherEmails.has(t.email))
          .map(t => ({ name: t.name, email: t.email, phone: "", studentName: "" }))
      : [];

    const allR = [...parentR, ...teacherR];
    if (!allR.length) { alert("No recipients selected."); return; }

    // If ALL teachers are selected → null (broadcast). Only specify emails for a subset.
    const selectedTeacherList = teacherList.filter(t => selectedTeacherEmails.has(t.email));
    const allTeachersSelected = selectedTeacherList.length === teacherList.length && teacherList.length > 0;
    const chosenTeacherEmails = sendTo !== "parents"
      ? (allTeachersSelected ? undefined : selectedTeacherList.map(t => t.email).join(","))
      : undefined;

    setSending(true);
    setSendResult(null);
    try {
      const result = await adminApi.messaging.send({
        subject, body, recipients: allR, audienceType: sendTo,
        teacherEmails: chosenTeacherEmails,
        filterCourse:     filterCourse !== "All" ? filterCourse : undefined,
        filterCurricYear: filterCurricYear !== "All" ? filterCurricYear : undefined,
        filterEmployer:   filterEmployer !== "All" ? filterEmployer : undefined,
      }) as { success: boolean; sent: number; failed: number; message: string; smtpConfigured: boolean };
      setSendResult(result);
      if (result.success) { setSubject(""); setBody(""); }
    } catch (err: unknown) {
      setSendResult({ success: false, sent: 0, failed: allR.length,
        message: err instanceof Error ? err.message : "Send failed.", smtpConfigured: false });
    } finally {
      setSending(false);
    }
  }

  async function loadLogs() {
    setLogsLoading(true);
    try { const d = await adminApi.messaging.messages(); setLogs(d as AdminMessage[]); }
    catch { setLogs([]); }
    finally { setLogsLoading(false); }
  }

  async function loadInbox() {
    setInboxLoading(true);
    try { const d = await adminApi.messaging.inbox(); setInboxMessages(d as InboxMessage[]); }
    catch { setInboxMessages([]); }
    finally { setInboxLoading(false); }
  }

  async function markAsRead(id: number) {
    await adminApi.messaging.markRead(id);
    setInboxMessages(prev => prev.map(m => m.id === id ? { ...m, isRead: true } : m));
  }

  async function deleteMessage(id: number) {
    try {
      await adminApi.messaging.deleteMessage(id);
      setInboxMessages(prev => prev.filter(m => m.id !== id));
    } catch { alert("Failed to delete message."); }
  }

  useEffect(() => {
    if (tab === "history") loadLogs();
    if (tab === "inbox")   loadInbox();
  }, [tab]);

  const unreadCount = inboxMessages.filter(m => !m.isRead).length;
  const selectedCount        = recipients.filter(r => selectedEmails.has(recipientKey(r))).length;
  const selectedTeacherCount = teacherList.filter(t => selectedTeacherEmails.has(t.email)).length;
  const totalSelectedCount   = (sendTo !== "teachers" ? selectedCount : 0)
                             + (sendTo !== "parents"  ? selectedTeacherCount : 0);

  // ── Announcements handlers ──
  const annFiltered = annItems.filter(a =>
    (annFilterCat === "All" || a.category === annFilterCat) &&
    (a.title.toLowerCase().includes(annSearch.toLowerCase()) ||
     a.content.toLowerCase().includes(annSearch.toLowerCase()))
  );

  function annOpenAdd() { setAnnEditing(null); setAnnForm(ANN_EMPTY); setAnnModal(true); }
  function annOpenEdit(a: Announcement) {
    setAnnEditing(a);
    setAnnForm({ title: a.title, content: a.content, category: a.category,
      publishDate: a.publishDate, expiryDate: a.expiryDate, isActive: a.isActive, isUrgent: a.isUrgent });
    setAnnModal(true);
  }
  async function annHandleSave() {
    if (!annForm.title.trim() || !annForm.content.trim() || !annForm.publishDate || !annForm.expiryDate) return;
    setAnnSaving(true);
    try {
      if (annEditing) {
        const u = await adminApi.announcements.update(annEditing.id, annForm);
        setAnnItems(prev => prev.map(a => a.id === annEditing.id ? u as Announcement : a));
      } else {
        const c = await adminApi.announcements.create(annForm);
        setAnnItems(prev => [c as Announcement, ...prev]);
      }
      setAnnModal(false);
    } catch { /* silent */ }
    finally { setAnnSaving(false); }
  }
  async function annHandleDelete(id: number) {
    try { await adminApi.announcements.remove(id); setAnnItems(prev => prev.filter(a => a.id !== id)); }
    catch { /* silent */ }
    finally { setAnnDeleteId(null); }
  }
  async function annToggleActive(id: number) {
    try {
      const u = await adminApi.announcements.toggle(id);
      setAnnItems(prev => prev.map(a => a.id === id ? u as Announcement : a));
    } catch { /* silent */ }
  }

  // ── Testimonials handlers ──
  const activeTestCount = testItems.filter(t => t.isActive).length;

  function testOpenAdd() {
    setTestEditId(null);
    setTestForm({ ...TEST_EMPTY, sortOrder: testItems.length + 1 });
    setTestFormErr("");
    setTestModal(true);
  }
  function testOpenEdit(item: Testimonial) {
    setTestEditId(item.id);
    setTestForm({ name: item.name, detail: item.detail, quote: item.quote,
      avatarColor: item.avatarColor, isActive: item.isActive, sortOrder: item.sortOrder });
    setTestFormErr("");
    setTestModal(true);
  }
  function testCloseModal() { setTestModal(false); setTestFormErr(""); }

  async function testHandleSave() {
    if (!testForm.name.trim())   return setTestFormErr("Name is required.");
    if (!testForm.detail.trim()) return setTestFormErr("Tagline/detail is required.");
    if (!testForm.quote.trim())  return setTestFormErr("Quote is required.");
    setTestFormErr("");
    setTestSaving(true);
    try {
      if (testEditId !== null) {
        const u = await adminApi.testimonials.update(testEditId, testForm) as Testimonial;
        setTestItems(prev => prev.map(t => t.id === testEditId ? u : t));
        showTestToast("success", "Testimonial updated.");
      } else {
        const c = await adminApi.testimonials.create(testForm) as Testimonial;
        setTestItems(prev => [...prev, c]);
        showTestToast("success", "Testimonial added.");
      }
      testCloseModal();
    } catch (err: unknown) {
      setTestFormErr((err as Error).message || "Save failed.");
    } finally {
      setTestSaving(false);
    }
  }

  async function testHandleDelete(id: number) {
    setTestSaving(true);
    try {
      await adminApi.testimonials.remove(id);
      setTestItems(prev => prev.filter(t => t.id !== id));
      showTestToast("success", "Testimonial deleted.");
    } catch {
      showTestToast("error", "Delete failed.");
    } finally {
      setTestSaving(false);
      setTestDeleteId(null);
    }
  }

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full min-h-0 -m-4 lg:-m-6">

      {/* ── Page header + tab bar ── */}
      <div className="bg-white border-b border-border px-4 lg:px-6 pt-5 pb-0 shrink-0">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h2 className="text-xl font-bold text-secondary">Communication Hub</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Manage announcements, send messages to families, and collect testimonials.
            </p>
          </div>
          {/* Quick-action CTA based on active tab */}
          {tab === "announcements" && (
            <Button onClick={annOpenAdd} className="gap-2 shrink-0">
              <Plus className="w-4 h-4" /> Add Announcement
            </Button>
          )}
          {tab === "testimonials" && (
            <Button
              onClick={testOpenAdd}
              disabled={activeTestCount >= 3}
              title={activeTestCount >= 3 ? "Max 3 active testimonials" : undefined}
              className="gap-2 shrink-0"
            >
              <Plus className="w-4 h-4" /> Add Testimonial
            </Button>
          )}
          {tab === "compose" && (
            <Button onClick={handleSend} disabled={sending || totalSelectedCount === 0} className="gap-2 shrink-0">
              {sending
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Publishing…</>
                : <><Send className="w-4 h-4" /> Publish</>}
            </Button>
          )}
        </div>

        {/* Tab bar */}
        <div className="flex gap-0.5 overflow-x-auto scrollbar-none -mb-px">
          {([
            { id: "announcements", label: "Announcements", icon: Megaphone,
              badge: annItems.filter(a => a.isActive).length.toString() },
            { id: "compose",      label: "Compose",       icon: Mail,     badge: null },
            { id: "inbox",        label: "Inbox",         icon: Inbox,    badge: unreadCount > 0 ? String(unreadCount) : null },
            { id: "history",      label: "History",       icon: Clock,    badge: null },
            { id: "testimonials", label: "Testimonials",  icon: Quote,
              badge: `${activeTestCount}/3` },
          ] as const).map(({ id, label, icon: Icon, badge }) => (
            <button
              key={id}
              onClick={() => setTab(id as Tab)}
              className={cn(
                "flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all whitespace-nowrap shrink-0",
                tab === id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-secondary hover:border-border"
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
              {badge && (
                <span className={cn(
                  "text-[11px] font-bold px-1.5 py-0.5 rounded-full",
                  id === "inbox" && unreadCount > 0
                    ? "bg-red-500 text-white"
                    : "bg-gray-100 text-gray-600"
                )}>
                  {badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab content ── */}
      <div className="flex-1 overflow-y-auto p-4 lg:p-6">

        {/* ════ ANNOUNCEMENTS TAB ════════════════════════════════════════════════ */}
        {tab === "announcements" && (
          <div className="space-y-5">

            {/* Search + Category filter */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search announcements…"
                  value={annSearch}
                  onChange={e => setAnnSearch(e.target.value)}
                  className="pl-9 rounded-xl"
                />
              </div>
              <div className="flex flex-wrap gap-1.5 items-center">
                <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
                {ANN_CATEGORIES.map(c => (
                  <button
                    key={c}
                    onClick={() => setAnnFilterCat(c)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                      annFilterCat === c
                        ? "bg-primary text-white"
                        : "bg-white border border-border text-muted-foreground hover:border-primary"
                    )}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Stats row */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>
                <span className="font-semibold text-green-700">{annItems.filter(a => a.isActive).length}</span> active
                {" · "}
                <span className="font-semibold text-secondary">{annItems.length}</span> total
              </span>
              {annFiltered.length !== annItems.length && (
                <span className="text-muted-foreground">
                  ({annFiltered.length} matching filters)
                </span>
              )}
            </div>

            {annLoading ? (
              <div className="flex items-center justify-center h-48">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : annFiltered.length === 0 ? (
              <div className="text-center py-20 border-2 border-dashed border-border rounded-2xl bg-white">
                <Megaphone className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="font-medium text-muted-foreground">No announcements found.</p>
                <p className="text-sm text-muted-foreground mt-1">Click "Add Announcement" to create one.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {annFiltered.map(a => (
                  <div
                    key={a.id}
                    className={cn(
                      "bg-white rounded-2xl border shadow-sm p-5 transition-all",
                      !a.isActive ? "opacity-60 border-gray-200" : a.isUrgent ? "border-red-200 bg-red-50/20" : "border-border"
                    )}
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1.5">
                          <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium",
                            ANN_CAT_COLORS[a.category] ?? "bg-gray-100 text-gray-600")}>
                            {a.category}
                          </span>
                          {a.isUrgent && (
                            <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-red-100 text-red-700 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" /> URGENT
                            </span>
                          )}
                          {!a.isActive && (
                            <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-gray-100 text-gray-500">
                              Inactive
                            </span>
                          )}
                        </div>
                        <h3 className="font-semibold text-secondary">{a.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{a.content}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          Published: {a.publishDate}
                          {a.expiryDate && <> · Expires: {a.expiryDate}</>}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => annToggleActive(a.id)}
                          title={a.isActive ? "Deactivate" : "Activate"}
                          className="text-muted-foreground hover:text-primary transition-colors p-1.5"
                        >
                          {a.isActive
                            ? <ToggleRight className="w-5 h-5 text-green-600" />
                            : <ToggleLeft className="w-5 h-5" />
                          }
                        </button>
                        <button
                          onClick={() => annOpenEdit(a)}
                          className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 flex items-center justify-center transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {annDeleteId === a.id ? (
                          <div className="flex gap-1">
                            <button onClick={() => annHandleDelete(a.id)} className="w-8 h-8 rounded-lg bg-red-500 text-white hover:bg-red-600 flex items-center justify-center">
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => setAnnDeleteId(null)} className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setAnnDeleteId(a.id)}
                            className="w-8 h-8 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 flex items-center justify-center transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ════ COMPOSE TAB ══════════════════════════════════════════════════════ */}
        {tab === "compose" && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

            {/* LEFT: Filters + Recipients */}
            <div className="xl:col-span-1 space-y-4">

              {/* Audience */}
              <div className="bg-white border border-border rounded-2xl shadow-sm px-5 py-4 space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                  <Send className="w-3.5 h-3.5" /> Send To
                </label>
                <select
                  value={sendTo}
                  onChange={e => setSendTo(e.target.value as "parents" | "teachers" | "both")}
                  className="w-full text-sm border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-primary bg-white font-medium"
                >
                  <option value="parents">Parents only</option>
                  <option value="teachers">Teachers only</option>
                  <option value="both">Both (Parents + Teachers)</option>
                </select>
              </div>

              {/* Parent filters */}
              {sendTo !== "teachers" && (<>
                <div className="bg-white border border-border rounded-2xl shadow-sm overflow-hidden">
                  <button
                    className="w-full flex items-center justify-between px-5 py-4 text-left"
                    onClick={() => setShowFilters(f => !f)}
                  >
                    <span className="flex items-center gap-2 font-semibold text-secondary text-sm">
                      <Filter className="w-4 h-4 text-primary" /> Parent Filters
                    </span>
                    {showFilters ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  </button>
                  {showFilters && (
                    <div className="px-5 pb-5 space-y-4 border-t border-border pt-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Course</label>
                        <select value={filterCourse} onChange={e => setFilterCourse(e.target.value)}
                          className="w-full text-sm border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-primary bg-white">
                          {COURSES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Curriculum Year</label>
                        <select value={filterCurricYear} onChange={e => setFilterCurricYear(e.target.value)}
                          className="w-full text-sm border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-primary bg-white">
                          <option value="All">All Years</option>
                          {curriculumYearsLong.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Parent Employer</label>
                        <select value={filterEmployer} onChange={e => setFilterEmployer(e.target.value)}
                          className="w-full text-sm border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-primary bg-white">
                          <option value="All">All Employers</option>
                          {employers.map(e => <option key={e} value={e}>{e}</option>)}
                        </select>
                      </div>
                      <Button variant="outline" size="sm" className="w-full gap-2" onClick={loadRecipients} disabled={recipientsLoading}>
                        <RefreshCw className={cn("w-4 h-4", recipientsLoading && "animate-spin")} />
                        Refresh Recipients
                      </Button>
                    </div>
                  )}
                </div>

                {/* Parent recipients */}
                <div className="bg-white border border-border rounded-2xl shadow-sm overflow-hidden">
                  <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                    <span className="flex items-center gap-2 font-semibold text-secondary text-sm">
                      <Users className="w-4 h-4 text-primary" />
                      {recipientsLoading ? "Loading…" : `${selectedCount} / ${recipients.length} parents`}
                    </span>
                    <button onClick={() => setShowRecipients(v => !v)}
                      className="text-xs text-muted-foreground hover:text-secondary flex items-center gap-1">
                      {showRecipients ? <><EyeOff className="w-3.5 h-3.5" /> Hide</> : <><Eye className="w-3.5 h-3.5" /> Show</>}
                    </button>
                  </div>
                  {recipientsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-5 h-5 animate-spin text-primary" />
                    </div>
                  ) : recipients.length === 0 ? (
                    <div className="py-8 text-center text-sm text-muted-foreground px-4">No parents match the current filters.</div>
                  ) : (
                    <div>
                      <div className="px-5 py-2 border-b border-border flex gap-3 text-xs">
                        <button onClick={selectAll} className="text-primary hover:underline font-medium">Select all</button>
                        <button onClick={deselectAll} className="text-muted-foreground hover:underline">Deselect all</button>
                      </div>
                      {showRecipients && (
                        <ul className="max-h-72 overflow-y-auto divide-y divide-border">
                          {recipients.map(r => (
                            <li key={recipientKey(r)} className="flex items-start gap-3 px-5 py-3 hover:bg-gray-50">
                              <input type="checkbox" checked={selectedEmails.has(recipientKey(r))}
                                onChange={() => toggleRecipient(recipientKey(r))}
                                className="mt-0.5 accent-primary w-4 h-4 shrink-0" />
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-secondary truncate">{r.name}</p>
                                {r.email && <p className="text-xs text-muted-foreground truncate">{r.email}</p>}
                                {r.phone && <p className="text-xs text-muted-foreground">{r.phone}</p>}
                                <p className="text-xs text-muted-foreground">{r.relation} · {r.studentName}</p>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              </>)}

              {/* Teacher list */}
              {sendTo !== "parents" && (
                <div className="bg-white border border-border rounded-2xl shadow-sm overflow-hidden">
                  <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                    <span className="flex items-center gap-2 font-semibold text-secondary text-sm">
                      <GraduationCap className="w-4 h-4 text-primary" />
                      {`${selectedTeacherCount} / ${teacherList.length} teachers`}
                    </span>
                    <button onClick={() => setShowTeachers(v => !v)}
                      className="text-xs text-muted-foreground hover:text-secondary flex items-center gap-1">
                      {showTeachers ? <><EyeOff className="w-3.5 h-3.5" /> Hide</> : <><Eye className="w-3.5 h-3.5" /> Show</>}
                    </button>
                  </div>
                  {teacherList.length === 0 ? (
                    <div className="py-8 text-center text-sm text-muted-foreground px-4">No teachers with registered emails found.</div>
                  ) : (
                    <div>
                      <div className="px-5 py-2 border-b border-border flex gap-3 text-xs">
                        <button onClick={selectAllTeachers} className="text-primary hover:underline font-medium">Select all</button>
                        <button onClick={deselectAllTeachers} className="text-muted-foreground hover:underline">Deselect all</button>
                      </div>
                      {showTeachers && (
                        <ul className="max-h-64 overflow-y-auto divide-y divide-border">
                          {teacherList.map(t => (
                            <li key={t.email} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50">
                              <input type="checkbox" checked={selectedTeacherEmails.has(t.email)}
                                onChange={() => toggleTeacher(t.email)}
                                className="accent-primary w-4 h-4 shrink-0" />
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-secondary truncate">{t.name}</p>
                                <p className="text-xs text-muted-foreground truncate">{t.email}</p>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* RIGHT: Compose */}
            <div className="xl:col-span-2 space-y-4">
              <div className="flex items-start gap-3 bg-sky-50 border border-sky-200 text-sky-800 rounded-xl px-4 py-3 text-sm">
                <Info className="w-4 h-4 mt-0.5 shrink-0" />
                <div>
                  <span className="font-semibold">In-app messaging:</span> Messages are stored securely and displayed directly inside the portal — teachers see them in their Messaging Center, and parents see them on the Parent Portal after verifying their phone. No email is sent.
                </div>
              </div>

              {sendTo !== "teachers" && (
                <div className="flex items-start gap-3 bg-amber-50 border border-amber-300 text-amber-800 rounded-xl px-4 py-3 text-sm">
                  <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-amber-600" />
                  <div>
                    <span className="font-semibold">Heads up — parents will see this message.</span>{" "}
                    Please review carefully. Once published, it will be visible in the Parent Portal to{" "}
                    {sendTo === "both"
                      ? <><span className="font-semibold">{selectedCount} parent{selectedCount !== 1 ? "s" : ""}</span> and <span className="font-semibold">{selectedTeacherCount} teacher{selectedTeacherCount !== 1 ? "s" : ""}</span>.</>
                      : <><span className="font-semibold">{selectedCount} parent{selectedCount !== 1 ? "s" : ""}</span>.</>
                    }
                  </div>
                </div>
              )}

              <div className="bg-white border border-border rounded-2xl shadow-sm p-6 space-y-5">
                <h3 className="font-bold text-secondary">Compose Message</h3>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-secondary">Subject <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                    placeholder="e.g. Important Update from BHT Gurukul"
                    className="w-full border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-secondary">Message <span className="text-red-500">*</span></label>
                  <textarea
                    rows={12}
                    value={body}
                    onChange={e => setBody(e.target.value)}
                    placeholder={`Dear Parents,\n\nWe wanted to share an important update from BHT Gurukul...\n\nWarm regards,\nBHT Gurukul Team`}
                    className="w-full border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition resize-none"
                  />
                </div>
                {sendResult && (
                  <div className={cn(
                    "flex items-start gap-3 rounded-xl px-4 py-3 text-sm border",
                    sendResult.success ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-800"
                  )}>
                    {sendResult.success
                      ? <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                      : <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />}
                    <div>
                      <p className="font-semibold">{sendResult.success ? "Published!" : "Error"}</p>
                      <p>{sendResult.message}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center justify-between gap-4 pt-2">
                  <div className="text-sm text-muted-foreground space-y-0.5">
                    <p>Will deliver to <span className="font-semibold text-secondary">{totalSelectedCount}</span> recipient{totalSelectedCount !== 1 ? "s" : ""}</p>
                    {sendTo === "both" && (
                      <p className="text-xs">
                        <span className="text-primary font-medium">{selectedCount} parent{selectedCount !== 1 ? "s" : ""}</span>
                        {" + "}
                        <span className="text-primary font-medium">{selectedTeacherCount} teacher{selectedTeacherCount !== 1 ? "s" : ""}</span>
                      </p>
                    )}
                  </div>
                  <Button onClick={handleSend} disabled={sending || totalSelectedCount === 0} className="gap-2 min-w-36">
                    {sending ? <><Loader2 className="w-4 h-4 animate-spin" /> Publishing…</> : <><Send className="w-4 h-4" /> Publish Message</>}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ════ INBOX TAB ════════════════════════════════════════════════════════ */}
        {tab === "inbox" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {inboxMessages.length} message{inboxMessages.length !== 1 ? "s" : ""} received
                {unreadCount > 0 && <span className="ml-2 text-red-600 font-semibold">· {unreadCount} unread</span>}
              </p>
              <Button variant="outline" size="sm" className="gap-2" onClick={loadInbox} disabled={inboxLoading}>
                <RefreshCw className={cn("w-4 h-4", inboxLoading && "animate-spin")} /> Refresh
              </Button>
            </div>
            {inboxLoading ? (
              <div className="flex items-center justify-center h-48">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : inboxMessages.length === 0 ? (
              <div className="text-center py-20 border-2 border-dashed border-border rounded-2xl bg-white">
                <Inbox className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-muted-foreground font-medium">No messages yet.</p>
                <p className="text-sm text-muted-foreground mt-1">Messages from the public Contact Us page will appear here.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {inboxMessages.map(msg => (
                  <InboxCard key={msg.id} message={msg} onMarkRead={() => markAsRead(msg.id)} onDelete={() => deleteMessage(msg.id)} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ════ HISTORY TAB ══════════════════════════════════════════════════════ */}
        {tab === "history" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{logs.length} messages sent (most recent first)</p>
              <Button variant="outline" size="sm" className="gap-2" onClick={loadLogs} disabled={logsLoading}>
                <RefreshCw className={cn("w-4 h-4", logsLoading && "animate-spin")} /> Refresh
              </Button>
            </div>
            {logsLoading ? (
              <div className="flex items-center justify-center h-48">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-20 border-2 border-dashed border-border rounded-2xl bg-white">
                <Mail className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-muted-foreground font-medium">No messages sent yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {logs.map(log => <LogCard key={log.id} log={log} />)}
              </div>
            )}
          </div>
        )}

        {/* ════ TESTIMONIALS TAB ═════════════════════════════════════════════════ */}
        {tab === "testimonials" && (
          <div className="space-y-5">

            {/* Toast */}
            {testToast && (
              <div className={cn(
                "fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-lg text-sm font-medium",
                testToast.type === "success" ? "bg-green-50 border border-green-200 text-green-800" : "bg-red-50 border border-red-200 text-red-800"
              )}>
                {testToast.type === "success" ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                {testToast.msg}
              </div>
            )}

            {/* Active cap warning */}
            {activeTestCount >= 3 && (
              <div className="flex items-start gap-2 text-sm bg-amber-50 border border-amber-200 text-amber-800 rounded-xl px-4 py-3">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                Maximum of 3 active testimonials reached. Edit an existing one or deactivate it to make room.
              </div>
            )}

            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span>
                <span className={cn("font-semibold", activeTestCount >= 3 ? "text-red-600" : "text-green-700")}>
                  {activeTestCount}
                </span>
                {" / 3 active · "}
                <span className="font-semibold text-secondary">{testItems.length}</span> total
              </span>
              <span className="text-xs text-muted-foreground">Testimonials appear on the public Parent Portal page.</span>
            </div>

            {testError && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{testError}</div>
            )}

            {testLoading ? (
              <div className="grid grid-cols-1 gap-4">
                {[1, 2, 3].map(i => <div key={i} className="h-36 bg-gray-100 animate-pulse rounded-2xl" />)}
              </div>
            ) : testItems.length === 0 ? (
              <div className="text-center py-20 border-2 border-dashed border-border rounded-2xl bg-white">
                <Quote className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-muted-foreground font-medium">No testimonials yet.</p>
                <p className="text-sm text-muted-foreground mt-1">Click "Add Testimonial" to publish the first one.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {testItems.map(item => (
                  <div
                    key={item.id}
                    className={cn(
                      "bg-white border rounded-2xl p-5 shadow-sm flex flex-col gap-4 transition-opacity",
                      !item.isActive && "opacity-50"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn("w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0", item.avatarColor)}>
                        {getInitials(item.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-secondary text-sm truncate">{item.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{item.detail}</p>
                        <span className={cn(
                          "text-xs px-2 py-0.5 rounded-full font-medium mt-1 inline-block",
                          item.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                        )}>
                          {item.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 flex-1">
                      "{item.quote}"
                    </p>

                    <div className="flex items-center justify-between pt-2 border-t border-border">
                      <span className="text-xs text-muted-foreground">Order: {item.sortOrder}</span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => testOpenEdit(item)}
                          className="p-1.5 text-muted-foreground hover:text-primary rounded-lg hover:bg-primary/10 transition-colors"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        {testDeleteId === item.id ? (
                          <div className="flex items-center gap-1">
                            <button onClick={() => testHandleDelete(item.id)} disabled={testSaving}
                              className="text-xs px-2 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                              Confirm
                            </button>
                            <button onClick={() => setTestDeleteId(null)}
                              className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors">
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button onClick={() => setTestDeleteId(item.id)}
                            className="p-1.5 text-muted-foreground hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors" title="Delete">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Announcement modal ── */}
      {annModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h3 className="text-lg font-bold text-secondary">{annEditing ? "Edit Announcement" : "Add Announcement"}</h3>
              <button onClick={() => setAnnModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                <Label>Title <span className="text-red-500">*</span></Label>
                <Input placeholder="Announcement title" value={annForm.title}
                  onChange={e => setAnnForm(f => ({ ...f, title: e.target.value }))} className="rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label>Content <span className="text-red-500">*</span></Label>
                <textarea rows={4} placeholder="Announcement content" value={annForm.content}
                  onChange={e => setAnnForm(f => ({ ...f, content: e.target.value }))}
                  className="w-full border border-input rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Category</Label>
                  <select value={annForm.category} onChange={e => setAnnForm(f => ({ ...f, category: e.target.value }))}
                    className="w-full border border-input rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-ring">
                    {ANN_CATEGORIES.filter(c => c !== "All").map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-2 flex flex-col gap-2 justify-end">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={annForm.isUrgent} onChange={e => setAnnForm(f => ({ ...f, isUrgent: e.target.checked }))} className="rounded" />
                    Mark as Urgent
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={annForm.isActive} onChange={e => setAnnForm(f => ({ ...f, isActive: e.target.checked }))} className="rounded" />
                    Active
                  </label>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Publish Date <span className="text-red-500">*</span></Label>
                  <Input type="date" value={annForm.publishDate} onChange={e => setAnnForm(f => ({ ...f, publishDate: e.target.value }))} className="rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <Label>Expiry Date <span className="text-red-500">*</span></Label>
                  <Input type="date" value={annForm.expiryDate} onChange={e => setAnnForm(f => ({ ...f, expiryDate: e.target.value }))} className="rounded-xl" />
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-border flex justify-end gap-3">
              <Button variant="outline" onClick={() => setAnnModal(false)} className="rounded-xl" disabled={annSaving}>Cancel</Button>
              <Button
                onClick={annHandleSave}
                className="rounded-xl gap-2"
                disabled={!annForm.title.trim() || !annForm.content.trim() || !annForm.publishDate || !annForm.expiryDate || annSaving}
              >
                {annSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {annEditing ? "Save Changes" : "Add Announcement"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Testimonial modal ── */}
      {testModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h3 className="text-lg font-bold text-secondary">
                {testEditId !== null ? "Edit Testimonial" : "Add Testimonial"}
              </h3>
              <button onClick={testCloseModal} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-5">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-secondary">Parent's Name <span className="text-red-500">*</span></label>
                <input type="text" value={testForm.name}
                  onChange={e => setTestForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Priya Sharma"
                  className="w-full border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-secondary">Tagline <span className="text-red-500">*</span></label>
                <input type="text" value={testForm.detail}
                  onChange={e => setTestForm(f => ({ ...f, detail: e.target.value }))}
                  placeholder="e.g. Parent of a Hindi student"
                  className="w-full border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-secondary">Testimonial Quote <span className="text-red-500">*</span></label>
                <textarea value={testForm.quote}
                  onChange={e => setTestForm(f => ({ ...f, quote: e.target.value }))}
                  rows={4} placeholder="What did this parent say about Gurukul?"
                  className="w-full border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition resize-none" />
                <p className="text-xs text-muted-foreground">Keep it modest and authentic. Aim for 1–3 sentences.</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-secondary">Avatar Color</label>
                <div className="flex flex-wrap gap-2">
                  {COLOR_OPTIONS.map(c => (
                    <button key={c.value} type="button" onClick={() => setTestForm(f => ({ ...f, avatarColor: c.value }))}
                      title={c.label}
                      className={cn("w-8 h-8 rounded-full transition-transform hover:scale-110", c.value,
                        testForm.avatarColor === c.value && "ring-2 ring-offset-2 ring-secondary scale-110"
                      )} />
                  ))}
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <div className={cn("w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm", testForm.avatarColor)}>
                    {testForm.name ? getInitials(testForm.name) : "AB"}
                  </div>
                  <span className="text-sm text-muted-foreground">Avatar preview</span>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-secondary">Display Order</label>
                <input type="number" min={0} value={testForm.sortOrder}
                  onChange={e => setTestForm(f => ({ ...f, sortOrder: parseInt(e.target.value) || 0 }))}
                  className="w-24 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition" />
                <p className="text-xs text-muted-foreground">Lower number = shown first.</p>
              </div>
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input type="checkbox" checked={testForm.isActive}
                  onChange={e => setTestForm(f => ({ ...f, isActive: e.target.checked }))}
                  className="w-4 h-4 accent-primary rounded" />
                <span className="text-sm font-semibold text-secondary">Show on Parent Portal (active)</span>
              </label>
              {testFormErr && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2">{testFormErr}</p>
              )}
            </div>
            <div className="flex gap-3 px-6 py-4 border-t border-border">
              <Button variant="outline" onClick={testCloseModal} className="flex-1">Cancel</Button>
              <Button onClick={testHandleSave} disabled={testSaving} className="flex-1">
                {testSaving ? "Saving…" : testEditId !== null ? "Save Changes" : "Add Testimonial"}
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// ─── Log Card ─────────────────────────────────────────────────────────────────

function LogCard({ log }: { log: AdminMessage }) {
  const [expanded, setExpanded] = useState(false);
  const tags = [
    log.filterCourse     && log.filterCourse     !== "All" ? `Course: ${log.filterCourse}`     : null,
    log.filterCurricYear && log.filterCurricYear  !== "All" ? `Year: ${log.filterCurricYear}`  : null,
    log.filterEmployer   && log.filterEmployer   !== "All" ? `Employer: ${log.filterEmployer}` : null,
  ].filter(Boolean) as string[];

  return (
    <div className="bg-white border border-border rounded-2xl shadow-sm p-5">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs px-2 py-0.5 rounded-full font-medium shrink-0 bg-primary/10 text-primary">
              {AUDIENCE_LABEL[log.audienceType] ?? log.audienceType}
            </span>
            <p className="font-semibold text-secondary text-sm truncate">{log.subject}</p>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {formatDate(log.sentAt)} · {log.recipientCount} recipient{log.recipientCount !== 1 ? "s" : ""}
            {log.sentBy && <> · by {log.sentBy}</>}
          </p>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {tags.map(t => <span key={t} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{t}</span>)}
            </div>
          )}
        </div>
        <button onClick={() => setExpanded(e => !e)}
          className="text-xs text-muted-foreground hover:text-secondary shrink-0 flex items-center gap-1">
          {expanded ? <><X className="w-3 h-3" /> Collapse</> : <><Eye className="w-3 h-3" /> View</>}
        </button>
      </div>
      {expanded && (
        <div className="mt-4 pt-4 border-t border-border space-y-3">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Message</p>
            <pre className="text-sm text-secondary whitespace-pre-wrap bg-gray-50 rounded-xl p-4 font-sans">{log.body}</pre>
          </div>
          {log.teacherEmails && log.audienceType !== "parents" && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Teacher Recipients</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{log.teacherEmails.split(",").join(", ")}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Inbox Card ───────────────────────────────────────────────────────────────

function InboxCard({ message, onMarkRead, onDelete }: {
  message: InboxMessage; onMarkRead: () => void; onDelete: () => void;
}) {
  const [expanded,      setExpanded]      = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  function handleExpand() {
    setExpanded(e => !e);
    if (!message.isRead && !expanded) onMarkRead();
  }

  return (
    <div className={cn(
      "bg-white border rounded-2xl shadow-sm p-5 transition-colors",
      message.isRead ? "border-border" : "border-primary/40 bg-primary/5"
    )}>
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="min-w-0 flex items-start gap-3">
          <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5",
            message.isRead ? "bg-gray-100" : "bg-primary/20")}>
            {message.isRead
              ? <MailOpen className="w-4 h-4 text-muted-foreground" />
              : <Mail className="w-4 h-4 text-primary" />}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold text-secondary text-sm">{message.senderName ?? "Unknown"}</p>
              {!message.isRead && (
                <span className="text-xs bg-primary text-white px-2 py-0.5 rounded-full font-medium">New</span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-0.5 flex-wrap">
              {message.senderEmail && (
                <a href={`mailto:${message.senderEmail}`} className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1">
                  <Mail className="w-3 h-3" /> {message.senderEmail}
                </a>
              )}
              {message.senderPhone && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Phone className="w-3 h-3" /> {message.senderPhone}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{formatDate(message.createdAt)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={handleExpand} className="text-xs text-muted-foreground hover:text-secondary flex items-center gap-1">
            {expanded ? <><X className="w-3 h-3" /> Collapse</> : <><Eye className="w-3 h-3" /> View</>}
          </button>
          <button onClick={e => { e.stopPropagation(); setConfirmDelete(true); }}
            title="Delete message"
            className="p-1.5 rounded-lg text-muted-foreground hover:text-red-600 hover:bg-red-50 transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {confirmDelete && (
        <div className="mt-3 pt-3 border-t border-red-100 flex items-center justify-between gap-3 bg-red-50 rounded-xl px-4 py-3">
          <p className="text-sm text-red-700 font-medium">Delete this message permanently?</p>
          <div className="flex gap-2 shrink-0">
            <button onClick={() => setConfirmDelete(false)}
              className="text-xs px-3 py-1.5 rounded-lg border border-border bg-white text-secondary hover:bg-gray-50 transition">
              Cancel
            </button>
            <button onClick={onDelete}
              className="text-xs px-3 py-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700 transition font-semibold">
              Delete
            </button>
          </div>
        </div>
      )}

      {expanded && (
        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Message</p>
          <pre className="text-sm text-secondary whitespace-pre-wrap bg-gray-50 rounded-xl p-4 font-sans leading-relaxed">
            {message.message ?? "(no message)"}
          </pre>
          {message.senderEmail && (
            <a href={`mailto:${message.senderEmail}`}
              className="inline-flex items-center gap-1.5 mt-3 text-sm text-primary hover:underline font-medium">
              <Send className="w-3.5 h-3.5" /> Reply via email
            </a>
          )}
        </div>
      )}
    </div>
  );
}
