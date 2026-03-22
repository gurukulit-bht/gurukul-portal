import { useState, useEffect } from "react";
import { adminApi } from "@/lib/adminApi";
import { Plus, Edit2, Trash2, Check, X, Search, AlertTriangle, RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type InventoryItem = {
  id: number; name: string; category: string; dateProcured: string;
  quantityProcured: number; currentStock: number; reorderLevel: number;
  lastReplenishment: string; vendor: string; remarks: string;
};

const categories = ["All", "Books", "Bags", "Papers", "Supplies"];
const emptyForm: Omit<InventoryItem, "id"> = { name: "", category: "Books", dateProcured: "", quantityProcured: 0, currentStock: 0, reorderLevel: 5, lastReplenishment: "", vendor: "", remarks: "" };

export default function Inventory() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("All");
  const [showLowOnly, setShowLowOnly] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<InventoryItem | null>(null);
  const [form, setForm] = useState<Omit<InventoryItem, "id">>(emptyForm);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [replenishItem, setReplenishItem] = useState<InventoryItem | null>(null);
  const [replenishQty, setReplenishQty] = useState(10);

  useEffect(() => {
    adminApi.inventory.list().then((d) => setItems(d as InventoryItem[])).finally(() => setLoading(false));
  }, []);

  const filtered = items.filter((i) =>
    (filterCat === "All" || i.category === filterCat) &&
    (!showLowOnly || i.currentStock <= i.reorderLevel) &&
    i.name.toLowerCase().includes(search.toLowerCase())
  );
  const lowStockItems = items.filter((i) => i.currentStock <= i.reorderLevel);

  function openAdd() { setEditing(null); setForm(emptyForm); setShowModal(true); }
  function openEdit(item: InventoryItem) {
    setEditing(item);
    setForm({ name: item.name, category: item.category, dateProcured: item.dateProcured, quantityProcured: item.quantityProcured, currentStock: item.currentStock, reorderLevel: item.reorderLevel, lastReplenishment: item.lastReplenishment, vendor: item.vendor, remarks: item.remarks });
    setShowModal(true);
  }

  async function handleSave() {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      if (editing) {
        const updated = await adminApi.inventory.update(editing.id, form);
        setItems((prev) => prev.map((i) => i.id === editing.id ? updated as InventoryItem : i));
      } else {
        const created = await adminApi.inventory.create(form);
        setItems((prev) => [...prev, created as InventoryItem]);
      }
      setShowModal(false);
    } catch { /* silent */ }
    finally { setSaving(false); }
  }

  async function handleDelete(id: number) {
    try {
      await adminApi.inventory.remove(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
      setDeleteConfirm(null);
    } catch { /* silent */ }
  }

  async function handleReplenish() {
    if (!replenishItem || replenishQty <= 0) return;
    setSaving(true);
    try {
      const updated = await adminApi.inventory.replenish(replenishItem.id, replenishQty);
      setItems((prev) => prev.map((i) => i.id === replenishItem.id ? updated as InventoryItem : i));
      setReplenishItem(null); setReplenishQty(10);
    } catch { /* silent */ }
    finally { setSaving(false); }
  }

  function stockLevel(item: InventoryItem) {
    if (item.currentStock === 0) return { label: "Out of Stock", cls: "bg-red-100 text-red-700" };
    if (item.currentStock <= item.reorderLevel) return { label: "Low Stock", cls: "bg-orange-100 text-orange-700" };
    return { label: "In Stock", cls: "bg-green-100 text-green-700" };
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-secondary">Inventory</h2>
          <p className="text-sm text-muted-foreground">{items.length} items • {lowStockItems.length} low stock alerts</p>
        </div>
        <Button onClick={openAdd} className="gap-2 rounded-xl shrink-0">
          <Plus className="w-4 h-4" /> Add Item
        </Button>
      </div>

      {lowStockItems.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-orange-500" />
            <span className="font-semibold text-orange-800 text-sm">Low Stock Alerts ({lowStockItems.length} items)</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {lowStockItems.map((i) => (
              <div key={i.id} className="bg-white border border-orange-200 rounded-xl px-3 py-1.5 text-xs flex items-center gap-2">
                <span className="font-medium text-orange-800">{i.name}</span>
                <span className="text-orange-600">{i.currentStock} left</span>
                <button onClick={() => { setReplenishItem(i); setReplenishQty(10); }} className="text-primary hover:underline font-medium">Replenish</button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search items..." className="pl-9 rounded-xl" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          {categories.map((c) => (
            <button key={c} onClick={() => setFilterCat(c)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filterCat === c ? "bg-primary text-white" : "bg-white border border-border text-muted-foreground hover:border-primary"}`}>{c}</button>
          ))}
          <button onClick={() => setShowLowOnly(!showLowOnly)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 ${showLowOnly ? "bg-orange-500 text-white" : "bg-white border border-border text-muted-foreground hover:border-orange-400"}`}>
            <AlertTriangle className="w-3 h-3" /> Low Stock Only
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-border">
              <tr>
                {["Item Name", "Category", "Procured", "Qty Procured", "Current Stock", "Reorder Level", "Last Replenished", "Vendor", "Status", "Actions"].map((h) => (
                  <th key={h} className="text-left font-semibold text-muted-foreground px-4 py-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && <tr><td colSpan={10} className="text-center py-12 text-muted-foreground">No items found.</td></tr>}
              {filtered.map((item) => {
                const { label, cls } = stockLevel(item);
                return (
                  <tr key={item.id} className={`border-b border-border/50 hover:bg-gray-50 transition-colors ${item.currentStock <= item.reorderLevel ? "bg-orange-50/30" : ""}`}>
                    <td className="px-4 py-3">
                      <div className="font-medium text-secondary">{item.name}</div>
                      {item.remarks && <div className="text-xs text-muted-foreground mt-0.5">{item.remarks}</div>}
                    </td>
                    <td className="px-4 py-3"><span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-md font-medium">{item.category}</span></td>
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{item.dateProcured}</td>
                    <td className="px-4 py-3 text-xs font-medium text-center">{item.quantityProcured}</td>
                    <td className="px-4 py-3"><div className="text-sm font-bold text-secondary text-center">{item.currentStock}</div></td>
                    <td className="px-4 py-3 text-xs text-muted-foreground text-center">{item.reorderLevel}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{item.lastReplenishment}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{item.vendor}</td>
                    <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cls}`}>{label}</span></td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5">
                        <button onClick={() => { setReplenishItem(item); setReplenishQty(10); }} title="Replenish" className="w-7 h-7 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 flex items-center justify-center transition-colors">
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => openEdit(item)} className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 flex items-center justify-center transition-colors">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {deleteConfirm === item.id ? (
                          <div className="flex gap-1">
                            <button onClick={() => handleDelete(item.id)} className="w-7 h-7 rounded-lg bg-red-500 text-white hover:bg-red-600 flex items-center justify-center"><Check className="w-3 h-3" /></button>
                            <button onClick={() => setDeleteConfirm(null)} className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center"><X className="w-3 h-3" /></button>
                          </div>
                        ) : (
                          <button onClick={() => setDeleteConfirm(item.id)} className="w-7 h-7 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 flex items-center justify-center transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {replenishItem && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl">
            <div className="p-6 border-b border-border">
              <h3 className="text-lg font-bold text-secondary">Record Replenishment</h3>
              <p className="text-sm text-muted-foreground mt-1">{replenishItem.name}</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex justify-between text-sm bg-gray-50 rounded-xl p-3">
                <span className="text-muted-foreground">Current Stock</span>
                <span className="font-bold text-secondary">{replenishItem.currentStock}</span>
              </div>
              <div className="space-y-1.5">
                <Label>Quantity to Add</Label>
                <Input type="number" min={1} value={replenishQty} onChange={(e) => setReplenishQty(+e.target.value)} className="rounded-xl" />
              </div>
              <div className="flex justify-between text-sm bg-primary/5 rounded-xl p-3">
                <span className="text-muted-foreground">New Stock After</span>
                <span className="font-bold text-primary">{replenishItem.currentStock + replenishQty}</span>
              </div>
            </div>
            <div className="p-6 border-t border-border flex justify-end gap-3">
              <Button variant="outline" onClick={() => setReplenishItem(null)} className="rounded-xl" disabled={saving}>Cancel</Button>
              <Button onClick={handleReplenish} className="rounded-xl gap-2" disabled={replenishQty <= 0 || saving}>
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Confirm Replenishment
              </Button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-border">
              <h3 className="text-lg font-bold text-secondary">{editing ? "Edit Item" : "Add Inventory Item"}</h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-1.5"><Label>Item Name *</Label><Input placeholder="Item name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="rounded-xl" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Category</Label>
                  <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} className="w-full border border-input rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-ring">
                    {categories.filter((c) => c !== "All").map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5"><Label>Date Procured</Label><Input type="date" value={form.dateProcured} onChange={(e) => setForm((f) => ({ ...f, dateProcured: e.target.value }))} className="rounded-xl" /></div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5"><Label>Qty Procured</Label><Input type="number" min={0} value={form.quantityProcured} onChange={(e) => setForm((f) => ({ ...f, quantityProcured: +e.target.value }))} className="rounded-xl" /></div>
                <div className="space-y-1.5"><Label>Current Stock</Label><Input type="number" min={0} value={form.currentStock} onChange={(e) => setForm((f) => ({ ...f, currentStock: +e.target.value }))} className="rounded-xl" /></div>
                <div className="space-y-1.5"><Label>Reorder Level</Label><Input type="number" min={0} value={form.reorderLevel} onChange={(e) => setForm((f) => ({ ...f, reorderLevel: +e.target.value }))} className="rounded-xl" /></div>
              </div>
              <div className="space-y-1.5"><Label>Vendor / Source</Label><Input placeholder="Vendor name" value={form.vendor} onChange={(e) => setForm((f) => ({ ...f, vendor: e.target.value }))} className="rounded-xl" /></div>
              <div className="space-y-1.5"><Label>Remarks</Label><Input placeholder="Optional notes" value={form.remarks} onChange={(e) => setForm((f) => ({ ...f, remarks: e.target.value }))} className="rounded-xl" /></div>
            </div>
            <div className="p-6 border-t border-border flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowModal(false)} className="rounded-xl" disabled={saving}>Cancel</Button>
              <Button onClick={handleSave} className="rounded-xl gap-2" disabled={!form.name.trim() || saving}>
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {editing ? "Save Changes" : "Add Item"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
