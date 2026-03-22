import { useState, useMemo } from "react";
import { FileText, Download, Eye, Filter, Search, BookOpen, FileSpreadsheet, BookMarked, ClipboardList } from "lucide-react";
import { useListCourses } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

type Doc = {
  id: number;
  title: string;
  type: "Syllabus" | "Worksheet" | "Assignment" | "Reading Material" | "Assessment";
  course: string;
  level: string;
  fileType: "PDF" | "DOCX" | "XLSX";
  size: string;
  uploadedBy: string;
  uploadedOn: string;
};

const MOCK_DOCS: Doc[] = [
  { id: 1,  title: "Hindi Level 1 – Full Syllabus AY 2025-26",      type: "Syllabus",          course: "Hindi",     level: "Level 1", fileType: "PDF",  size: "1.2 MB", uploadedBy: "Smt. Lakshmi Iyer",   uploadedOn: "2025-08-01" },
  { id: 2,  title: "Hindi Level 1 – Devanagari Alphabet Worksheet",  type: "Worksheet",         course: "Hindi",     level: "Level 1", fileType: "PDF",  size: "850 KB", uploadedBy: "Smt. Lakshmi Iyer",   uploadedOn: "2025-09-10" },
  { id: 3,  title: "Hindi Level 2 – Full Syllabus AY 2025-26",      type: "Syllabus",          course: "Hindi",     level: "Level 2", fileType: "PDF",  size: "1.4 MB", uploadedBy: "Smt. Lakshmi Iyer",   uploadedOn: "2025-08-01" },
  { id: 4,  title: "Hindi Level 2 – Vocabulary Building Assignment", type: "Assignment",        course: "Hindi",     level: "Level 2", fileType: "DOCX", size: "320 KB", uploadedBy: "Smt. Lakshmi Iyer",   uploadedOn: "2025-10-05" },
  { id: 5,  title: "Dharma Level 1 – Syllabus & Shloka List",       type: "Syllabus",          course: "Dharma",    level: "Level 1", fileType: "PDF",  size: "980 KB", uploadedBy: "Sri Ramesh Nair",      uploadedOn: "2025-08-03" },
  { id: 6,  title: "Dharma – Ramayana Reading Guide",                type: "Reading Material",  course: "Dharma",    level: "Level 1", fileType: "PDF",  size: "2.1 MB", uploadedBy: "Sri Ramesh Nair",      uploadedOn: "2025-09-20" },
  { id: 7,  title: "Dharma – Values & Ethics Worksheet",             type: "Worksheet",         course: "Dharma",    level: "Level 2", fileType: "DOCX", size: "410 KB", uploadedBy: "Sri Ramesh Nair",      uploadedOn: "2025-11-01" },
  { id: 8,  title: "Telugu Level 1 – Varnamala Syllabus",           type: "Syllabus",          course: "Telugu",    level: "Level 1", fileType: "PDF",  size: "1.1 MB", uploadedBy: "Sri Venkat Rao",       uploadedOn: "2025-08-05" },
  { id: 9,  title: "Telugu – Akshara Worksheet Set 1",              type: "Worksheet",         course: "Telugu",    level: "Level 1", fileType: "PDF",  size: "730 KB", uploadedBy: "Sri Venkat Rao",       uploadedOn: "2025-09-15" },
  { id: 10, title: "Tamil Level 1 – Tamil Alphabet Chart",          type: "Reading Material",  course: "Tamil",     level: "Level 1", fileType: "PDF",  size: "1.5 MB", uploadedBy: "Smt. Meenakshi Rajan", uploadedOn: "2025-08-10" },
  { id: 11, title: "Tamil – Conversational Tamil Worksheet",        type: "Worksheet",         course: "Tamil",     level: "Level 2", fileType: "DOCX", size: "520 KB", uploadedBy: "Smt. Meenakshi Rajan", uploadedOn: "2025-10-22" },
  { id: 12, title: "Sanskrit Level 1 – Devanagari & Grammar",       type: "Syllabus",          course: "Sanskrit",  level: "Level 1", fileType: "PDF",  size: "1.6 MB", uploadedBy: "Smt. Lakshmi Iyer",   uploadedOn: "2025-08-02" },
  { id: 13, title: "Sanskrit – Shloka Practice Assignment",         type: "Assignment",        course: "Sanskrit",  level: "Level 1", fileType: "DOCX", size: "290 KB", uploadedBy: "Smt. Lakshmi Iyer",   uploadedOn: "2025-11-15" },
  { id: 14, title: "Gujarati Level 1 – Syllbaus AY 2025-26",       type: "Syllabus",          course: "Gujarati",  level: "Level 1", fileType: "PDF",  size: "1.0 MB", uploadedBy: "Sri Ramesh Nair",      uploadedOn: "2025-08-07" },
  { id: 15, title: "Gujarati – Barakhadi Worksheet",                type: "Worksheet",         course: "Gujarati",  level: "Level 1", fileType: "PDF",  size: "660 KB", uploadedBy: "Sri Ramesh Nair",      uploadedOn: "2025-09-28" },
  { id: 16, title: "Hindi Mid-Term Assessment – Level 1 & 2",      type: "Assessment",        course: "Hindi",     level: "All",     fileType: "DOCX", size: "450 KB", uploadedBy: "Gurukul Admin",        uploadedOn: "2025-12-01" },
  { id: 17, title: "Dharma – Annual Assessment Guide",              type: "Assessment",        course: "Dharma",    level: "All",     fileType: "PDF",  size: "710 KB", uploadedBy: "Gurukul Admin",        uploadedOn: "2025-12-03" },
];

