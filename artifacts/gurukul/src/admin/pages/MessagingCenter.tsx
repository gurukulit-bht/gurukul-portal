import { useState, useEffect, useCallback } from "react";
import { adminApi } from "@/lib/adminApi";
import { Button } from "@/components/ui/button";
import {
  Mail, Send, Users, Filter, ChevronDown, ChevronUp,
  CheckCircle2, AlertCircle, Clock, RefreshCw, Eye, EyeOff,
  X, Loader2, Info,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type Recipient = {
  name: string;
  email: string;
  relation: string;
  studentName: string;
  studentCode: string;
};

type EmailLog = {
  id: number;
  subject: string;
  body: string;
  recipientCount: number;
  recipientEmails: string;
  filterCourse: string | null;
  filterCurricYear: string | null;
  filterEmployer: string | null;
  sentBy: string | null;
  status: string;
  sentAt: string;
};

const COURSES = ["All", "Hindi", "Dharma", "Telugu", "Tamil", "Sanskrit", "Gujarati"];
const CURRICULUM_YEARS: string[] = Array.from({ length: 25 }, (_, i) => {
  const s = 2027 + i;
  return `${s}-${s + 1}`;
});

const STATUS_STYLE: Record<string, string> = {
  sent:    "bg-green-100 text-green-700",
  partial: "bg-orange-100 text-orange-700",
  failed:  "bg-red-100 text-red-700",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "numeric", minute: "2-digit",
  });
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function MessagingCenter() {
  const [tab, setTab] = useState<"compose" | "history">("compose");

  // ── Filters ──
  const [filterCourse,     setFilterCourse]     = useState("All");
  const [filterCurricYear, setFilterCurricYear] = useState("2027-2028");
  const [filterEmployer,   setFilterEmployer]   = useState("All");
  const [employers,        setEmployers]         = useState<string[]>([]);
  const [showFilters,      setShowFilters]       = useState(true);

  // ── Recipients ──
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
  const [logs,        setLogs]        = useState<EmailLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  // Load employers on mount
  useEffect(() => {
    adminApi.messaging.employers()
      .then(list => setEmployers(list as string[]))
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
      setSelectedEmails(new Set(list.map(r => r.email)));
    } catch {
      setRecipients([]);
    } finally {
      setRecipientsLoading(false);
    }
  }, [filterCourse, filterCurricYear, filterEmployer]);

  useEffect(() => { loadRecipients(); }, [loadRecipients]);

  function toggleRecipient(email: string) {
    setSelectedEmails(prev => {
      const next = new Set(prev);
      next.has(email) ? next.delete(email) : next.add(email);
      return next;
    });
  }

  function selectAll() {
    setSelectedEmails(new Set(recipients.map(r => r.email)));
  }

  function deselectAll() {
    setSelectedEmails(new Set());
  }

  async function handleSend() {
    if (!subject.trim()) { alert("Please enter a subject."); return; }
    if (!body.trim())    { alert("Please write a message body."); return; }
    const chosen = recipients.filter(r => selectedEmails.has(r.email));
    if (!chosen.length)  { alert("No recipients selected."); return; }

    setSending(true);
    setSendResult(null);
    try {
      const result = await adminApi.messaging.send({
        subject,
        body,
        recipients: chosen.map(r => ({ name: r.name, email: r.email, studentName: r.studentName })),
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
        failed: chosen.length,
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
      const data = await adminApi.messaging.logs();
      setLogs(data as EmailLog[]);
    } catch {
      setLogs([]);
    } finally {
      setLogsLoading(false);
    }
  }

  useEffect(() => {
    if (tab === "history") loadLogs();
  }, [tab]);

  const selectedCount = recipients.filter(r => selectedEmails.has(r.email)).length;

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-secondary">Messaging Center</h2>
          <p className="text-sm text-muted-foreground">Send emails to parents filtered by course, curriculum year, or employer.</p>
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
            onClick={() => setTab("history")}
            className={cn("px-4 py-2 rounded-xl text-sm font-semibold transition-colors",
              tab === "history" ? "bg-primary text-white" : "bg-gray-100 text-secondary hover:bg-gray-200")}
          >
            <Clock className="w-4 h-4 inline mr-1.5" /> History
          </button>
        </div>
      </div>

      {/* ── COMPOSE TAB ─────────────────────────────────────────────────────── */}
      {tab === "compose" && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

          {/* LEFT: Filters + Recipients */}
          <div className="xl:col-span-1 space-y-4">

            {/* Filter card */}
            <div className="bg-white border border-border rounded-2xl shadow-sm overflow-hidden">
              <button
                className="w-full flex items-center justify-between px-5 py-4 text-left"
                onClick={() => setShowFilters(f => !f)}
              >
                <span className="flex items-center gap-2 font-semibold text-secondary text-sm">
                  <Filter className="w-4 h-4 text-primary" /> Recipient Filters
                </span>
                {showFilters ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
              </button>

              {showFilters && (
                <div className="px-5 pb-5 space-y-4 border-t border-border pt-4">

                  {/* Course */}
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

                  {/* Curriculum Year */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Curriculum Year</label>
                    <select
                      value={filterCurricYear}
                      onChange={e => setFilterCurricYear(e.target.value)}
                      className="w-full text-sm border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-primary bg-white"
                    >
                      <option value="All">All Years</option>
                      {CURRICULUM_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>

                  {/* Employer */}
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

            {/* Recipients card */}
            <div className="bg-white border border-border rounded-2xl shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                <span className="flex items-center gap-2 font-semibold text-secondary text-sm">
                  <Users className="w-4 h-4 text-primary" />
                  {recipientsLoading ? "Loading…" : `${selectedCount} / ${recipients.length} recipients`}
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
                  {/* Select all / none */}
                  <div className="px-5 py-2 border-b border-border flex gap-3 text-xs">
                    <button onClick={selectAll} className="text-primary hover:underline font-medium">Select all</button>
                    <button onClick={deselectAll} className="text-muted-foreground hover:underline">Deselect all</button>
                  </div>

                  {showRecipients && (
                    <ul className="max-h-72 overflow-y-auto divide-y divide-border">
                      {recipients.map(r => (
                        <li key={r.email} className="flex items-start gap-3 px-5 py-3 hover:bg-gray-50">
                          <input
                            type="checkbox"
                            checked={selectedEmails.has(r.email)}
                            onChange={() => toggleRecipient(r.email)}
                            className="mt-0.5 accent-primary w-4 h-4 shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-secondary truncate">{r.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{r.email}</p>
                            <p className="text-xs text-muted-foreground">{r.relation} · Student: {r.studentName}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Compose */}
          <div className="xl:col-span-2 space-y-4">

            {/* SMTP notice banner */}
            <div className="flex items-start gap-3 bg-sky-50 border border-sky-200 text-sky-800 rounded-xl px-4 py-3 text-sm">
              <Info className="w-4 h-4 mt-0.5 shrink-0" />
              <div>
                <span className="font-semibold">Email delivery note:</span> Configure <code className="text-xs bg-sky-100 px-1 rounded">SMTP_HOST</code>, <code className="text-xs bg-sky-100 px-1 rounded">SMTP_USER</code>, <code className="text-xs bg-sky-100 px-1 rounded">SMTP_PASS</code>, and <code className="text-xs bg-sky-100 px-1 rounded">SMTP_FROM</code> environment variables to enable real delivery. Without them, messages are logged only.
                <span className="ml-1">Use <code className="text-xs bg-sky-100 px-1 rounded">{'{{parent_name}}'}</code> and <code className="text-xs bg-sky-100 px-1 rounded">{'{{student_name}}'}</code> for personalisation.</span>
              </div>
            </div>

            <div className="bg-white border border-border rounded-2xl shadow-sm p-6 space-y-5">
              <h3 className="font-bold text-secondary">Compose Email</h3>

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
                  Message Body <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={12}
                  value={body}
                  onChange={e => setBody(e.target.value)}
                  placeholder={`Dear {{parent_name}},\n\nWe wanted to share an important update regarding {{student_name}}'s enrollment at BHT Gurukul.\n\n...\n\nWarm regards,\nBHT Gurukul Team`}
                  className="w-full border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition resize-none font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  Use <code className="bg-gray-100 px-1 rounded">{`{{parent_name}}`}</code> and <code className="bg-gray-100 px-1 rounded">{`{{student_name}}`}</code> — they will be replaced per recipient.
                </p>
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
                    <p className="font-semibold">{sendResult.success ? "Done!" : "Error"}</p>
                    <p>{sendResult.message}</p>
                    {!sendResult.smtpConfigured && sendResult.success && (
                      <p className="mt-1 text-xs opacity-80">
                        Emails were not delivered — SMTP is not configured. Set the environment variables to enable real delivery.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Send button */}
              <div className="flex items-center justify-between gap-4 pt-2">
                <p className="text-sm text-muted-foreground">
                  Will send to <span className="font-semibold text-secondary">{selectedCount}</span> recipient{selectedCount !== 1 ? "s" : ""}
                </p>
                <Button onClick={handleSend} disabled={sending || selectedCount === 0} className="gap-2 min-w-36">
                  {sending
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</>
                    : <><Send className="w-4 h-4" /> Send Email</>}
                </Button>
              </div>
            </div>
          </div>
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
    </div>
  );
}

// ─── Log Card ─────────────────────────────────────────────────────────────────

function LogCard({ log }: { log: EmailLog }) {
  const [expanded, setExpanded] = useState(false);

  const tags = [
    log.filterCourse    && log.filterCourse    !== "All" ? `Course: ${log.filterCourse}`    : null,
    log.filterCurricYear && log.filterCurricYear !== "All" ? `Year: ${log.filterCurricYear}` : null,
    log.filterEmployer  && log.filterEmployer  !== "All" ? `Employer: ${log.filterEmployer}` : null,
  ].filter(Boolean) as string[];

  return (
    <div className="bg-white border border-border rounded-2xl shadow-sm p-5">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium shrink-0", STATUS_STYLE[log.status] ?? "bg-gray-100 text-gray-600")}>
              {log.status}
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
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Message Body</p>
            <pre className="text-sm text-secondary whitespace-pre-wrap bg-gray-50 rounded-xl p-4 font-sans">{log.body}</pre>
          </div>
          {log.recipientEmails && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Recipients</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{log.recipientEmails}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
