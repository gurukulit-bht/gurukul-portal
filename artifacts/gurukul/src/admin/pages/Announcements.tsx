import { useState } from "react";
import { mockAdminAnnouncements, AdminAnnouncement } from "../mockData";
import { Plus, Edit2, Trash2, Check, X, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const categories = ["All", "Registration", "Event", "Schedule", "Course", "Holiday", "Urgent", "General"];
const emptyForm: Omit<AdminAnnouncement, "id"> = { title: "", content: "", category: "General", publishDate: "", expiryDate: "", isActive: true, isUrgent: false };

export default function AdminAnnouncements() {
  const [items, setItems] = useState<AdminAnnouncement[]>(mockAdminAnnouncements);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<AdminAnnouncement | null>(null);
  const [form, setForm] = useState<Omit<AdminAnnouncement, "id">>(emptyForm);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  const filtered = items.filter(a =>
    (filterCat === "All" || a.category === filterCat) &&
    (a.title.toLowerCase().includes(search.toLowerCase()) || a.content.toLowerCase().includes(search.toLowerCase()))
  );

  function openAdd() { setEditing(null); setForm(emptyForm); setShowModal(true); }
  function openEdit(a: AdminAnnouncement) { setEditing(a); setForm({ title: a.title, content: a.content, category: a.category, publishDate: a.publishDate, expiryDate: a.expiryDate, isActive: a.isActive, isUrgent: a.isUrgent }); setShowModal(true); }

  function handleSave() {
    if (!form.title.trim() || !form.content.trim() || !form.publishDate || !form.expiryDate) return;
    if (editing) {
      setItems(prev => prev.map(a => a.id === editing.id ? { ...form, id: editing.id } : a));
    } else {
      setItems(prev => [...prev, { ...form, id: Math.max(...prev.map(a => a.id)) + 1 }]);
    }
    setShowModal(false);
  }

  function handleDelete(id: number) { setItems(prev => prev.filter(a => a.id !== id)); setDeleteConfirm(null); }
  function toggleActive(id: number) { setItems(prev => prev.map(a => a.id === id ? { ...a, isActive: !a.isActive } : a)); }

  const catBadge: Record<string, string> = {
    Registration: "bg-blue-100 text-blue-700", Event: "bg-purple-100 text-purple-700",
    Schedule: "bg-green-100 text-green-700", Course: "bg-orange-100 text-orange-700",
    Holiday: "bg-pink-100 text-pink-700", Urgent: "bg-red-100 text-red-700", General: "bg-gray-100 text-gray-700",
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-secondary">Announcements</h2>
          <p className="text-sm text-muted-foreground">{items.length} total • {items.filter(a => a.isActive).length} active</p>
        </div>
        <Button onClick={openAdd} className="gap-2 rounded-xl shrink-0">
          <Plus className="w-4 h-4" /> New Announcement
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search announcements..." className="pl-9 rounded-xl" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
          {categories.map(c => (
            <button key={c} onClick={() => setFilterCat(c)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${filterCat === c ? "bg-primary text-white" : "bg-white border border-border text-muted-foreground hover:border-primary"}`}>
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {filtered.length === 0 && <div className="text-center py-12 text-muted-foreground bg-white rounded-2xl border border-border">No announcements found.</div>}
        {filtered.map(a => (
          <div key={a.id} className={`bg-white rounded-2xl border p-5 transition-all ${a.isActive ? "border-border" : "border-border opacity-60"}`}>
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <h3 className="font-semibold text-secondary truncate">{a.title}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${catBadge[a.category] ?? "bg-gray-100 text-gray-700"}`}>{a.category}</span>
                  {a.isUrgent && <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">URGENT</span>}
                  {!a.isActive && <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">Inactive</span>}
                </div>
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{a.content}</p>
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span>Published: {a.publishDate}</span>
                  <span>Expires: {a.expiryDate}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => toggleActive(a.id)} title={a.isActive ? "Deactivate" : "Activate"}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${a.isActive ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
                  <Check className="w-4 h-4" />
                </button>
                <button onClick={() => openEdit(a)} className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 flex items-center justify-center transition-colors">
                  <Edit2 className="w-4 h-4" />
                </button>
                {deleteConfirm === a.id ? (
                  <div className="flex gap-1">
                    <button onClick={() => handleDelete(a.id)} className="w-8 h-8 rounded-lg bg-red-500 text-white hover:bg-red-600 flex items-center justify-center transition-colors"><Check className="w-4 h-4" /></button>
                    <button onClick={() => setDeleteConfirm(null)} className="w-8 h-8 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 flex items-center justify-center transition-colors"><X className="w-4 h-4" /></button>
                  </div>
                ) : (
                  <button onClick={() => setDeleteConfirm(a.id)} className="w-8 h-8 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 flex items-center justify-center transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-border">
              <h3 className="text-lg font-bold text-secondary">{editing ? "Edit Announcement" : "New Announcement"}</h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                <Label>Title *</Label>
                <Input placeholder="Announcement title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label>Content *</Label>
                <textarea rows={3} placeholder="Announcement content..." value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                  className="w-full border border-input rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Category</Label>
                  <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    className="w-full border border-input rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-white">
                    {categories.filter(c => c !== "All").map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label>Publish Date *</Label>
                  <Input type="date" value={form.publishDate} onChange={e => setForm(f => ({ ...f, publishDate: e.target.value }))} className="rounded-xl" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Expiry Date *</Label>
                <Input type="date" value={form.expiryDate} onChange={e => setForm(f => ({ ...f, expiryDate: e.target.value }))} className="rounded-xl" />
              </div>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} className="rounded" />
                  <span className="text-sm font-medium">Active</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.isUrgent} onChange={e => setForm(f => ({ ...f, isUrgent: e.target.checked }))} className="rounded" />
                  <span className="text-sm font-medium">Mark as Urgent</span>
                </label>
              </div>
            </div>
            <div className="p-6 border-t border-border flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowModal(false)} className="rounded-xl">Cancel</Button>
              <Button onClick={handleSave} className="rounded-xl" disabled={!form.title.trim() || !form.content.trim() || !form.publishDate || !form.expiryDate}>
                {editing ? "Save Changes" : "Add Announcement"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
