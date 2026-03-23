import { useRef } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  BookOpen, Globe, Heart, Users, Star, Lightbulb,
  CheckCircle2, ArrowRight, Music, Palette, Mic,
  Scroll, Sparkles, ShieldCheck, ChevronDown,
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
  { value: "200+", label: "Enrolled Students" },
  { value: "6",    label: "Languages Taught" },
  { value: "15+",  label: "Years of Service" },
  { value: "50+",  label: "Volunteer Families" },
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

const TESTIMONIALS = [
  {
    quote: "Our daughter came home after her first class humming a shloka. Three years later she is writing full stories in Hindi. The Gurukul truly changed her relationship with our culture.",
    name: "Priya Iyer",
    detail: "Parent of a 4th-year student",
    initials: "PI",
    color: "bg-orange-500",
  },
  {
    quote: "I was worried my son wouldn't connect with Telugu since we rarely speak it at home. The teachers here made it joyful and relevant. He now calls his grandparents in Telugu every week.",
    name: "Suresh Reddy",
    detail: "Parent of a 2nd-year student",
    initials: "SR",
    color: "bg-violet-600",
  },
  {
    quote: "The Gurukul is more than a language class — it is a community. The festivals, the seva activities, the values the children learn here stay with them for life.",
    name: "Meera Patel",
    detail: "Parent of two enrolled children",
    initials: "MP",
    color: "bg-rose-600",
  },
];

export default function ParentsPortal() {
  const programsRef = useRef<HTMLDivElement>(null);

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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <motion.div
                key={t.name}
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
                  <div className={cn("w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0", t.color)}>
                    {t.initials}
                  </div>
                  <div>
                    <div className="font-semibold text-secondary text-sm">{t.name}</div>
                    <div className="text-xs text-muted-foreground">{t.detail}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

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
