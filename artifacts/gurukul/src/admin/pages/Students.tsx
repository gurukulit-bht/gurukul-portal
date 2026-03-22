import { useState, useMemo, useEffect } from "react";
import { adminApi } from "@/lib/adminApi";
import { Search, Download, ChevronUp, ChevronDown, Filter, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Student = {
  id: string; name: string; parentName: string; course: string; level: string;
  timing: string; enrollDate: string; paymentStatus: "Paid" | "Pending" | "Overdue";
  amountDue: number; amountPaid: number; paymentMethod: string; receiptId: string;
};

const coursesList = ["All", "Hindi", "Dharma", "Telugu", "Tamil", "Sanskrit", "Gujarati"];
const paymentStatuses = ["All", "Paid", "Pending", "Overdue"];
const levels = ["All", "Level 1", "Level 2", "Level 3", "Level 4", "Level 5", "Level 6", "Level 7"];

type SortKey = keyof Student;

export default function Students() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCourse, setFilterCourse] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterLevel, setFilterLevel] = useState("All");
  const [sortKey, setSortKey] = useState<SortKey>("id");
  const [sortAsc, setSortAsc] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    adminApi.students.list().then((d) => setStudents(d as Student[])).finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let data = students.filter((s) =>
      (filterCourse === "All" || s.course === filterCourse) &&
      (filterStatus === "All" || s.paymentStatus === filterStatus) &&
      (filterLevel === "All" || s.level === filterLevel) &&
      (s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.parentName.toLowerCase().includes(search.toLowerCase()) ||
        s.id.toLowerCase().includes(search.toLowerCase()))
    );
    data = [...data].sort((a, b) => {
      const av = a[sortKey]; const bv = b[sortKey];
      if (av < bv) return sortAsc ? -1 : 1;
      if (av > bv) return sortAsc ? 1 : -1;
      return 0;
    });
    return data;
  }, [students, search, filterCourse, filterStatus, filterLevel, sortKey, sortAsc]);

  const totalPaid = filtered.filter((s) => s.paymentStatus === "Paid").reduce((a, s) => a + s.amountPaid, 0);
  const totalPending = filtered.filter((s) => s.paymentStatus !== "Paid").reduce((a, s) => a + (s.amountDue - s.amountPaid), 0);
  const totalOverdue = filtered.filter((s) => s.paymentStatus === "Overdue").length;

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortAsc((a) => !a);
    else { setSortKey(key); setSortAsc(true); }
  }

  function SortIcon({ k }: { k: SortKey }) {
    if (sortKey !== k) return null;
    return sortAsc ? <ChevronUp className="w-3 h-3 inline ml-1" /> : <ChevronDown className="w-3 h-3 inline ml-1" />;
  }

  function exportCSV() {
    const headers = ["Student ID", "Name", "Parent Name", "Course", "Level", "Timing", "Enroll Date", "Payment Status", "Amount Due", "Amount Paid", "Method", "Receipt ID"];
    const rows = filtered.map((s) => [s.id, s.name, s.parentName, s.course, s.level, s.timing, s.enrollDate, s.paymentStatus, s.amountDue, s.amountPaid, s.paymentMethod, s.receiptId]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "gurukul-students.csv"; a.click();
  }

  const statusBadge: Record<string, string> = {
    Paid: "bg-green-100 text-green-700", Pending: "bg-orange-100 text-orange-700", Overdue: "bg-red-100 text-red-700",
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-secondary">Students & Payments</h2>
          <p className="text-sm text-muted-foreground">{filtered.length} students shown</p>
        </div>
        <Button variant="outline" onClick={exportCSV} className="gap-2 rounded-xl shrink-0">
          <Download className="w-4 h-4" /> Export CSV
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-border">
          <div className="text-2xl font-bold text-secondary">{filtered.length}</div>
          <div className="text-xs text-muted-foreground mt-1">Total Students</div>
        </div>
        <div className="bg-green-50 p-4 rounded-2xl border border-green-100">
          <div className="text-2xl font-bold text-green-700">${totalPaid.toLocaleString()}</div>
          <div className="text-xs text-green-600 mt-1">Total Collected</div>
        </div>
        <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100">
          <div className="text-2xl font-bold text-orange-700">${totalPending.toLocaleString()}</div>
          <div className="text-xs text-orange-600 mt-1">Pending Amount</div>
        </div>
        <div className="bg-red-50 p-4 rounded-2xl border border-red-100">
          <div className="text-2xl font-bold text-red-700">{totalOverdue}</div>
          <div className="text-xs text-red-600 mt-1">Overdue Accounts</div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search by name, parent, or ID..." className="pl-9 rounded-xl" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className="gap-2 rounded-xl shrink-0">
          <Filter className="w-4 h-4" /> Filters
        </Button>
      </div>

      {showFilters && (
        <div className="bg-white rounded-2xl border border-border p-4 flex flex-wrap gap-4">
          <div className="space-y-1.5 min-w-32">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Course</label>
            <div className="flex flex-wrap gap-1">
              {coursesList.map((c) => (
                <button key={c} onClick={() => setFilterCourse(c)} className={`px-2 py-1 rounded-lg text-xs font-medium transition-colors ${filterCourse === c ? "bg-primary text-white" : "bg-gray-100 text-muted-foreground hover:bg-gray-200"}`}>{c}</button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Payment Status</label>
            <div className="flex flex-wrap gap-1">
              {paymentStatuses.map((s) => (
                <button key={s} onClick={() => setFilterStatus(s)} className={`px-2 py-1 rounded-lg text-xs font-medium transition-colors ${filterStatus === s ? "bg-primary text-white" : "bg-gray-100 text-muted-foreground hover:bg-gray-200"}`}>{s}</button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Level</label>
            <div className="flex flex-wrap gap-1">
              {levels.map((l) => (
                <button key={l} onClick={() => setFilterLevel(l)} className={`px-2 py-1 rounded-lg text-xs font-medium transition-colors ${filterLevel === l ? "bg-primary text-white" : "bg-gray-100 text-muted-foreground hover:bg-gray-200"}`}>{l}</button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-border">
              <tr>
                {[
                  { label: "Student ID", key: "id" as SortKey },
                  { label: "Student Name", key: "name" as SortKey },
                  { label: "Parent Name", key: "parentName" as SortKey },
                  { label: "Course", key: "course" as SortKey },
                  { label: "Level", key: "level" as SortKey },
                  { label: "Timing", key: "timing" as SortKey },
                  { label: "Enroll Date", key: "enrollDate" as SortKey },
                  { label: "Status", key: "paymentStatus" as SortKey },
                  { label: "Due", key: "amountDue" as SortKey },
                  { label: "Paid", key: "amountPaid" as SortKey },
                  { label: "Method", key: "paymentMethod" as SortKey },
                  { label: "Receipt", key: "receiptId" as SortKey },
                ].map((col) => (
                  <th key={col.key} onClick={() => toggleSort(col.key)}
                    className="text-left font-semibold text-muted-foreground px-4 py-3 whitespace-nowrap cursor-pointer hover:text-secondary transition-colors select-none">
                    {col.label}<SortIcon k={col.key} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && <tr><td colSpan={12} className="text-center py-12 text-muted-foreground">No students found.</td></tr>}
              {filtered.map((s) => (
                <tr key={s.id} className="border-b border-border/50 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{s.id}</td>
                  <td className="px-4 py-3 font-medium text-secondary whitespace-nowrap">{s.name}</td>
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{s.parentName}</td>
                  <td className="px-4 py-3"><span className="px-2 py-0.5 bg-primary/10 text-primary rounded-md text-xs font-medium">{s.course}</span></td>
                  <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{s.level}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{s.timing}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{s.enrollDate}</td>
                  <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusBadge[s.paymentStatus]}`}>{s.paymentStatus}</span></td>
                  <td className="px-4 py-3 text-xs font-medium">${s.amountDue}</td>
                  <td className="px-4 py-3 text-xs font-medium text-green-700">${s.amountPaid}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{s.paymentMethod}</td>
                  <td className="px-4 py-3 text-xs font-mono text-muted-foreground">{s.receiptId}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
