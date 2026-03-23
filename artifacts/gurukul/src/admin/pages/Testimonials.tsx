import { useState, useEffect, useCallback } from "react";
import { adminApi } from "@/lib/adminApi";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, Quote, AlertCircle, CheckCircle2, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Testimonial = {
  id: number;
  name: string;
  detail: string;
  quote: string;
  avatarColor: string;
  isActive: boolean;
  sortOrder: number;
};

type FormState = {
  name: string;
  detail: string;
  quote: string;
  avatarColor: string;
  isActive: boolean;
  sortOrder: number;
};

const EMPTY_FORM: FormState = {
  name: "",
  detail: "",
  quote: "",
  avatarColor: "bg-orange-500",
  isActive: true,
  sortOrder: 0,
};

const COLOR_OPTIONS = [
  { label: "Orange",  value: "bg-orange-500" },
  { label: "Violet",  value: "bg-violet-600" },
  { label: "Rose",    value: "bg-rose-600" },
  { label: "Amber",   value: "bg-amber-600" },
  { label: "Teal",    value: "bg-teal-600" },
  { label: "Sky",     value: "bg-sky-600" },
  { label: "Indigo",  value: "bg-indigo-600" },
  { label: "Green",   value: "bg-green-600" },
];

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export default function Testimonials() {
  const [items, setItems] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [formError, setFormError] = useState("");

  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  const load = useCallback(async () => {
    try {
      const data = await adminApi.testimonials.list() as Testimonial[];
      setItems(data);
    } catch {
      setError("Failed to load testimonials.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const activeCount = items.filter(t => t.isActive).length;

  function openAdd() {
    setEditId(null);
    setForm({ ...EMPTY_FORM, sortOrder: items.length + 1 });
    setFormError("");
    setShowModal(true);
  }

  function openEdit(item: Testimonial) {
    setEditId(item.id);
    setForm({
      name: item.name,
      detail: item.detail,
      quote: item.quote,
      avatarColor: item.avatarColor,
      isActive: item.isActive,
      sortOrder: item.sortOrder,
    });
    setFormError("");
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setFormError("");
  }

  async function handleSave() {
    if (!form.name.trim()) return setFormError("Name is required.");
    if (!form.detail.trim()) return setFormError("Tagline/detail is required.");
    if (!form.quote.trim()) return setFormError("Quote is required.");
    setFormError("");
    setSaving(true);
    try {
      if (editId !== null) {
        const updated = await adminApi.testimonials.update(editId, form) as Testimonial;
        setItems(prev => prev.map(t => t.id === editId ? updated : t));
        showToast("success", "Testimonial updated.");
      } else {
        const created = await adminApi.testimonials.create(form) as Testimonial;
        setItems(prev => [...prev, created]);
        showToast("success", "Testimonial added.");
      }
      closeModal();
    } catch (err: unknown) {
      setFormError((err as Error).message || "Save failed. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    setSaving(true);
    try {
      await adminApi.testimonials.remove(id);
      setItems(prev => prev.filter(t => t.id !== id));
      showToast("success", "Testimonial deleted.");
    } catch {
      showToast("error", "Delete failed.");
    } finally {
      setSaving(false);
      setConfirmDeleteId(null);
    }
  }

  return (
    <div className="space-y-6">

      {/* Toast */}
      {toast && (
        <div className={cn(
          "fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-lg text-sm font-medium transition-all",
          toast.type === "success" ? "bg-green-50 border border-green-200 text-green-800" : "bg-red-50 border border-red-200 text-red-800"
        )}>
          {toast.type === "success" ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-secondary">Parent Testimonials</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            These are displayed on the public Parent Portal page.
            <span className={cn(
              "ml-2 px-2 py-0.5 rounded-full text-xs font-semibold",
              activeCount >= 3 ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
            )}>
              {activeCount} / 3 active
            </span>
          </p>
        </div>
        <Button
          onClick={openAdd}
          disabled={activeCount >= 3}
          title={activeCount >= 3 ? "Deactivate one testimonial before adding a new one" : undefined}
        >
          <Plus className="w-4 h-4 mr-1.5" /> Add Testimonial
        </Button>
      </div>

      {activeCount >= 3 && (
        <div className="flex items-start gap-2 text-sm bg-amber-50 border border-amber-200 text-amber-800 rounded-xl px-4 py-3">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          Maximum of 3 active testimonials reached. Edit an existing one or delete it to add a new one.
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="grid grid-cols-1 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-36 bg-gray-100 animate-pulse rounded-2xl" />
          ))}
        </div>
      )}

      {/* Empty */}
      {!loading && items.length === 0 && (
        <div className="text-center py-20 border-2 border-dashed border-border rounded-2xl">
          <Quote className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-muted-foreground font-medium">No testimonials yet.</p>
          <p className="text-sm text-muted-foreground mt-1">Click "Add Testimonial" to publish the first one.</p>
        </div>
      )}

      {/* List */}
      {!loading && items.length > 0 && (
        <div className="grid grid-cols-1 gap-4">
          {items.map(item => (
            <div
              key={item.id}
              className={cn(
                "bg-white border rounded-2xl p-5 flex gap-4 shadow-sm transition-opacity",
                !item.isActive && "opacity-50"
              )}
            >
              {/* Avatar */}
              <div className={cn("w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0", item.avatarColor)}>
                {getInitials(item.name)}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-secondary text-sm">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.detail}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className={cn(
                      "text-xs px-2 py-0.5 rounded-full font-medium",
                      item.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                    )}>
                      {item.isActive ? "Active" : "Inactive"}
                    </span>
                    <button
                      onClick={() => openEdit(item)}
                      className="p-1.5 text-muted-foreground hover:text-primary rounded-lg hover:bg-primary/10 transition-colors"
                      title="Edit"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    {confirmDeleteId === item.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleDelete(item.id)}
                          disabled={saving}
                          className="text-xs px-2 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDeleteId(item.id)}
                        className="p-1.5 text-muted-foreground hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed line-clamp-3">
                  "{item.quote}"
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h3 className="text-lg font-bold text-secondary">
                {editId !== null ? "Edit Testimonial" : "Add Testimonial"}
              </h3>
              <button onClick={closeModal} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal body */}
            <div className="px-6 py-5 space-y-5">

              {/* Name */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-secondary">
                  Parent's Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Priya Sharma"
                  className="w-full border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
                />
              </div>

              {/* Detail */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-secondary">
                  Tagline <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.detail}
                  onChange={e => setForm(f => ({ ...f, detail: e.target.value }))}
                  placeholder="e.g. Parent of a Hindi student"
                  className="w-full border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
                />
              </div>

              {/* Quote */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-secondary">
                  Testimonial Quote <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={form.quote}
                  onChange={e => setForm(f => ({ ...f, quote: e.target.value }))}
                  rows={4}
                  placeholder="What did this parent say about Gurukul?"
                  className="w-full border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  Keep it modest and authentic. Aim for 1–3 sentences.
                </p>
              </div>

              {/* Avatar color */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-secondary">Avatar Color</label>
                <div className="flex flex-wrap gap-2">
                  {COLOR_OPTIONS.map(c => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, avatarColor: c.value }))}
                      title={c.label}
                      className={cn(
                        "w-8 h-8 rounded-full transition-transform hover:scale-110",
                        c.value,
                        form.avatarColor === c.value && "ring-2 ring-offset-2 ring-secondary scale-110"
                      )}
                    />
                  ))}
                </div>
                {/* Preview */}
                <div className="flex items-center gap-3 mt-1">
                  <div className={cn("w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm", form.avatarColor)}>
                    {form.name ? getInitials(form.name) : "AB"}
                  </div>
                  <span className="text-sm text-muted-foreground">Avatar preview</span>
                </div>
              </div>

              {/* Display order */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-secondary">Display Order</label>
                <input
                  type="number"
                  min={0}
                  value={form.sortOrder}
                  onChange={e => setForm(f => ({ ...f, sortOrder: parseInt(e.target.value) || 0 }))}
                  className="w-24 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
                />
                <p className="text-xs text-muted-foreground">Lower number = shown first.</p>
              </div>

              {/* Active */}
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))}
                  className="w-4 h-4 accent-primary rounded"
                />
                <span className="text-sm font-semibold text-secondary">Show on Parent Portal (active)</span>
              </label>

              {/* Form error */}
              {formError && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2">
                  {formError}
                </p>
              )}
            </div>

            {/* Modal footer */}
            <div className="flex gap-3 px-6 py-4 border-t border-border">
              <Button variant="outline" onClick={closeModal} className="flex-1">Cancel</Button>
              <Button onClick={handleSave} disabled={saving} className="flex-1">
                {saving ? "Saving…" : editId !== null ? "Save Changes" : "Add Testimonial"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
