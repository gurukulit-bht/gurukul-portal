import { useState } from "react";
import { mockAdminEvents, AdminEvent } from "../mockData";
import { Plus, Edit2, Trash2, Check, X, Search, Calendar, MapPin, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const categories = ["All", "Classes", "Festival", "Meeting", "Exam", "Cultural", "Annual Event", "Holiday"];
const emptyForm: Omit<AdminEvent, "id"> = { title: "", description: "", date: "", time: "", location: "", category: "Classes", isRecurring: false };

const catColors: Record<string, string> = {
  Classes: "bg-blue-100 text-blue-700", Festival: "bg-purple-100 text-purple-700",
  Meeting: "bg-green-100 text-green-700", Exam: "bg-red-100 text-red-700",
  Cultural: "bg-orange-100 text-orange-700", "Annual Event": "bg-pink-100 text-pink-700",
  Holiday: "bg-yellow-100 text-yellow-700",
};

export default function CalendarAdmin() {
  const [events, setEvents] = useState<AdminEvent[]>(mockAdminEvents);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("All");
  const [view, setView] = useState<"list" | "monthly">("list");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<AdminEvent | null>(null);
  const [form, setForm] = useState<Omit<AdminEvent, "id">>(emptyForm);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  const filtered = [...events]
    .filter(e => (filterCat === "All" || e.category === filterCat) && e.title.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => a.date.localeCompare(b.date));

  function openAdd() { setEditing(null); setForm(emptyForm); setShowModal(true); }
  function openEdit(e: AdminEvent) { setEditing(e); setForm({ title: e.title, description: e.description, date: e.date, time: e.time, location: e.location, category: e.category, isRecurring: e.isRecurring }); setShowModal(true); }
  function handleSave() {
    if (!form.title.trim() || !form.date || !form.time) return;
    if (editing) {
      setEvents(prev => prev.map(e => e.id === editing.id ? { ...form, id: editing.id } : e));
    } else {
      setEvents(prev => [...prev, { ...form, id: Math.max(...prev.map(e => e.id)) + 1 }]);
    }
    setShowModal(false);
  }
  function handleDelete(id: number) { setEvents(prev => prev.filter(e => e.id !== id)); setDeleteConfirm(null); }

  const groupedByMonth: Record<string, AdminEvent[]> = {};
  filtered.forEach(e => {
    const key = new Date(e.date).toLocaleDateString("en-US", { month: "long", year: "numeric" });
    if (!groupedByMonth[key]) groupedByMonth[key] = [];
    groupedByMonth[key].push(e);
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-secondary">Calendar Management</h2>
          <p className="text-sm text-muted-foreground">{events.length} events scheduled</p>
        </div>
        <Button onClick={openAdd} className="gap-2 rounded-xl shrink-0">
          <Plus className="w-4 h-4" /> Add Event
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search events..." className="pl-9 rounded-xl" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2">
          <div className="flex bg-white border border-border rounded-xl overflow-hidden">
            <button onClick={() => setView("list")} className={`px-3 py-2 text-sm font-medium transition-colors ${view === "list" ? "bg-primary text-white" : "text-muted-foreground hover:bg-gray-50"}`}>List</button>
            <button onClick={() => setView("monthly")} className={`px-3 py-2 text-sm font-medium transition-colors ${view === "monthly" ? "bg-primary text-white" : "text-muted-foreground hover:bg-gray-50"}`}>Monthly</button>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {categories.map(c => (
          <button key={c} onClick={() => setFilterCat(c)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filterCat === c ? "bg-primary text-white" : "bg-white border border-border text-muted-foreground hover:border-primary"}`}>
            {c}
          </button>
        ))}
      </div>

      {view === "list" && (
        <div className="space-y-6">
          {Object.entries(groupedByMonth).map(([month, monthEvents]) => (
            <div key={month}>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4" /> {month}
              </h3>
              <div className="space-y-3">
                {monthEvents.map(event => (
                  <div key={event.id} className="bg-white rounded-2xl border border-border p-5 flex flex-col sm:flex-row sm:items-start gap-4">
                    <div className="w-14 h-14 bg-primary/10 rounded-xl flex flex-col items-center justify-center text-primary shrink-0 text-center">
                      <div className="text-xs font-semibold uppercase">{new Date(event.date).toLocaleDateString("en-US", { month: "short" })}</div>
                      <div className="text-xl font-bold leading-none">{new Date(event.date).getDate()}</div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h4 className="font-semibold text-secondary">{event.title}</h4>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${catColors[event.category] ?? "bg-gray-100 text-gray-700"}`}>{event.category}</span>
                        {event.isRecurring && <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">Recurring</span>}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2 line-clamp-1">{event.description}</p>
                      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{event.time}</span>
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{event.location}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={() => openEdit(event)} className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 flex items-center justify-center transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      {deleteConfirm === event.id ? (
                        <div className="flex gap-1">
                          <button onClick={() => handleDelete(event.id)} className="w-8 h-8 rounded-lg bg-red-500 text-white hover:bg-red-600 flex items-center justify-center transition-colors"><Check className="w-4 h-4" /></button>
                          <button onClick={() => setDeleteConfirm(null)} className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"><X className="w-4 h-4" /></button>
                        </div>
                      ) : (
                        <button onClick={() => setDeleteConfirm(event.id)} className="w-8 h-8 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 flex items-center justify-center transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {filtered.length === 0 && <div className="text-center py-12 text-muted-foreground bg-white rounded-2xl border border-border">No events found.</div>}
        </div>
      )}

      {view === "monthly" && (
        <div className="bg-white rounded-2xl border border-border p-6">
          <p className="text-center text-muted-foreground py-8">Monthly calendar view — showing all events grouped by date.</p>
          <div className="grid gap-2">
            {filtered.map(event => (
              <div key={event.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                <div className="text-sm font-medium text-muted-foreground w-28 shrink-0">{new Date(event.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</div>
                <div className={`w-2 h-2 rounded-full shrink-0 ${catColors[event.category] ? catColors[event.category].split(" ")[0].replace("bg-", "bg-") : "bg-gray-400"}`} />
                <div className="flex-1 text-sm font-medium text-secondary truncate">{event.title}</div>
                <div className="text-xs text-muted-foreground shrink-0">{event.time}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-border">
              <h3 className="text-lg font-bold text-secondary">{editing ? "Edit Event" : "Add New Event"}</h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                <Label>Event Title *</Label>
                <Input placeholder="Event title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label>Description</Label>
                <textarea rows={2} placeholder="Event description..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full border border-input rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Date *</Label>
                  <Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <Label>Time *</Label>
                  <Input type="time" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} className="rounded-xl" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Location</Label>
                <Input placeholder="Event location" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} className="rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label>Category</Label>
                <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  className="w-full border border-input rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-white">
                  {categories.filter(c => c !== "All").map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isRecurring} onChange={e => setForm(f => ({ ...f, isRecurring: e.target.checked }))} />
                <span className="text-sm font-medium">Recurring event</span>
              </label>
            </div>
            <div className="p-6 border-t border-border flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowModal(false)} className="rounded-xl">Cancel</Button>
              <Button onClick={handleSave} className="rounded-xl" disabled={!form.title.trim() || !form.date || !form.time}>
                {editing ? "Save Changes" : "Add Event"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
