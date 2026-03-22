import { useState, useEffect } from "react";
import { adminApi } from "@/lib/adminApi";
import { Plus, Edit2, Trash2, Check, X, Search, Calendar, MapPin, Clock, RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type AdminEvent = {
  id: number; title: string; description: string; date: string; time: string;
  location: string; category: string; isRecurring: boolean;
};

const categories = ["All", "Classes", "Festival", "Meeting", "Exam", "Cultural", "Annual Event", "Holiday"];
const emptyForm: Omit<AdminEvent, "id"> = { title: "", description: "", date: "", time: "", location: "", category: "Classes", isRecurring: false };

const catColors: Record<string, string> = {
  Classes: "bg-blue-100 text-blue-700", Festival: "bg-purple-100 text-purple-700",
  Meeting: "bg-green-100 text-green-700", Exam: "bg-red-100 text-red-700",
  Cultural: "bg-orange-100 text-orange-700", "Annual Event": "bg-pink-100 text-pink-700",
  Holiday: "bg-yellow-100 text-yellow-700",
};

export default function CalendarAdmin() {
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("All");
  const [view, setView] = useState<"list" | "monthly">("list");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<AdminEvent | null>(null);
  const [form, setForm] = useState<Omit<AdminEvent, "id">>(emptyForm);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  useEffect(() => {
    adminApi.events.list().then((d) => setEvents(d as AdminEvent[])).finally(() => setLoading(false));
  }, []);

  const filtered = [...events]
    .filter((e) => (filterCat === "All" || e.category === filterCat) && e.title.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => a.date.localeCompare(b.date));

  function openAdd() { setEditing(null); setForm(emptyForm); setShowModal(true); }
  function openEdit(e: AdminEvent) {
    setEditing(e);
    setForm({ title: e.title, description: e.description, date: e.date, time: e.time, location: e.location, category: e.category, isRecurring: e.isRecurring });
    setShowModal(true);
  }

  async function handleSave() {
    if (!form.title.trim() || !form.date || !form.time) return;
    setSaving(true);
    try {
      if (editing) {
        const updated = await adminApi.events.update(editing.id, form);
        setEvents((prev) => prev.map((e) => e.id === editing.id ? updated as AdminEvent : e));
      } else {
        const created = await adminApi.events.create(form);
        setEvents((prev) => [...prev, created as AdminEvent]);
      }
      setShowModal(false);
    } catch { /* silent */ }
    finally { setSaving(false); }
  }

  async function handleDelete(id: number) {
    try {
      await adminApi.events.remove(id);
      setEvents((prev) => prev.filter((e) => e.id !== id));
      setDeleteConfirm(null);
    } catch { /* silent */ }
  }

  const groupedByMonth: Record<string, AdminEvent[]> = {};
  filtered.forEach((e) => {
    const key = new Date(e.date + "T00:00:00").toLocaleDateString("en-US", { month: "long", year: "numeric" });
    if (!groupedByMonth[key]) groupedByMonth[key] = [];
    groupedByMonth[key].push(e);
  });

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-secondary">Event Calendar</h2>
          <p className="text-sm text-muted-foreground">{events.length} events scheduled</p>
        </div>
        <div className="flex gap-2">
          <div className="flex rounded-xl border border-border overflow-hidden">
            <button onClick={() => setView("list")} className={`px-3 py-1.5 text-xs font-medium transition-colors ${view === "list" ? "bg-primary text-white" : "bg-white text-muted-foreground hover:bg-gray-50"}`}>List</button>
            <button onClick={() => setView("monthly")} className={`px-3 py-1.5 text-xs font-medium transition-colors ${view === "monthly" ? "bg-primary text-white" : "bg-white text-muted-foreground hover:bg-gray-50"}`}>By Month</button>
          </div>
          <Button onClick={openAdd} className="gap-2 rounded-xl shrink-0">
            <Plus className="w-4 h-4" /> Add Event
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search events..." className="pl-9 rounded-xl" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <button key={c} onClick={() => setFilterCat(c)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filterCat === c ? "bg-primary text-white" : "bg-white border border-border text-muted-foreground hover:border-primary"}`}>{c}</button>
          ))}
        </div>
      </div>

      {view === "list" ? (
        <div className="bg-white rounded-2xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-border">
                <tr>
                  {["Event", "Date", "Time", "Location", "Category", "Recurring", "Actions"].map((h) => (
                    <th key={h} className="text-left font-semibold text-muted-foreground px-4 py-3 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && <tr><td colSpan={7} className="text-center py-12 text-muted-foreground">No events found.</td></tr>}
                {filtered.map((e) => (
                  <tr key={e.id} className="border-b border-border/50 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-secondary">{e.title}</div>
                      <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{e.description}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        {new Date(e.date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Clock className="w-3 h-3" />{e.time}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><MapPin className="w-3 h-3" />{e.location}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${catColors[e.category] ?? "bg-gray-100 text-gray-600"}`}>{e.category}</span>
                    </td>
                    <td className="px-4 py-3">
                      {e.isRecurring ? <RefreshCw className="w-4 h-4 text-primary" /> : <span className="text-xs text-muted-foreground">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(e)} className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 flex items-center justify-center transition-colors">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {deleteConfirm === e.id ? (
                          <div className="flex gap-1">
                            <button onClick={() => handleDelete(e.id)} className="w-7 h-7 rounded-lg bg-red-500 text-white hover:bg-red-600 flex items-center justify-center"><Check className="w-3 h-3" /></button>
                            <button onClick={() => setDeleteConfirm(null)} className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center"><X className="w-3 h-3" /></button>
                          </div>
                        ) : (
                          <button onClick={() => setDeleteConfirm(e.id)} className="w-7 h-7 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 flex items-center justify-center transition-colors">
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
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedByMonth).map(([month, monthEvents]) => (
            <div key={month} className="bg-white rounded-2xl border border-border overflow-hidden">
              <div className="px-6 py-4 bg-primary/5 border-b border-border">
                <h3 className="font-bold text-secondary">{month}</h3>
              </div>
              <div className="divide-y divide-border">
                {monthEvents.map((e) => (
                  <div key={e.id} className="p-4 hover:bg-gray-50 transition-colors flex items-start gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex flex-col items-center justify-center text-primary shrink-0">
                      <div className="text-lg font-bold leading-none">{new Date(e.date + "T00:00:00").getDate()}</div>
                      <div className="text-xs">{new Date(e.date + "T00:00:00").toLocaleDateString("en-US", { weekday: "short" })}</div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-secondary">{e.title}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${catColors[e.category] ?? "bg-gray-100 text-gray-600"}`}>{e.category}</span>
                        {e.isRecurring && <span className="text-xs text-primary flex items-center gap-1"><RefreshCw className="w-3 h-3" />Recurring</span>}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1 flex items-center gap-3">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{e.time}</span>
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{e.location}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button onClick={() => openEdit(e)} className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 flex items-center justify-center">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setDeleteConfirm(e.id)} className="w-7 h-7 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 flex items-center justify-center">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {filtered.length === 0 && <div className="bg-white rounded-2xl border border-border p-12 text-center text-muted-foreground">No events found.</div>}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-border">
              <h3 className="text-lg font-bold text-secondary">{editing ? "Edit Event" : "Add Event"}</h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-1.5"><Label>Event Title *</Label><Input placeholder="Event title" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className="rounded-xl" /></div>
              <div className="space-y-1.5">
                <Label>Description</Label>
                <textarea rows={2} placeholder="Event description" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="w-full border border-input rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5"><Label>Date *</Label><Input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} className="rounded-xl" /></div>
                <div className="space-y-1.5"><Label>Time *</Label><Input placeholder="e.g. 10:00 AM" value={form.time} onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))} className="rounded-xl" /></div>
              </div>
              <div className="space-y-1.5"><Label>Location</Label><Input placeholder="Event location" value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} className="rounded-xl" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Category</Label>
                  <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} className="w-full border border-input rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-ring">
                    {categories.filter((c) => c !== "All").map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5 flex flex-col justify-end">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={form.isRecurring} onChange={(e) => setForm((f) => ({ ...f, isRecurring: e.target.checked }))} className="rounded" />
                    Recurring Event
                  </label>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-border flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowModal(false)} className="rounded-xl" disabled={saving}>Cancel</Button>
              <Button onClick={handleSave} className="rounded-xl gap-2" disabled={!form.title.trim() || !form.date || !form.time || saving}>
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {editing ? "Save Changes" : "Add Event"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
