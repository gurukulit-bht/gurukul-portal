import { useRef, useState, useEffect } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { CaptchaGate } from "@/components/CaptchaGate";
import {
  BookOpen, Globe, Heart, Users, Star, Lightbulb,
  CheckCircle2, ArrowRight, Music, Palette, Mic,
  Scroll, Sparkles, ShieldCheck, ChevronDown, Lock, Phone,
  Calendar, ChevronUp, User, FileText, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

const REGISTER_HREF = "/register";

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.55, ease: "easeOut" },
  }),
};

const STATS = [
  { value: "800+",         label: "Students Enrolled" },
  { value: "15+",          label: "Years of Service" },
  { value: "Every Sunday", label: "Weekly Classes" },
  { value: "All Ages",     label: "Ages 3–18 Welcome" },
];

const BENEFITS = [
  {
    icon: Globe,
    color: "bg-orange-100 text-orange-600",
    title: "Language Mastery",
    desc: "Children learn to read, write, and speak Hindi, Sanskrit, Telugu, Tamil, or Gujarati — languages that connect them to their heritage.",
  },
  {
    icon: Heart,
    color: "bg-rose-100 text-rose-600",
    title: "Dharma & Values",
    desc: "Teachings rooted in Sanatana Dharma nurture compassion, integrity, and a strong moral compass.",
  },
  {
    icon: Users,
    color: "bg-violet-100 text-violet-600",
    title: "Community & Belonging",
    desc: "Your child will form lifelong friendships with peers who share a common cultural background.",
  },
  {
    icon: Lightbulb,
    color: "bg-amber-100 text-amber-600",
    title: "Cognitive Growth",
    desc: "Sanskrit is scientifically proven to sharpen memory, analytical thinking, and academic performance.",
  },
  {
    icon: Star,
    color: "bg-sky-100 text-sky-600",
    title: "Cultural Identity",
    desc: "Children gain a deep pride in who they are — celebrating festivals, rituals, and traditions with confidence.",
  },
  {
    icon: Sparkles,
    color: "bg-green-100 text-green-600",
    title: "Holistic Development",
    desc: "Creative arts, spiritual practices, and community service shape well-rounded, grounded individuals.",
  },
];

const PROGRAMS = [
  { lang: "Hindi",     emoji: "🇮🇳", desc: "Conversational and literary Hindi for all ages.", color: "border-orange-200 bg-orange-50" },
  { lang: "Sanskrit",  emoji: "📿", desc: "The mother of all languages — shlokas, grammar, and Vedic text.", color: "border-amber-200 bg-amber-50" },
  { lang: "Dharma",    emoji: "🕉️", desc: "Hindu heritage, stories from epics, moral education.", color: "border-rose-200 bg-rose-50" },
  { lang: "Telugu",    emoji: "🌺", desc: "Read, write, and speak Telugu with cultural context.", color: "border-violet-200 bg-violet-50" },
  { lang: "Tamil",     emoji: "🌸", desc: "One of the world's oldest languages, taught with pride.", color: "border-sky-200 bg-sky-50" },
  { lang: "Gujarati",  emoji: "🪁", desc: "Script, conversation, and cultural traditions of Gujarat.", color: "border-green-200 bg-green-50" },
];

const ACTIVITIES = [
  { icon: Scroll,  label: "Shloka & Prayer Recitation",       desc: "Daily opening with Sanskrit shlokas builds focus and spiritual grounding." },
  { icon: Music,   label: "Bhajans & Devotional Songs",        desc: "Children learn classical and devotional music rooted in Indian tradition." },
  { icon: Palette, label: "Festival Celebrations",             desc: "Diwali, Navratri, Holi, Saraswati Puja — celebrated together as a community." },
  { icon: BookOpen,label: "Stories from the Epics",            desc: "Ramayana, Mahabharata, and Puranic stories conveyed with life lessons." },
  { icon: Mic,     label: "Cultural Performances & Skits",     desc: "Annual performances build confidence, expression, and teamwork." },
  { icon: Heart,   label: "Seva & Community Service",          desc: "Children participate in temple service projects, learning selfless giving." },
];

