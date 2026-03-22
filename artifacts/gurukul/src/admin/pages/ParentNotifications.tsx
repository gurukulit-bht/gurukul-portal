import { useState, useEffect, useCallback } from "react";
import { Bell, Plus, X, Send, FileEdit, CheckCircle2, Clock, AlertCircle, ChevronDown } from "lucide-react";
import { useAuth } from "../AuthContext";
import { useListCourses } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { adminApi } from "@/lib/adminApi";
import { toast } from "sonner";

type Priority = "High" | "Normal" | "Low";
type NStatus  = "Draft" | "Published" | "Sent";

type Notification = {
  id:          number;
  title:       string;
  message:     string;
  courseName:  string | null;
  audience:    string;
  priority:    Priority;
  status:      NStatus;
  createdBy:   string;
  createdAt:   string;
  publishedAt: string | null;
};

const PRIORITY_COLORS: Record<Priority, string> = {
  High:   "bg-red-100   text-red-800   border-red-300",
  Normal: "bg-blue-100  text-blue-800  border-blue-300",
  Low:    "bg-gray-100  text-gray-600  border-gray-300",
};

const STATUS_COLORS: Record<NStatus, string> = {
  Draft:     "bg-yellow-100 text-yellow-800",
  Published: "bg-blue-100   text-blue-800",
  Sent:      "bg-green-100  text-green-800",
};

const STATUS_ICONS: Record<NStatus, React.ElementType> = {
  Draft:     FileEdit,
  Published: CheckCircle2,
  Sent:      Send,
};

const AUDIENCES = ["All Students", "Hindi Class", "Dharma Class", "Telugu Class", "Tamil Class", "Sanskrit Class", "Gujarati Class", "Level 1 Students", "Level 2 Students", "New Enrollees"];

