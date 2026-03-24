import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, BookOpen, ChevronDown, ChevronUp, ExternalLink, Search, User, FileText } from "lucide-react";

type PublicUpdate = {
  id: number;
  courseName: string;
  levelName: string;
  sectionName: string;
  weekStart: string;
  weekEnd: string;
  title: string;
  content: string;
  topicsCovered: string;
  homework: string;
  upcomingPlan: string;
  reminders: string;
  attachmentLink: string;
  teacherName: string;
  publishedAt: string | null;
};

const BASE_URL = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

const COURSE_COLORS: Record<string, string> = {
  default:     "from-primary to-accent",
  Hindi:       "from-orange-500 to-amber-400",
  Sanskrit:    "from-amber-600 to-yellow-400",
  Dharma:      "from-rose-600 to-pink-400",
  Telugu:      "from-violet-600 to-purple-400",
  Tamil:       "from-sky-600 to-blue-400",
  Gujarati:    "from-green-600 to-emerald-400",
};

function getCourseGradient(name: string) {
  const key = Object.keys(COURSE_COLORS).find((k) => name.toLowerCase().includes(k.toLowerCase()));
  return COURSE_COLORS[key ?? "default"];
}

function fmt(d: string) {
  const [y, m, day] = d.split("-");
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${months[parseInt(m)-1]} ${parseInt(day)}, ${y}`;
}

export default function WeeklyUpdates() {
  const [updates, setUpdates]         = useState<PublicUpdate[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState("");
  const [expandedId, setExpandedId]   = useState<number | null>(null);
  const [filterCourse, setFilterCourse] = useState("");
  const [filterLevel, setFilterLevel]   = useState("");
  const [search, setSearch]             = useState("");

  useEffect(() => {
    fetch(`${BASE_URL}/api/weekly-updates`)
      .then((r) => r.json())
      .then((data) => { setUpdates(data); setLoading(false); })
      .catch(() => { setError("Could not load updates. Please try again later."); setLoading(false); });
  }, []);

  const uniqueCourses = Array.from(new Set(updates.map((u) => u.courseName))).filter(Boolean);
  const uniqueLevels  = Array.from(new Set(updates.map((u) => u.levelName))).filter(Boolean);

  const displayed = updates.filter((u) => {
    if (filterCourse && u.courseName !== filterCourse) return false;
    if (filterLevel  && u.levelName  !== filterLevel)  return false;
    if (search) {
      const q = search.toLowerCase();
      if (
        !u.title.toLowerCase().includes(q) &&
        !u.content.toLowerCase().includes(q) &&
        !u.courseName.toLowerCase().includes(q) &&
        !u.teacherName.toLowerCase().includes(q)
      ) return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white">
      {/* Hero */}
      <section className="bg-gradient-to-br from-secondary via-secondary/90 to-primary text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-sm font-medium mb-4">
              <BookOpen className="w-4 h-4" /> Class Updates for Parents
            </div>
            <h1 className="text-4xl sm:text-5xl font-display font-bold mb-3 leading-tight">
              Weekly Class Updates
            </h1>
            <p className="text-white/80 text-lg max-w-xl mx-auto">
              Stay informed about what your child is learning, upcoming homework, and class reminders — published every week by our teachers.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Filters */}
      <section className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-border shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 flex flex-wrap gap-3 items-center">
          {/* Search */}
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              className="w-full pl-9 pr-3 py-2 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="Search updates…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="px-3 py-2 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
            value={filterCourse}
            onChange={(e) => setFilterCourse(e.target.value)}
          >
            <option value="">All Courses</option>
            {uniqueCourses.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select
            className="px-3 py-2 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
            value={filterLevel}
            onChange={(e) => setFilterLevel(e.target.value)}
          >
            <option value="">All Levels</option>
            {uniqueLevels.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {displayed.length} update{displayed.length !== 1 ? "s" : ""}
          </span>
        </div>
      </section>

      {/* Content */}
      <section className="max-w-5xl mx-auto px-4 py-10">
        {loading && (
          <div className="flex justify-center items-center py-24 text-muted-foreground">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mr-3" />
            Loading updates…
          </div>
        )}

        {error && (
          <div className="text-center py-16 text-red-500">
            <p className="text-lg font-semibold">{error}</p>
          </div>
        )}

        {!loading && !error && displayed.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-24"
          >
            <FileText className="w-16 h-16 mx-auto text-gray-200 mb-4" />
            <p className="text-xl font-semibold text-secondary mb-2">No updates yet</p>
            <p className="text-muted-foreground">Weekly updates will appear here as teachers publish them.</p>
          </motion.div>
        )}

        <div className="space-y-4">
          {displayed.map((u, i) => {
            const expanded = expandedId === u.id;
            const grad = getCourseGradient(u.courseName);
            return (
              <motion.div
                key={u.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden"
              >
                {/* Coloured top strip */}
                <div className={`h-1.5 bg-gradient-to-r ${grad}`} />

                <button
                  className="w-full text-left px-5 py-4"
                  onClick={() => setExpandedId(expanded ? null : u.id)}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap gap-2 mb-2">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold text-white bg-gradient-to-r ${grad}`}>
                          {u.courseName}
                        </span>
                        {u.levelName && (
                          <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">{u.levelName}</span>
                        )}
                        {u.sectionName && (
                          <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-600">{u.sectionName}</span>
                        )}
                      </div>
                      <h3 className="font-bold text-secondary text-lg leading-tight mb-1">{u.title}</h3>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {fmt(u.weekStart)} – {fmt(u.weekEnd)}
                        </span>
                        {u.teacherName && (
                          <span className="flex items-center gap-1">
                            <User className="w-3.5 h-3.5" />
                            {u.teacherName}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="shrink-0 text-muted-foreground mt-1">
                      {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                  </div>
                </button>

                <AnimatePresence>
                  {expanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <div className="border-t border-border px-5 py-5 space-y-4 bg-amber-50/40">
                        <Section label="Class Highlights" text={u.content} />
                        {u.topicsCovered && <Section label="Topics Covered" text={u.topicsCovered} />}
                        {u.homework && <Section label="Homework" text={u.homework} highlight="yellow" />}
                        {u.upcomingPlan && <Section label="Upcoming Plan" text={u.upcomingPlan} />}
                        {u.reminders && <Section label="Reminders" text={u.reminders} highlight="rose" />}
                        {u.attachmentLink && (
                          <div>
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Reference / Attachment</p>
                            <a
                              href={u.attachmentLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-sm text-primary underline underline-offset-2 hover:text-primary/80"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              Open Reference
                            </a>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function Section({ label, text, highlight }: { label: string; text: string; highlight?: "yellow" | "rose" }) {
  const bg = highlight === "yellow" ? "bg-yellow-50 border-l-4 border-yellow-400 pl-4 rounded-r-xl py-2"
           : highlight === "rose"   ? "bg-rose-50 border-l-4 border-rose-400 pl-4 rounded-r-xl py-2"
           : "";
  return (
    <div className={bg}>
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">{label}</p>
      <p className="text-sm text-secondary whitespace-pre-wrap leading-relaxed">{text}</p>
    </div>
  );
}