const PILLARS = [
  { no: "01", title: "Language & Literacy",     desc: "Bilingual children demonstrate stronger executive function, memory, and problem-solving skills from an early age." },
  { no: "02", title: "Spiritual Foundation",    desc: "A grounding in Dharma equips children with an ethical framework to navigate life's challenges." },
  { no: "03", title: "Cultural Pride",          desc: "Children who are connected to their heritage show greater self-esteem and resilience in diverse environments." },
  { no: "04", title: "Social Connection",       desc: "A vibrant peer community built around shared values creates friendships that last a lifetime." },
];

type Testimonial = {
  id: number;
  name: string;
  detail: string;
  quote: string;
  avatarColor: string;
};

// ─── Weekly Updates types ─────────────────────────────────────────────────────

type WeeklyUpdate = {
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
};

function fmtDate(d: string) {
  const [y, m, day] = d.split("-");
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${months[parseInt(m)-1]} ${parseInt(day)}, ${y}`;
}

const COURSE_COLORS: Record<string, string> = {
  default:  "from-primary to-accent",
  Hindi:    "from-orange-500 to-amber-400",
  Sanskrit: "from-amber-600 to-yellow-400",
  Dharma:   "from-rose-600 to-pink-400",
  Telugu:   "from-violet-600 to-purple-400",
  Tamil:    "from-sky-600 to-blue-400",
  Gujarati: "from-green-600 to-emerald-400",
};

function getCourseGrad(name: string) {
  const key = Object.keys(COURSE_COLORS).find((k) => name.toLowerCase().includes(k.toLowerCase()));
  return COURSE_COLORS[key ?? "default"];
}

// ─── Gated Weekly Updates section ────────────────────────────────────────────

type GatePhase = "locked" | "captcha" | "phone" | "unlocked";

function WeeklyUpdatesSection() {
  const [phase, setPhase]         = useState<GatePhase>("locked");
  const [phone, setPhone]         = useState("");
  const [phoneErr, setPhoneErr]   = useState("");
  const [verifying, setVerifying] = useState(false);
  const [memberName, setMemberName] = useState("");
  const [updates, setUpdates]     = useState<WeeklyUpdate[]>([]);
  const [loadingUpdates, setLoadingUpdates] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [filterCourse, setFilterCourse] = useState("");

  async function verifyPhone() {
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 10) {
      setPhoneErr("Please enter a valid 10-digit phone number.");
      return;
    }
    setVerifying(true);
    setPhoneErr("");
    try {
      const res  = await fetch("/api/admin/members/lookup", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ emailOrPhone: phone.trim() }),
      });
      if (!res.ok) throw new Error("not found");
      const data = await res.json();
      setMemberName(data.name ?? "");
      await fetchUpdates();
      setPhase("unlocked");
    } catch {
      setPhoneErr("We couldn't find a member with that phone number. Please check and try again.");
    } finally {
      setVerifying(false);
    }
  }

  async function fetchUpdates() {
    setLoadingUpdates(true);
    try {
      const res  = await fetch("/api/weekly-updates");
      const data = await res.json();
      setUpdates(Array.isArray(data) ? data : []);
    } catch {
      setUpdates([]);
    } finally {
      setLoadingUpdates(false);
    }
  }

  const uniqueCourses = Array.from(new Set(updates.map((u) => u.courseName))).filter(Boolean);
  const displayed = filterCourse ? updates.filter((u) => u.courseName === filterCourse) : updates;

  return (
    <section className="py-20 px-4 bg-gradient-to-b from-white to-amber-50/40">
      <div className="max-w-4xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-10">
          <p className="text-primary font-semibold uppercase tracking-widest text-sm mb-3">Member Access</p>
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-secondary">Weekly Class Updates</h2>
          <p className="text-muted-foreground mt-3 max-w-xl mx-auto text-sm">
            Stay informed about what your child is learning — class highlights, homework, and upcoming plans,
            posted every week by our teachers.
          </p>
        </div>

        <AnimatePresence mode="wait">

          {/* ── LOCKED ── */}
          {phase === "locked" && (
            <motion.div key="locked" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="max-w-sm mx-auto">
              <div className="bg-white rounded-3xl border-2 border-dashed border-amber-200 shadow-sm overflow-hidden">
                <div className="bg-gradient-to-br from-secondary to-secondary/80 px-8 py-8 text-center">
                  <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Lock className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-display font-bold text-white mb-1">Members Only</h3>
                  <p className="text-white/60 text-sm">Verify your temple membership to view class updates.</p>
                </div>
                <div className="px-8 py-6 space-y-3 text-sm text-muted-foreground">
                  <div className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" /><span>Weekly class summaries from teachers</span></div>
                  <div className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" /><span>Homework & upcoming topics</span></div>
                  <div className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" /><span>Important class reminders</span></div>
                </div>
                <div className="px-8 pb-7">
                  <Button className="w-full" onClick={() => setPhase("captcha")}>
                    Access Class Updates <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── CAPTCHA ── */}
          {phase === "captcha" && (
            <motion.div key="captcha" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <CaptchaGate
                subtitle="Solve the quick puzzle to continue."
                onVerified={() => setPhase("phone")}
              />
            </motion.div>
          )}

          {/* ── PHONE VERIFY ── */}
          {phase === "phone" && (
            <motion.div key="phone" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="max-w-sm mx-auto">
              <div className="bg-white rounded-3xl border border-border shadow-md overflow-hidden">
                <div className="bg-secondary px-8 py-7 text-center">
                  <div className="w-14 h-14 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Phone className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="text-xl font-display font-bold text-white">Verify Membership</h3>
                  <p className="text-white/60 text-sm mt-1">Enter the phone number registered with your temple membership.</p>
                </div>
                <div className="px-8 py-7 space-y-5">
                  <div>
                    <label className="text-sm font-semibold text-secondary block mb-2">Registered Phone Number</label>
                    <input
                      type="tel"
                      className="w-full border border-border rounded-xl px-4 py-3 text-center text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                      placeholder="(614) 555-0100"
                      value={phone}
                      onChange={(e) => { setPhone(e.target.value); setPhoneErr(""); }}
                      onKeyDown={(e) => e.key === "Enter" && verifyPhone()}
                      autoFocus
                    />
                    {phoneErr && <p className="text-sm text-red-500 text-center mt-2 font-medium">{phoneErr}</p>}
                  </div>
                  <Button className="w-full" onClick={verifyPhone} disabled={verifying || !phone.trim()}>
                    {verifying ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Verifying…</> : <>Verify &amp; View Updates <ArrowRight className="ml-2 w-4 h-4" /></>}
                  </Button>
                  <p className="text-xs text-center text-muted-foreground">Not a member yet?{" "}
                    <Link href="/register" className="text-primary underline underline-offset-2">Register your child</Link> to become one.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── UNLOCKED ── */}
          {phase === "unlocked" && (
            <motion.div key="unlocked" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              {/* Welcome bar */}
              <div className="flex items-center justify-between flex-wrap gap-3 mb-6 bg-green-50 border border-green-200 rounded-2xl px-5 py-3">
                <div className="flex items-center gap-2 text-green-700 text-sm font-semibold">
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  {memberName ? `Welcome, ${memberName}!` : "Membership verified"} — showing class updates for your family.
                </div>
                <button className="text-xs text-muted-foreground underline underline-offset-2 hover:text-secondary transition-colors"
                  onClick={() => { setPhase("locked"); setPhone(""); setPhoneErr(""); setMemberName(""); }}>
                  Sign out
                </button>
              </div>

              {loadingUpdates ? (
                <div className="flex justify-center items-center py-16 text-muted-foreground">
                  <Loader2 className="w-6 h-6 animate-spin mr-2" />Loading updates…
                </div>
              ) : updates.length === 0 ? (
                <div className="text-center py-16">
                  <FileText className="w-14 h-14 mx-auto text-gray-200 mb-4" />
                  <p className="text-lg font-semibold text-secondary mb-1">No updates yet</p>
                  <p className="text-sm text-muted-foreground">Weekly updates will appear here as teachers publish them each week.</p>
                </div>
              ) : (
                <>
                  {/* Filter bar */}
                  {uniqueCourses.length > 1 && (
                    <div className="flex items-center gap-3 mb-5 flex-wrap">
                      <span className="text-sm font-medium text-muted-foreground">Filter by course:</span>
                      {["", ...uniqueCourses].map((c) => (
                        <button key={c || "all"} onClick={() => setFilterCourse(c)}
                          className={cn("px-3 py-1 rounded-full text-sm font-medium border transition-all",
                            filterCourse === c ? "bg-primary text-white border-primary" : "bg-white border-border text-muted-foreground hover:border-primary/50")}>
                          {c || "All Courses"}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Update cards */}
                  <div className="space-y-3">
                    {displayed.map((u, i) => {
                      const expanded = expandedId === u.id;
                      const grad = getCourseGrad(u.courseName);
                      return (
                        <motion.div key={u.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.04 }}
                          className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
                          <div className={`h-1.5 bg-gradient-to-r ${grad}`} />
                          <button className="w-full text-left px-5 py-4" onClick={() => setExpandedId(expanded ? null : u.id)}>
                            <div className="flex items-start gap-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap gap-2 mb-1.5">
                                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold text-white bg-gradient-to-r ${grad}`}>{u.courseName}</span>
                                  {u.levelName   && <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">{u.levelName}</span>}
                                  {u.sectionName && <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-600">{u.sectionName}</span>}
                                </div>
                                <h3 className="font-bold text-secondary text-base leading-snug mb-1">{u.title}</h3>
                                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                                  <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{fmtDate(u.weekStart)} – {fmtDate(u.weekEnd)}</span>
                                  {u.teacherName && <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" />{u.teacherName}</span>}
                                </div>
                              </div>
                              <div className="shrink-0 text-muted-foreground mt-1">
                                {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                              </div>
                            </div>
                          </button>

                          <AnimatePresence>
                            {expanded && (
                              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22 }} className="overflow-hidden">
                                <div className="border-t border-border px-5 py-5 bg-amber-50/40 space-y-4">
                                  <UpdateSection label="Class Highlights" text={u.content} />
                                  {u.topicsCovered && <UpdateSection label="Topics Covered" text={u.topicsCovered} />}
                                  {u.homework     && <UpdateSection label="Homework" text={u.homework} highlight="yellow" />}
                                  {u.upcomingPlan && <UpdateSection label="Upcoming Plan" text={u.upcomingPlan} />}
                                  {u.reminders    && <UpdateSection label="Reminders" text={u.reminders} highlight="rose" />}
                                  {u.attachmentLink && (
                                    <div>
                                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Reference / Attachment</p>
                                      <a href={u.attachmentLink} target="_blank" rel="noopener noreferrer"
                                        className="text-sm text-primary underline underline-offset-2 break-all"
                                        onClick={(e) => e.stopPropagation()}>
                                        {u.attachmentLink}
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
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

function UpdateSection({ label, text, highlight }: { label: string; text: string; highlight?: "yellow" | "rose" }) {
  const cls = highlight === "yellow" ? "bg-yellow-50 border-l-4 border-yellow-400 pl-4 rounded-r-xl py-2"
            : highlight === "rose"   ? "bg-rose-50 border-l-4 border-rose-400 pl-4 rounded-r-xl py-2"
            : "";
  return (
    <div className={cls}>
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">{label}</p>
      <p className="text-sm text-secondary whitespace-pre-wrap leading-relaxed">{text}</p>
    </div>
  );
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export default function ParentsPortal() {
  const programsRef = useRef<HTMLDivElement>(null);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [testimonialsLoading, setTestimonialsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/testimonials")
      .then(r => r.ok ? r.json() : [])
      .then(data => setTestimonials(Array.isArray(data) ? data : []))
      .catch(() => setTestimonials([]))
      .finally(() => setTestimonialsLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section className="relative bg-secondary text-white min-h-[92vh] flex flex-col justify-center items-center text-center px-4 overflow-hidden">
        {/* Dot grid overlay */}
        <div className="absolute inset-0 opacity-[0.06]"
          style={{ backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)", backgroundSize: "28px 28px" }} />
        {/* Warm glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[640px] h-[440px] rounded-full bg-primary/10 blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-accent/10 blur-[120px] pointer-events-none" />

        <motion.div
          initial="hidden"
          animate="visible"
          className="relative max-w-3xl mx-auto space-y-6"
        >
          {/* Om mark */}
          <motion.div variants={fadeUp} custom={0}
            className="text-6xl sm:text-7xl text-primary/80 select-none mb-2">
            ॐ
          </motion.div>

          <motion.p variants={fadeUp} custom={1}
            className="text-primary font-semibold tracking-widest uppercase text-sm">
            Bhartiya Hindu Temple Gurukul · Powell, OH
          </motion.p>

          <motion.h1 variants={fadeUp} custom={2}
            className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold leading-tight">
            Nurture Your Child's{" "}
            <span className="text-primary">Heritage</span>{" "}
            &amp; Identity
          </motion.h1>

          <motion.p variants={fadeUp} custom={3}
            className="text-white/70 text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed">
            Give your child the extraordinary gift of language, culture, and Dharma.
            Classes in Hindi, Sanskrit, Dharma, Telugu, Tamil, and Gujarati — taught
            by dedicated educators in a warm, family-centred community.
          </motion.p>

          <motion.div variants={fadeUp} custom={4}
            className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
            <Link href={REGISTER_HREF}>
              <Button size="lg"
                className="bg-primary hover:bg-primary/90 text-white px-8 py-6 text-base font-semibold rounded-full shadow-lg shadow-primary/30 hover:shadow-xl transition-all">
                Register Now <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Button
              size="lg"
              variant="outline"
              className="border-white/30 text-white hover:bg-white/10 px-8 py-6 text-base font-semibold rounded-full"
              onClick={() => programsRef.current?.scrollIntoView({ behavior: "smooth" })}
            >
              Explore Programs <ChevronDown className="ml-2 w-5 h-5" />
            </Button>
          </motion.div>
        </motion.div>

        {/* Stats bar */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="relative mt-16 grid grid-cols-2 sm:grid-cols-4 gap-px bg-white/10 rounded-2xl overflow-hidden max-w-2xl w-full mx-auto"
        >
          {STATS.map(s => (
            <div key={s.label} className="bg-white/5 backdrop-blur-sm px-4 py-5 text-center">
              <div className="text-2xl sm:text-3xl font-display font-bold text-primary">{s.value}</div>
              <div className="text-xs text-white/60 mt-1 font-medium">{s.label}</div>
            </div>
          ))}
        </motion.div>
      </section>

      {/* ── BENEFITS ─────────────────────────────────────────────────── */}
      <section className="py-20 px-4 bg-amber-50/50">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            className="text-center mb-14"
          >
            <motion.p variants={fadeUp} custom={0}
              className="text-primary font-semibold uppercase tracking-widest text-sm mb-3">
              Why Families Choose Us
            </motion.p>
            <motion.h2 variants={fadeUp} custom={1}
              className="text-3xl sm:text-4xl font-display font-bold text-secondary">
              What Your Child Gains at Gurukul
            </motion.h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {BENEFITS.map((b, i) => (
              <motion.div
                key={b.title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-60px" }}
                custom={i * 0.08}
                variants={fadeUp}
                className="bg-white rounded-2xl p-6 border border-border/50 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center mb-4", b.color)}>
                  <b.icon className="w-6 h-6" />
                </div>
                <h3 className="font-display font-bold text-secondary text-lg mb-2">{b.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{b.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PROGRAMS ─────────────────────────────────────────────────── */}
      <section ref={programsRef} className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            className="text-center mb-14"
          >
            <motion.p variants={fadeUp} custom={0}
              className="text-primary font-semibold uppercase tracking-widest text-sm mb-3">
              Our Curriculum
            </motion.p>
            <motion.h2 variants={fadeUp} custom={1}
              className="text-3xl sm:text-4xl font-display font-bold text-secondary">
              Six Languages, One Community
            </motion.h2>
            <motion.p variants={fadeUp} custom={2}
              className="text-muted-foreground mt-3 max-w-xl mx-auto">
              All programs are structured across multiple levels, designed for children ages 3–18,
              and taught by experienced, passionate educators.
            </motion.p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {PROGRAMS.map((p, i) => (
              <motion.div
                key={p.lang}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-60px" }}
                custom={i * 0.08}
                variants={fadeUp}
                className={cn("rounded-2xl p-6 border-2 hover:shadow-md transition-all group", p.color)}
              >
                <div className="text-4xl mb-4">{p.emoji}</div>
                <h3 className="font-display font-bold text-secondary text-xl mb-2 group-hover:text-primary transition-colors">
                  {p.lang}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{p.desc}</p>
                <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-primary/70">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Multiple levels · All ages
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ACTIVITIES ───────────────────────────────────────────────── */}
      <section className="py-20 px-4 bg-secondary text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)", backgroundSize: "24px 24px" }} />
        <div className="absolute top-0 right-0 text-[20rem] leading-none font-display font-bold opacity-[0.03] select-none pointer-events-none">
          ॐ
        </div>

        <div className="relative max-w-6xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            className="text-center mb-14"
          >
            <motion.p variants={fadeUp} custom={0}
              className="text-primary font-semibold uppercase tracking-widest text-sm mb-3">
              Life at Gurukul
            </motion.p>
            <motion.h2 variants={fadeUp} custom={1}
              className="text-3xl sm:text-4xl font-display font-bold">
              What Your Child Will Experience
            </motion.h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {ACTIVITIES.map((a, i) => (
              <motion.div
                key={a.label}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-60px" }}
                custom={i * 0.08}
                variants={fadeUp}
                className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-colors"
              >
                <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center mb-4">
                  <a.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-display font-bold text-white text-base mb-2">{a.label}</h3>
                <p className="text-white/60 text-sm leading-relaxed">{a.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CHILD DEVELOPMENT ────────────────────────────────────────── */}
      <section className="py-20 px-4 bg-gradient-to-b from-amber-50/40 to-white">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            className="text-center mb-14"
          >
            <motion.p variants={fadeUp} custom={0}
              className="text-primary font-semibold uppercase tracking-widest text-sm mb-3">
              Holistic Growth
            </motion.p>
            <motion.h2 variants={fadeUp} custom={1}
              className="text-3xl sm:text-4xl font-display font-bold text-secondary">
              The Gurukul Difference in Your Child's Development
            </motion.h2>
            <motion.p variants={fadeUp} custom={2}
              className="text-muted-foreground mt-3 max-w-xl mx-auto">
              Research consistently shows that children connected to their heritage language
              and culture thrive academically, socially, and emotionally.
            </motion.p>
          </motion.div>

          <div className="space-y-5">
            {PILLARS.map((p, i) => (
              <motion.div
                key={p.no}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-40px" }}
                custom={i * 0.1}
                variants={fadeUp}
                className="flex gap-6 items-start bg-white border border-border/60 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="text-4xl font-display font-bold text-primary/20 shrink-0 leading-none mt-1 w-12 text-right">
                  {p.no}
                </div>
                <div>
                  <h3 className="font-display font-bold text-secondary text-lg mb-1">{p.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{p.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ─────────────────────────────────────────────── */}
      {(testimonialsLoading || testimonials.length > 0) && (
        <section className="py-20 px-4 bg-white">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
              className="text-center mb-14"
            >
              <motion.p variants={fadeUp} custom={0}
                className="text-primary font-semibold uppercase tracking-widest text-sm mb-3">
                From Our Families
              </motion.p>
              <motion.h2 variants={fadeUp} custom={1}
                className="text-3xl sm:text-4xl font-display font-bold text-secondary">
                What Parents Are Saying
              </motion.h2>
            </motion.div>

            {/* Loading skeleton */}
            {testimonialsLoading && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-amber-50/60 border border-amber-100 rounded-2xl p-7 space-y-4 animate-pulse">
                    <div className="h-4 bg-amber-200/60 rounded w-3/4" />
                    <div className="h-4 bg-amber-200/60 rounded w-full" />
                    <div className="h-4 bg-amber-200/60 rounded w-5/6" />
                    <div className="flex items-center gap-3 mt-4">
                      <div className="w-10 h-10 rounded-full bg-amber-200/60" />
                      <div className="space-y-1.5">
                        <div className="h-3 bg-amber-200/60 rounded w-24" />
                        <div className="h-2.5 bg-amber-200/60 rounded w-32" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Live testimonials */}
            {!testimonialsLoading && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {testimonials.map((t, i) => (
                  <motion.div
                    key={t.id}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-60px" }}
                    custom={i * 0.1}
                    variants={fadeUp}
                    className="bg-amber-50/60 border border-amber-100 rounded-2xl p-7 flex flex-col gap-5"
                  >
                    <div className="text-3xl text-primary/40 font-serif leading-none">"</div>
                    <p className="text-secondary/80 text-sm leading-relaxed flex-1 -mt-4">{t.quote}</p>
                    <div className="flex items-center gap-3">
                      <div className={cn("w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0", t.avatarColor)}>
                        {getInitials(t.name)}
                      </div>
                      <div>
                        <div className="font-semibold text-secondary text-sm">{t.name}</div>
                        <div className="text-xs text-muted-foreground">{t.detail}</div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── WEEKLY UPDATES ───────────────────────────────────────────── */}
      <WeeklyUpdatesSection />

      {/* ── CTA BANNER ───────────────────────────────────────────────── */}
      <section className="py-20 px-4 bg-gradient-to-br from-secondary via-secondary to-secondary/90 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.06]"
          style={{ backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)", backgroundSize: "28px 28px" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-primary/10 rounded-full blur-[80px] pointer-events-none" />

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="relative max-w-2xl mx-auto text-center space-y-6"
        >
          <motion.div variants={fadeUp} custom={0} className="text-5xl select-none">ॐ</motion.div>
          <motion.h2 variants={fadeUp} custom={1}
            className="text-3xl sm:text-4xl font-display font-bold leading-tight">
            Ready to Begin Your Child's Journey?
          </motion.h2>
          <motion.p variants={fadeUp} custom={2} className="text-white/70 text-lg">
            Enrollment for the 2026–27 academic year is open. Seats are limited
            — secure your child's place today.
          </motion.p>
          <motion.div variants={fadeUp} custom={3} className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href={REGISTER_HREF}>
              <Button size="lg"
                className="bg-primary hover:bg-primary/90 text-white px-10 py-6 text-base font-semibold rounded-full shadow-lg shadow-primary/30 hover:shadow-xl transition-all">
                Register Now <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline"
                className="border-white/30 text-white hover:bg-white/10 px-10 py-6 text-base font-semibold rounded-full">
                Contact Us
              </Button>
            </Link>
          </motion.div>
          <motion.div variants={fadeUp} custom={4}
            className="flex items-center justify-center gap-2 text-white/50 text-sm pt-2">
            <ShieldCheck className="w-4 h-4 text-green-400" />
            Secure registration · $150 annual temple membership · Classes every Sunday
          </motion.div>
        </motion.div>
      </section>

    </div>
  );
}