export default function ParentNotifications() {
  const { user } = useAuth();
  const { data: rawCourses = [] } = useListCourses();
  const courseNames = (rawCourses as { name: string }[]).map(c => c.name);

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading]             = useState(true);
  const [showForm, setShowForm]           = useState(false);
  const [submitting, setSubmitting]       = useState(false);
  const [filter, setFilter]               = useState<NStatus | "All">("All");

  const [form, setForm] = useState({
    title:    "",
    message:  "",
    course:   "",
    audience: "All Students",
    priority: "Normal" as Priority,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminApi.notifications.list() as Notification[];
      setNotifications(data);
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadNotifications(); }, []);

  function validate() {
    const errs: Record<string, string> = {};
    if (!form.title.trim())   errs.title   = "Title is required.";
    if (!form.message.trim()) errs.message = "Message is required.";
    return errs;
  }

  async function handleSubmit(status: NStatus) {
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setSubmitting(true);
    try {
      await adminApi.notifications.create({
        title:      form.title.trim(),
        message:    form.message.trim(),
        courseName: form.course || null,
        audience:   form.audience,
        priority:   form.priority,
        status,
        createdBy:  user?.displayName ?? "Unknown",
      });
      toast.success(status === "Draft" ? "Saved as draft." : "Notification published!");
      setShowForm(false);
      setForm({ title: "", message: "", course: "", audience: "All Students", priority: "Normal" });
      loadNotifications();
    } catch {
      toast.error("Failed to save notification.");
    } finally {
      setSubmitting(false);
    }
  }

  async function updateStatus(id: number, status: NStatus) {
    try {
      await adminApi.notifications.updateStatus(id, status);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, status } : n));
      toast.success(`Notification marked as ${status}.`);
    } catch {
      toast.error("Failed to update status.");
    }
  }

  const filtered = filter === "All" ? notifications : notifications.filter(n => n.status === filter);

  const stats = {
    total:     notifications.length,
    draft:     notifications.filter(n => n.status === "Draft").length,
    published: notifications.filter(n => n.status === "Published").length,
    sent:      notifications.filter(n => n.status === "Sent").length,
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total",     value: stats.total,     color: "text-secondary" },
          { label: "Drafts",    value: stats.draft,     color: "text-yellow-600" },
          { label: "Published", value: stats.published, color: "text-blue-600" },
          { label: "Sent",      value: stats.sent,      color: "text-green-600" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl p-4 shadow-sm border border-border">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Header / actions */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex gap-1.5">
          {(["All", "Draft", "Published", "Sent"] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${
                filter === f ? "bg-primary text-white border-primary" : "bg-white border-border text-secondary hover:border-primary/50"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <Button
          onClick={() => { setShowForm(true); setErrors({}); }}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Notification
        </Button>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-border p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-secondary flex items-center gap-2"><Bell className="w-4 h-4" /> New Notification</h3>
            <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-secondary">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-secondary mb-1 block">Title *</label>
              <Input
                placeholder="e.g., Fee Payment Reminder"
                value={form.title}
                onChange={e => { setForm(f => ({ ...f, title: e.target.value })); setErrors(er => ({ ...er, title: "" })); }}
                className={errors.title ? "border-red-400" : ""}
              />
              {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-secondary mb-1 block">Message *</label>
              <textarea
                rows={4}
                placeholder="Write your message to parents here..."
                value={form.message}
                onChange={e => { setForm(f => ({ ...f, message: e.target.value })); setErrors(er => ({ ...er, message: "" })); }}
                className={`w-full text-sm border rounded-lg px-3 py-2 focus:outline-none focus:border-primary resize-none ${errors.message ? "border-red-400" : "border-border"}`}
              />
              {errors.message && <p className="text-xs text-red-500 mt-1">{errors.message}</p>}
            </div>

            <div>
              <label className="text-xs font-semibold text-secondary mb-1 block">Course (optional)</label>
              <div className="relative">
                <select
                  value={form.course}
                  onChange={e => setForm(f => ({ ...f, course: e.target.value }))}
                  className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-primary appearance-none pr-8"
                >
                  <option value="">All Courses</option>
                  {courseNames.map(c => <option key={c}>{c}</option>)}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-secondary mb-1 block">Audience</label>
              <div className="relative">
                <select
                  value={form.audience}
                  onChange={e => setForm(f => ({ ...f, audience: e.target.value }))}
                  className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-primary appearance-none pr-8"
                >
                  {AUDIENCES.map(a => <option key={a}>{a}</option>)}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-secondary mb-1 block">Priority</label>
              <div className="flex gap-2">
                {(["High", "Normal", "Low"] as Priority[]).map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, priority: p }))}
                    className={`flex-1 text-xs py-1.5 rounded-lg border font-medium transition-colors ${
                      form.priority === p ? PRIORITY_COLORS[p] : "border-border text-muted-foreground hover:border-primary/50"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2 border-t border-border justify-end">
            <Button variant="outline" onClick={() => handleSubmit("Draft")} disabled={submitting}>
              <FileEdit className="w-4 h-4 mr-1" /> Save as Draft
            </Button>
            <Button onClick={() => handleSubmit("Published")} disabled={submitting}>
              <Send className="w-4 h-4 mr-1" /> Publish
            </Button>
          </div>
        </div>
      )}

      {/* Notifications List */}
      <div className="bg-white rounded-xl shadow-sm border border-border overflow-hidden">
        <div className="px-5 py-3.5 border-b border-border">
          <h3 className="text-sm font-semibold text-secondary">
            {filter === "All" ? "All Notifications" : `${filter} Notifications`}
            <span className="ml-2 text-muted-foreground font-normal">({filtered.length})</span>
          </h3>
        </div>

        {loading ? (
          <div className="p-8 text-center text-muted-foreground text-sm">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Bell className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">No notifications found.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map(n => {
              const Icon = STATUS_ICONS[n.status];
              return (
                <div key={n.id} className="p-5">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1.5">
                        <span className="font-semibold text-secondary text-sm">{n.title}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium border ${PRIORITY_COLORS[n.priority]}`}>
                          {n.priority}
                        </span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium flex items-center gap-1 ${STATUS_COLORS[n.status]}`}>
                          <Icon className="w-2.5 h-2.5" />
                          {n.status}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed mb-2">{n.message}</p>
                      <div className="flex gap-4 text-xs text-muted-foreground flex-wrap">
                        <span>Audience: <span className="font-medium text-secondary">{n.audience}</span></span>
                        {n.courseName && <span>Course: <span className="font-medium text-secondary">{n.courseName}</span></span>}
                        <span>By: <span className="font-medium">{n.createdBy}</span></span>
                        <span>{new Date(n.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    {n.status === "Draft" && (
                      <button
                        onClick={() => updateStatus(n.id, "Published")}
                        className="text-xs px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors font-medium shrink-0"
                      >
                        Publish
                      </button>
                    )}
                    {n.status === "Published" && (
                      <button
                        onClick={() => updateStatus(n.id, "Sent")}
                        className="text-xs px-3 py-1.5 bg-green-50 text-green-700 rounded-lg border border-green-200 hover:bg-green-100 transition-colors font-medium shrink-0"
                      >
                        Mark Sent
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
