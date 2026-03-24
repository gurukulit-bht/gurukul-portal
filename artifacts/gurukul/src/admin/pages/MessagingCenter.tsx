import { useState, useEffect, useCallback } from "react";
import { adminApi } from "@/lib/adminApi";
import { usePortalSettings } from "../contexts/PortalSettingsContext";
import { Button } from "@/components/ui/button";
import {
  Mail, Send, Users, Filter, ChevronDown, ChevronUp,
  CheckCircle2, AlertCircle, Clock, RefreshCw, Eye, EyeOff,
  X, Loader2, Info, Inbox, Phone, MailOpen, Trash2, StickyNote,
  AlertTriangle, GraduationCap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import NotesTab from "../components/NotesTab";

// ─── Types ────────────────────────────────────────────────────────────────────

type Recipient = {
  name: string;
  email: string;
  phone: string;
  relation: string;
  studentName: string;
  studentCode: string;
};

type AdminMessage = {
  id: number;
  subject: string;
  body: string;
  audienceType: string;
  recipientCount: number;
  teacherEmails: string | null;
  filterCourse: string | null;
  filterCurricYear: string | null;
  filterEmployer: string | null;
  sentBy: string | null;
  sentAt: string;
};

type InboxMessage = {
  id: number;
  senderName: string | null;
  senderEmail: string | null;
  senderPhone: string | null;
  message: string | null;
  isRead: boolean;
  createdAt: string;
};

const COURSES = ["All", "Hindi", "Dharma", "Telugu", "Tamil", "Sanskrit", "Gujarati"];

const AUDIENCE_LABEL: Record<string, string> = {
  parents:  "Parents",
  teachers: "Teachers",
  both:     "Parents + Teachers",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "numeric", minute: "2-digit",
  });
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function MessagingCenter() {
  const [tab, setTab] = useState<"compose" | "history" | "inbox" | "notes">("compose");

  // ── Filters ──
  const [filterCourse,     setFilterCourse]     = useState("All");
  const { curriculumYearsLong, activeCurriculumYearLong } = usePortalSettings();
  const [filterCurricYear, setFilterCurricYear] = useState("2027-2028");

  useEffect(() => {
    if (activeCurriculumYearLong) setFilterCurricYear(activeCurriculumYearLong);
  }, [activeCurriculumYearLong]);
  const [filterEmployer,   setFilterEmployer]   = useState("All");
  const [employers,        setEmployers]         = useState<string[]>([]);
  const [showFilters,      setShowFilters]       = useState(true);

  // ── Audience (send-to) ──
  const [sendTo, setSendTo] = useState<"parents" | "teachers" | "both">("parents");

  // ── Teachers ──
  type TeacherBasic = { id: number; name: string; email: string };
  const [teacherList,           setTeacherList]           = useState<TeacherBasic[]>([]);
  const [selectedTeacherEmails, setSelectedTeacherEmails] = useState<Set<string>>(new Set());
  const [showTeachers,          setShowTeachers]          = useState(false);

  // ── Recipients (parents) ──
  const [recipients,       setRecipients]       = useState<Recipient[]>([]);
  const [recipientsLoading, setRecipientsLoading] = useState(false);
  const [selectedEmails,   setSelectedEmails]   = useState<Set<string>>(new Set());
  const [showRecipients,   setShowRecipients]   = useState(false);

  // ── Compose ──
  const [subject, setSubject] = useState("");
  const [body,    setBody]    = useState("");
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{
    success: boolean; sent: number; failed: number; message: string; smtpConfigured: boolean;
  } | null>(null);

  // ── History ──
  const [logs,        setLogs]        = useState<AdminMessage[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  // ── Inbox ──
  const [inboxMessages,  setInboxMessages]  = useState<InboxMessage[]>([]);
  const [inboxLoading,   setInboxLoading]   = useState(false);

  // Load employers, inbox, and teachers on mount
  useEffect(() => {
    adminApi.messaging.employers()
      .then(list => setEmployers(list as string[]))
      .catch(() => {});
    adminApi.messaging.inbox()
      .then(data => setInboxMessages(data as InboxMessage[]))
      .catch(() => {});
    adminApi.teachers.list()
      .then(data => {
        const list = (data as { id: number; name: string; email: string }[]).filter(t => !!t.email);
        setTeacherList(list);
        setSelectedTeacherEmails(new Set(list.map(t => t.email)));
      })
      .catch(() => {});
  }, []);

  // Load recipients when filters change
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
    setSelectedEmails(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  function selectAll() {
    setSelectedEmails(new Set(recipients.map(recipientKey)));
  }

  function deselectAll() {
    setSelectedEmails(new Set());
  }

  function toggleTeacher(email: string) {
    setSelectedTeacherEmails(prev => {
      const next = new Set(prev);
      next.has(email) ? next.delete(email) : next.add(email);
      return next;
    });
  }
  function selectAllTeachers()   { setSelectedTeacherEmails(new Set(teacherList.map(t => t.email))); }
  function deselectAllTeachers() { setSelectedTeacherEmails(new Set()); }

  async function handleSend() {
    if (!subject.trim()) { alert("Please enter a subject."); return; }
    if (!body.trim())    { alert("Please write a message body."); return; }

    const parentRecipients = sendTo !== "teachers"
      ? recipients.filter(r => selectedEmails.has(recipientKey(r)))
          .map(r => ({ name: r.name, email: r.email, phone: r.phone, studentName: r.studentName }))
      : [];

    const teacherRecipients = sendTo !== "parents"
      ? teacherList.filter(t => selectedTeacherEmails.has(t.email))
          .map(t => ({ name: t.name, email: t.email, phone: "", studentName: "" }))
      : [];

    const allRecipients = [...parentRecipients, ...teacherRecipients];
    if (!allRecipients.length)  { alert("No recipients selected."); return; }

    const chosenTeacherEmails = sendTo !== "parents"
      ? teacherList.filter(t => selectedTeacherEmails.has(t.email)).map(t => t.email).join(",")
      : undefined;

    setSending(true);
    setSendResult(null);
    try {
      const result = await adminApi.messaging.send({
        subject,
        body,
        recipients: allRecipients,
        audienceType: sendTo,
        teacherEmails: chosenTeacherEmails,
        filterCourse:     filterCourse !== "All" ? filterCourse : undefined,
        filterCurricYear: filterCurricYear !== "All" ? filterCurricYear : undefined,
        filterEmployer:   filterEmployer !== "All" ? filterEmployer : undefined,
      }) as { success: boolean; sent: number; failed: number; message: string; smtpConfigured: boolean };
      setSendResult(result);
      if (result.success) {
        setSubject("");
        setBody("");
      }
    } catch (err: unknown) {
      setSendResult({
        success: false,
        sent: 0,
        failed: allRecipients.length,
        message: err instanceof Error ? err.message : "Send failed.",
        smtpConfigured: false,
      });
    } finally {
      setSending(false);
    }
  }

  async function loadLogs() {
    setLogsLoading(true);
    try {
      const data = await adminApi.messaging.messages();
      setLogs(data as AdminMessage[]);
    } catch {
      setLogs([]);
    } finally {
      setLogsLoading(false);
    }
  }

  async function loadInbox() {
    setInboxLoading(true);
    try {
      const data = await adminApi.messaging.inbox();
      setInboxMessages(data as InboxMessage[]);
    } catch {
      setInboxMessages([]);
    } finally {
      setInboxLoading(false);
    }
  }

  async function markAsRead(id: number) {
    await adminApi.messaging.markRead(id);
    setInboxMessages(prev => prev.map(m => m.id === id ? { ...m, isRead: true } : m));
  }

  async function deleteMessage(id: number) {
    try {
      await adminApi.messaging.deleteMessage(id);
      setInboxMessages(prev => prev.filter(m => m.id !== id));
    } catch {
      alert("Failed to delete message. Please try again.");
    }
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

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-secondary">Messaging Center</h2>
          <p className="text-sm text-muted-foreground">Send emails to parents, teachers, or both — filtered by course, curriculum year, or employer.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setTab("compose")}
            className={cn("px-4 py-2 rounded-xl text-sm font-semibold transition-colors",
              tab === "compose" ? "bg-primary text-white" : "bg-gray-100 text-secondary hover:bg-gray-200")}
          >
            <Mail className="w-4 h-4 inline mr-1.5" /> Compose
          </button>
          <button
            onClick={() => setTab("inbox")}
            className={cn("px-4 py-2 rounded-xl text-sm font-semibold transition-colors relative",
              tab === "inbox" ? "bg-primary text-white" : "bg-gray-100 text-secondary hover:bg-gray-200")}
          >
            <Inbox className="w-4 h-4 inline mr-1.5" /> Inbox
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setTab("history")}
            className={cn("px-4 py-2 rounded-xl text-sm font-semibold transition-colors",
              tab === "history" ? "bg-primary text-white" : "bg-gray-100 text-secondary hover:bg-gray-200")}
          >
            <Clock className="w-4 h-4 inline mr-1.5" /> History
          </button>
          <button
            onClick={() => setTab("notes")}
            className={cn("px-4 py-2 rounded-xl text-sm font-semibold transition-colors",
              tab === "notes" ? "bg-primary text-white" : "bg-gray-100 text-secondary hover:bg-gray-200")}
          >
            <StickyNote className="w-4 h-4 inline mr-1.5" /> My Notes
          </button>
        </div>
      </div>

      {/* ── COMPOSE TAB ─────────────────────────────────────────────────────── */}
      {tab === "compose" && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

          {/* LEFT: Filters + Recipients */}
          <div className="xl:col-span-1 space-y-4">

            {/* ── Audience card ── */}
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

            {/* ── Parent filter + recipient cards (hidden when teachers-only) ── */}
            {sendTo !== "teachers" && (<>
              {/* Filter card */}
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
                      <select
                        value={filterCourse}
                        onChange={e => setFilterCourse(e.target.value)}
                        className="w-full text-sm border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-primary bg-white"
                      >
                        {COURSES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Curriculum Year</label>
                      <select
                        value={filterCurricYear}
                        onChange={e => setFilterCurricYear(e.target.value)}
                        className="w-full text-sm border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-primary bg-white"
                      >
                        <option value="All">All Years</option>
                        {curriculumYearsLong.map(y => <option key={y} value={y}>{y}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Parent Employer</label>
                      <select
                        value={filterEmployer}
                        onChange={e => setFilterEmployer(e.target.value)}
                        className="w-full text-sm border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-primary bg-white"
                      >
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

              {/* Parent recipients card */}
              <div className="bg-white border border-border rounded-2xl shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                  <span className="flex items-center gap-2 font-semibold text-secondary text-sm">
                    <Users className="w-4 h-4 text-primary" />
                    {recipientsLoading ? "Loading…" : `${selectedCount} / ${recipients.length} parents`}
                  </span>
                  <button
                    onClick={() => setShowRecipients(v => !v)}
                    className="text-xs text-muted-foreground hover:text-secondary flex items-center gap-1"
                  >
                    {showRecipients ? <><EyeOff className="w-3.5 h-3.5" /> Hide</> : <><Eye className="w-3.5 h-3.5" /> Show</>}
                  </button>
                </div>
                {recipientsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  </div>
                ) : recipients.length === 0 ? (
                  <div className="py-8 text-center text-sm text-muted-foreground px-4">
                    No parents match the current filters.
                  </div>
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
                            <input
                              type="checkbox"
                              checked={selectedEmails.has(recipientKey(r))}
                              onChange={() => toggleRecipient(recipientKey(r))}
                              className="mt-0.5 accent-primary w-4 h-4 shrink-0"
                            />
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

            {/* ── Teacher list card (hidden when parents-only) ── */}
            {sendTo !== "parents" && (
              <div className="bg-white border border-border rounded-2xl shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                  <span className="flex items-center gap-2 font-semibold text-secondary text-sm">
                    <GraduationCap className="w-4 h-4 text-primary" />
                    {`${selectedTeacherCount} / ${teacherList.length} teachers`}
                  </span>
                  <button
                    onClick={() => setShowTeachers(v => !v)}
                    className="text-xs text-muted-foreground hover:text-secondary flex items-center gap-1"
                  >
                    {showTeachers ? <><EyeOff className="w-3.5 h-3.5" /> Hide</> : <><Eye className="w-3.5 h-3.5" /> Show</>}
                  </button>
                </div>
                {teacherList.length === 0 ? (
                  <div className="py-8 text-center text-sm text-muted-foreground px-4">
                    No teachers with registered emails found.
                  </div>
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
                            <input
                              type="checkbox"
                              checked={selectedTeacherEmails.has(t.email)}
                              onChange={() => toggleTeacher(t.email)}
                              className="accent-primary w-4 h-4 shrink-0"
                            />
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

            {/* ── In-app notice banner ── */}
            <div className="flex items-start gap-3 bg-sky-50 border border-sky-200 text-sky-800 rounded-xl px-4 py-3 text-sm">
              <Info className="w-4 h-4 mt-0.5 shrink-0" />
              <div>
                <span className="font-semibold">In-app messaging:</span> Messages are stored securely and displayed directly inside the portal —
                teachers see them in their Messaging Center, and parents see them on the Parent Portal after verifying their phone.
                No email is sent.
              </div>
            </div>

            {/* ── Parent visibility warning ── */}
            {sendTo !== "teachers" && (
              <div className="flex items-start gap-3 bg-amber-50 border border-amber-300 text-amber-800 rounded-xl px-4 py-3 text-sm">
                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-amber-600" />
                <div>
                  <span className="font-semibold">Heads up — parents will see this message.</span>{" "}
                  Please review your content carefully. Once published, this message will be visible in the Parent Portal to{" "}
                  {sendTo === "both"
                    ? <><span className="font-semibold">{selectedCount} parent{selectedCount !== 1 ? "s" : ""}</span> and <span className="font-semibold">{selectedTeacherCount} teacher{selectedTeacherCount !== 1 ? "s" : ""}</span>.</>
                    : <><span className="font-semibold">{selectedCount} parent{selectedCount !== 1 ? "s" : ""}</span>.</>
                  }
                </div>
              </div>
            )}

            <div className="bg-white border border-border rounded-2xl shadow-sm p-6 space-y-5">
              <h3 className="font-bold text-secondary">Compose Message</h3>

              {/* Subject */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-secondary">
                  Subject <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  placeholder="e.g. Important Update from BHT Gurukul"
                  className="w-full border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
                />
              </div>

              {/* Body */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-secondary">
                  Message <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={12}
                  value={body}
                  onChange={e => setBody(e.target.value)}
                  placeholder={`Dear Parents,\n\nWe wanted to share an important update from BHT Gurukul...\n\nWarm regards,\nBHT Gurukul Team`}
                  className="w-full border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition resize-none"
                />
              </div>

              {/* Result banner */}
              {sendResult && (
                <div className={cn(
                  "flex items-start gap-3 rounded-xl px-4 py-3 text-sm border",
                  sendResult.success
                    ? "bg-green-50 border-green-200 text-green-800"
                    : "bg-red-50 border-red-200 text-red-800"
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

              {/* Send button */}
              <div className="flex items-center justify-between gap-4 pt-2">
                <div className="text-sm text-muted-foreground space-y-0.5">
                  <p>
                    Will deliver to <span className="font-semibold text-secondary">{totalSelectedCount}</span> recipient{totalSelectedCount !== 1 ? "s" : ""}
                  </p>
                  {sendTo === "both" && (
                    <p className="text-xs">
                      <span className="text-primary font-medium">{selectedCount} parent{selectedCount !== 1 ? "s" : ""}</span>
                      {" + "}
                      <span className="text-primary font-medium">{selectedTeacherCount} teacher{selectedTeacherCount !== 1 ? "s" : ""}</span>
                    </p>
                  )}
                </div>
                <Button onClick={handleSend} disabled={sending || totalSelectedCount === 0} className="gap-2 min-w-36">
                  {sending
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Publishing…</>
                    : <><Send className="w-4 h-4" /> Publish Message</>}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── INBOX TAB ───────────────────────────────────────────────────────── */}
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
            <div className="flex items-center justify-center h-40">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : inboxMessages.length === 0 ? (
            <div className="text-center py-20 border-2 border-dashed border-border rounded-2xl">
              <Inbox className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-muted-foreground font-medium">No messages yet.</p>
              <p className="text-sm text-muted-foreground mt-1">Messages from the public Contact Us page will appear here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {inboxMessages.map(msg => (
                <InboxCard
                  key={msg.id}
                  message={msg}
                  onMarkRead={() => markAsRead(msg.id)}
                  onDelete={() => deleteMessage(msg.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── HISTORY TAB ─────────────────────────────────────────────────────── */}
      {tab === "history" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{logs.length} messages sent (most recent first)</p>
            <Button variant="outline" size="sm" className="gap-2" onClick={loadLogs} disabled={logsLoading}>
              <RefreshCw className={cn("w-4 h-4", logsLoading && "animate-spin")} /> Refresh
            </Button>
          </div>

          {logsLoading ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-20 border-2 border-dashed border-border rounded-2xl">
              <Mail className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-muted-foreground font-medium">No messages sent yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map(log => (
                <LogCard key={log.id} log={log} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── MY NOTES TAB ────────────────────────────────────────────────────── */}
      {tab === "notes" && <NotesTab />}
    </div>
  );
}

// ─── Log Card ─────────────────────────────────────────────────────────────────

function LogCard({ log }: { log: AdminMessage }) {
  const [expanded, setExpanded] = useState(false);

  const tags = [
    log.filterCourse     && log.filterCourse     !== "All" ? `Course: ${log.filterCourse}`       : null,
    log.filterCurricYear && log.filterCurricYear  !== "All" ? `Year: ${log.filterCurricYear}`    : null,
    log.filterEmployer   && log.filterEmployer   !== "All" ? `Employer: ${log.filterEmployer}`   : null,
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
              {tags.map(t => (
                <span key={t} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{t}</span>
              ))}
            </div>
          )}
        </div>
        <button
          onClick={() => setExpanded(e => !e)}
          className="text-xs text-muted-foreground hover:text-secondary shrink-0 flex items-center gap-1"
        >
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

function InboxCard({
  message,
  onMarkRead,
  onDelete,
}: {
  message: InboxMessage;
  onMarkRead: () => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  function handleExpand() {
    setExpanded(e => !e);
    if (!message.isRead && !expanded) onMarkRead();
  }

  function handleDeleteClick(e: React.MouseEvent) {
    e.stopPropagation();
    setConfirmDelete(true);
  }

  return (
    <div className={cn(
      "bg-white border rounded-2xl shadow-sm p-5 transition-colors",
      message.isRead ? "border-border" : "border-primary/40 bg-primary/5"
    )}>
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="min-w-0 flex items-start gap-3">
          <div className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5",
            message.isRead ? "bg-gray-100" : "bg-primary/20"
          )}>
            {message.isRead
              ? <MailOpen className="w-4 h-4 text-muted-foreground" />
              : <Mail className="w-4 h-4 text-primary" />
            }
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
          <button
            onClick={handleExpand}
            className="text-xs text-muted-foreground hover:text-secondary flex items-center gap-1"
          >
            {expanded ? <><X className="w-3 h-3" /> Collapse</> : <><Eye className="w-3 h-3" /> View</>}
          </button>
          <button
            onClick={handleDeleteClick}
            title="Delete message"
            className="p-1.5 rounded-lg text-muted-foreground hover:text-red-600 hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {confirmDelete && (
        <div className="mt-3 pt-3 border-t border-red-100 flex items-center justify-between gap-3 bg-red-50 rounded-xl px-4 py-3">
          <p className="text-sm text-red-700 font-medium">Delete this message permanently?</p>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => setConfirmDelete(false)}
              className="text-xs px-3 py-1.5 rounded-lg border border-border bg-white text-secondary hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              onClick={onDelete}
              className="text-xs px-3 py-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700 transition font-semibold"
            >
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
            <a
              href={`mailto:${message.senderEmail}`}
              className="inline-flex items-center gap-1.5 mt-3 text-sm text-primary hover:underline font-medium"
            >
              <Send className="w-3.5 h-3.5" /> Reply via email
            </a>
          )}
        </div>
      )}
    </div>
  );
}