const TYPE_ICONS: Record<Doc["type"], React.ElementType> = {
  "Syllabus":          BookOpen,
  "Worksheet":         FileText,
  "Assignment":        ClipboardList,
  "Reading Material":  BookMarked,
  "Assessment":        FileSpreadsheet,
};

const TYPE_COLORS: Record<Doc["type"], string> = {
  "Syllabus":          "bg-blue-100 text-blue-800",
  "Worksheet":         "bg-green-100 text-green-800",
  "Assignment":        "bg-orange-100 text-orange-800",
  "Reading Material":  "bg-purple-100 text-purple-800",
  "Assessment":        "bg-red-100 text-red-800",
};

const FILE_COLORS: Record<Doc["fileType"], string> = {
  PDF:  "bg-red-50 text-red-700 border border-red-200",
  DOCX: "bg-blue-50 text-blue-700 border border-blue-200",
  XLSX: "bg-green-50 text-green-700 border border-green-200",
};

const DOC_TYPES: Doc["type"][] = ["Syllabus", "Worksheet", "Assignment", "Reading Material", "Assessment"];

export default function CourseDocuments() {
  const { data: rawCourses = [] } = useListCourses();
  const courseNames = ["All Courses", ...(rawCourses as { name: string }[]).map(c => c.name)];

  const [selectedCourse, setSelectedCourse] = useState("All Courses");
  const [selectedType, setSelectedType]   = useState<string>("All Types");
  const [search, setSearch]               = useState("");

  const filtered = useMemo(() => {
    return MOCK_DOCS.filter(d => {
      const matchCourse = selectedCourse === "All Courses" || d.course === selectedCourse;
      const matchType   = selectedType   === "All Types"   || d.type   === selectedType;
      const matchSearch = !search || d.title.toLowerCase().includes(search.toLowerCase());
      return matchCourse && matchType && matchSearch;
    });
  }, [selectedCourse, selectedType, search]);

  const stats = useMemo(() => ({
    total:   MOCK_DOCS.length,
    syllabus: MOCK_DOCS.filter(d => d.type === "Syllabus").length,
    worksheets: MOCK_DOCS.filter(d => d.type === "Worksheet").length,
    assignments: MOCK_DOCS.filter(d => d.type === "Assignment" || d.type === "Assessment").length,
  }), []);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Documents", value: stats.total,       color: "text-secondary" },
          { label: "Syllabi",         value: stats.syllabus,    color: "text-blue-600"  },
          { label: "Worksheets",      value: stats.worksheets,  color: "text-green-600" },
          { label: "Assignments",     value: stats.assignments, color: "text-orange-600" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl p-4 shadow-sm border border-border">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-border p-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search documents..."
              className="pl-9 h-9 text-sm"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <select
              value={selectedCourse}
              onChange={e => setSelectedCourse(e.target.value)}
              className="text-sm border border-border rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:border-primary"
            >
              {courseNames.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>

          <select
            value={selectedType}
            onChange={e => setSelectedType(e.target.value)}
            className="text-sm border border-border rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:border-primary"
          >
            <option>All Types</option>
            {DOC_TYPES.map(t => <option key={t}>{t}</option>)}
          </select>

          <span className="text-xs text-muted-foreground ml-auto">
            {filtered.length} document{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Document Grid */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-border">
          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No documents match your filters.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(doc => {
            const Icon = TYPE_ICONS[doc.type];
            return (
              <div key={doc.id} className="bg-white rounded-xl shadow-sm border border-border p-4 flex flex-col gap-3 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center shrink-0 border border-amber-100">
                    <Icon className="w-5 h-5 text-amber-700" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-secondary leading-snug line-clamp-2">{doc.title}</p>
                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${TYPE_COLORS[doc.type]}`}>
                        {doc.type}
                      </span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${FILE_COLORS[doc.fileType]}`}>
                        {doc.fileType}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-xs text-muted-foreground space-y-0.5">
                  <div className="flex justify-between">
                    <span>Course</span>
                    <span className="font-medium text-secondary">{doc.course} – {doc.level}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Size</span>
                    <span className="font-medium">{doc.size}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Uploaded</span>
                    <span className="font-medium">{doc.uploadedOn}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>By</span>
                    <span className="font-medium truncate ml-4">{doc.uploadedBy}</span>
                  </div>
                </div>

                <div className="flex gap-2 pt-1 border-t border-border">
                  <button className="flex-1 flex items-center justify-center gap-1.5 text-xs py-2 rounded-lg border border-border hover:bg-gray-50 transition-colors text-secondary font-medium">
                    <Eye className="w-3.5 h-3.5" />
                    Preview
                  </button>
                  <button className="flex-1 flex items-center justify-center gap-1.5 text-xs py-2 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors text-primary font-medium">
                    <Download className="w-3.5 h-3.5" />
                    Download
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
