import { useState, useEffect } from "react";
import { adminApi } from "@/lib/adminApi";
import { Plus, Edit2, Trash2, Check, X, Search, Filter, ToggleLeft, ToggleRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type AdminAnnouncement = {
  id: number; title: string; content: string; category: string;
  publishDate: string; expiryDate: string; isActive: boolean; isUrgent: boolean;
};

const categories = ["All", "Registration", "Event", "Schedule", "Course", "Holiday", "Urgent", "General"];
const emptyForm: Omit<AdminAnnouncement, "id"> = { title: "", content: "", category: "General", publishDate: "", expiryDate: "", isActive: true, isUrgent: false };

export default function AdminAnnouncements() {
  const [items, setItems] = useState<AdminAnnouncement[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<AdminAnnouncement | null>(null);
  const [form, setForm] = useState<Omit<AdminAnnouncement, "id">>(emptyForm);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  useEffect(() => {
    adminApi.announcements.list().then((d) => setItems(d as AdminAnnouncement[])).finally(() => setLoading(false));
  }, []);

  const filtered = items.filter((a) =>
    (filterCat === "All" || a.category === filterCat) &&
    (a.title.toLowerCase().includes(search.toLowerCase()) || a.content.toLowerCase().includes(search.toLowerCase()))
  );

  function openAdd() { setEditing(null); setForm(emptyForm); setShowModal(true); }
  function openEdit(a: AdminAnnouncement) {
    setEditing(a);
    setForm({ title: a.title, content: a.content, category: a.category, publishDate: a.publishDate, expiryDate: a.expiryDate, isActive: a.isActive, isUrgent: a.isUrgent });
    setShowModal(true);
  }

  async function handleSave() {
    if (!form.title.trim() || !form.content.trim() || !form.publishDate || !form.expiryDate) return;
    setSaving(true);
    try {
      if (editing) {
        const updated = await adminApi.announcements.update(editing.id, form);
        setItems((prev) => prev.map((a) => a.id === editing.id ? updated as AdminAnnouncement : a));
      } else {
        const created = await adminApi.announcements.create(form);
        setItems((prev) => [created as AdminAnnouncement, ...prev]);
      }
      setShowModal(false);
    } catch { /* silent */ }
    finally { setSaving(false); }
  }

  async function handleDelete(id: number) {
    try {
      await adminApi.announcements.remove(id);
      setItems((prev) => prev.filter((a) => a.id !== id));
      setDeleteConfirm(null);
    } catch { /* silent */ }
  }

  async function toggleActive(id: number) {
    try {
      const updated = await adminApi.announcements.toggle(id);
      setItems((prev) => prev.map((a) => a.id === id ? updated as AdminAnnouncement : a));
    } catch { /* silent */ }
  }

  const catColors: Record<string, string> = {
    Registration: "bg-blue-100 text-blue-700", Event: "bg-purple-100 text-purple-700",
    Schedule: "bg-green-100 text-green-700", Course: "bg-primary/10 text-primary",
    Holiday: "bg-yellow-100 text-yellow-700", Urgent: "bg-red-100 text-red-700", General: "bg-gray-100 text-gray-600",
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-secondary">Announcements</h2>
          <p className="text-sm text-muted-foreground">{items.filter((a) => a.isActive).length} active of {items.length} total</p>
        </div>
        <Button onClick={openAdd} className="gap-2 rounded-xl shrink-0">
          <Plus className="w-4 h-4" /> Add Announcement
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search announcements..." className="pl-9 rounded-xl" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <Filter className="w-4 h-4 text-muted-foreground" />
          {categories.map((c) => (
            <button key={c} onClick={() => setFilterCat(c)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filterCat === c ? "bg-primary text-white" : "bg-white border border-border text-muted-foreground hover:border-primary"}`}>{c}</button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="bg-white rounded-2xl border border-border p-12 text-center text-muted-foreground">No announcements found.</div>
        )}
        {filtered.map((a) => (
          <div key={a.id} className={`bg-white rounded-2xl border shadow-sm p-5 transition-all ${!a.isActive ? "opacity-60 border-gray-200" : a.isUrgent ? "border-red-200 bg-red-50/30" : "border-border"}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${catColors[a.category] ?? "bg-gray-100 text-gray-600"}`}>{a.category}</span>
                  {a.isUrgent && <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-red-100 text-red-700">URGENT</span>}
                  {!a.isActive && <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-gray-100 text-gray-500">Inactive</span>}
                </div>
                <h3 className="font-semibold text-secondary">{a.title}</h3>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{a.content}</p>
                <div className="text-xs text-muted-foreground mt-2">
                  Published: {a.publishDate} {a.expiryDate && `• Expires: ${a.expiryDate}`}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => toggleActive(a.id)} title={a.isActive ? "Deactivate" : "Activate"} className="text-muted-foreground hover:text-primary transition-colors">
                  {a.isActive ? <ToggleRight className="w-5 h-5 text-green-600" /> : <ToggleLeft className="w-5 h-5" />}
                </button>
                <button onClick={() => openEdit(a)} className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 flex items-center justify-center transition-colors">
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                {deleteConfirm === a.id ? (
                  <div className="flex gap-1">
                    <button onClick={() => handleDelete(a.id)} className="w-7 h-7 rounded-lg bg-red-500 text-white hover:bg-red-600 flex items-center justify-center"><Check className="w-3 h-3" /></button>
                    <button onClick={() => setDeleteConfirm(null)} className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center"><X className="w-3 h-3" /></button>
                  </div>
                ) : (
                  <button onClick={() => setDeleteConfirm(a.id)} className="w-7 h-7 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 flex items-center justify-center transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
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
              <h3 className="text-lg font-bold text-secondary">{editing ? "Edit Announcement" : "Add Announcement"}</h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-1.5"><Label>Title *</Label><Input placeholder="Announcement title" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className="rounded-xl" /></div>
              <div className="space-y-1.5">
                <Label>Content *</Label>
                <textarea rows={3} placeholder="Announcement content" value={form.content} onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))} className="w-full border border-input rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Category</Label>
                  <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} className="w-full border border-input rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-ring">
                    {categories.filter((c) => c !== "All").map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5 flex flex-col gap-2 justify-end">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={form.isUrgent} onChange={(e) => setForm((f) => ({ ...f, isUrgent: e.target.checked }))} className="rounded" />
                    Mark as Urgent
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))} className="rounded" />
                    Active
                  </label>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5"><Label>Publish Date *</Label><Input type="date" value={form.publishDate} onChange={(e) => setForm((f) => ({ ...f, publishDate: e.target.value }))} className="rounded-xl" /></div>
                <div className="space-y-1.5"><Label>Expiry Date *</Label><Input type="date" value={form.expiryDate} onChange={(e) => setForm((f) => ({ ...f, expiryDate: e.target.value }))} className="rounded-xl" /></div>
              </div>
            </div>
            <div className="p-6 border-t border-border flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowModal(false)} className="rounded-xl" disabled={saving}>Cancel</Button>
              <Button onClick={handleSave} className="rounded-xl gap-2" disabled={!form.title.trim() || !form.content.trim() || !form.publishDate || !form.expiryDate || saving}>
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {editing ? "Save Changes" : "Add Announcement"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
