import { motion } from "framer-motion";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Calendar, Bell, Users, BookOpen, ArrowRight, MapPin, Clock } from "lucide-react";
import { useListAnnouncements, useListCourses, useListEvents } from "@workspace/api-client-react";
import { format } from "date-fns";

export default function Home() {
  const { data: courses = [], isLoading: loadingCourses } = useListCourses();
  const { data: announcements = [] } = useListAnnouncements();
  const { data: events = [], isLoading: loadingEvents } = useListEvents();

  const urgentAnnouncements = announcements.filter(a => a.isUrgent).slice(0, 1);
  const upcomingEvents = events.slice(0, 4);

  return (
    <div className="min-h-screen">

      {/* ── Hero ── */}
      <section className="relative pt-20 pb-10 overflow-hidden bg-gradient-to-br from-background via-background to-accent/5">
        <div className="absolute inset-0 z-0 pointer-events-none">
          <img
            src={`${import.meta.env.BASE_URL}images/hero-mandala.png`}
            alt=""
            className="w-full h-full object-cover opacity-10 mix-blend-multiply"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/60 to-transparent" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-5 gap-8 items-center">

            {/* Left: Text */}
            <motion.div
              initial={{ opacity: 0, x: -24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7 }}
              className="lg:col-span-3"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                Admissions open for {new Date().getFullYear()}
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold leading-tight mb-4">
                Rooted in <span className="text-gradient">Tradition</span>,<br />
                Growing in Wisdom.
              </h1>
              <p className="text-base md:text-lg text-muted-foreground mb-6 leading-relaxed max-w-xl">
                Empowering the next generation with cultural knowledge, spiritual values, and a profound understanding of Sanatana Dharma.
              </p>
              <div className="flex flex-wrap gap-3 mb-8">
                <Button size="lg" asChild>
                  <Link href="/parents">Enroll Your Child</Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/courses">Explore Courses</Link>
                </Button>
              </div>

              {/* Quick nav strip */}
              <div className="flex flex-wrap gap-4">
                {[
                  { icon: BookOpen, label: "6 Courses", href: "/courses" },
                  { icon: Calendar, label: "Academic Calendar", href: "/calendar" },
                  { icon: Users, label: "Parents Portal", href: "/parents" },
                ].map(({ icon: Icon, label, href }) => (
                  <Link key={href} href={href}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors font-medium">
                    <Icon className="w-4 h-4 text-primary" />
                    {label}
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                ))}
              </div>
            </motion.div>

            {/* Right: Image + Shloka card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.15 }}
              className="lg:col-span-2 flex flex-col gap-4"
            >
              <div className="relative">
                <div className="absolute -inset-2 bg-gradient-to-tr from-accent/20 to-primary/20 rounded-3xl blur-2xl" />
                <img
                  src={`${import.meta.env.BASE_URL}images/about-temple.png`}
                  alt="Bhartiya Hindu Temple"
                  className="relative z-10 w-full rounded-2xl shadow-xl object-cover aspect-[4/3] border-2 border-white/80"
                />
              </div>

              {/* Shloka card — compact, embedded next to hero */}
              <div className="bg-secondary rounded-2xl px-5 py-4 relative overflow-hidden">
                <div className="absolute inset-0 opacity-10 pointer-events-none">
                  <img src={`${import.meta.env.BASE_URL}images/hero-mandala.png`} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="relative z-10 text-center">
                  <p className="text-sm md:text-base font-display text-white/90 leading-relaxed mb-2" lang="sa">
                    विद्या ददाति विनयं विनयाद्याति पात्रताम् ।<br />
                    पात्रत्वाद्धनमाप्नोति धनाद्धर्मं ततः सुखम् ॥
                  </p>
                  <div className="w-10 h-px bg-accent mx-auto mb-2" />
                  <p className="text-white/60 text-xs italic leading-relaxed">
                    "Knowledge gives humility; humility brings worthiness; from worthiness comes dharma and true happiness."
                  </p>
                  <p className="text-accent/70 text-xs mt-1 font-medium tracking-widest uppercase">— Hitopadesa</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Urgent Announcements Bar ── */}
      {urgentAnnouncements.length > 0 && (
        <div className="bg-destructive text-destructive-foreground py-2.5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-4">
            <Bell className="w-4 h-4 shrink-0 animate-bounce" />
            <p className="flex-1 text-sm truncate">
              <span className="font-bold mr-2">URGENT:</span>
              {urgentAnnouncements[0].title} — {urgentAnnouncements[0].content}
            </p>
            <Link href="/announcements" className="text-xs font-semibold underline underline-offset-4 shrink-0 hover:opacity-80">
              View All
            </Link>
          </div>
        </div>
      )}

      {/* ── Courses + Events side-by-side ── */}
      <section className="py-10 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-8">

            {/* Courses — takes 2/3 width */}
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-2xl font-display font-bold text-secondary">Our Courses</h2>
                  <p className="text-sm text-muted-foreground mt-0.5">Six languages, all age groups, structured levels</p>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/courses">View All</Link>
                </Button>
              </div>

              {loadingCourses ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[1,2,3,4,5,6].map(i => <div key={i} className="h-28 bg-black/5 animate-pulse rounded-2xl" />)}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {courses.map(course => (
                    <Link key={course.id} href="/courses"
                      className="group bg-gray-50 hover:bg-primary/5 border border-border hover:border-primary/30 rounded-2xl p-4 transition-all">
                      <div className="text-2xl mb-2 group-hover:scale-110 transition-transform inline-block">{course.icon}</div>
                      <h3 className="font-bold text-secondary text-sm">{course.name}</h3>
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        <span className="text-xs px-1.5 py-0.5 bg-primary/10 text-primary rounded">{course.ageGroup}</span>
                      </div>
                      <p className="text-muted-foreground text-xs mt-2 line-clamp-2 leading-relaxed">{course.description}</p>
                      <span className="text-primary text-xs font-medium mt-2 flex items-center gap-1 group-hover:gap-2 transition-all">
                        Learn more <ArrowRight className="w-3 h-3" />
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Events — takes 1/3 width */}
            <div className="lg:col-span-1">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-2xl font-display font-bold text-secondary">Upcoming</h2>
                  <p className="text-sm text-muted-foreground mt-0.5">Events & programs</p>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/calendar">Calendar</Link>
                </Button>
              </div>

              <div className="space-y-3">
                {loadingEvents
                  ? [1,2,3].map(i => <div key={i} className="h-20 bg-black/5 animate-pulse rounded-xl" />)
                  : upcomingEvents.map(event => (
                    <div key={event.id} className="flex gap-3 bg-secondary/5 hover:bg-secondary/10 rounded-xl p-3 transition-colors group border border-secondary/10">
                      <div className="w-10 h-10 bg-secondary rounded-xl flex flex-col items-center justify-center text-accent text-center shrink-0">
                        <span className="text-[10px] font-semibold uppercase leading-none">
                          {format(new Date(event.date), "MMM")}
                        </span>
                        <span className="text-base font-bold leading-none">
                          {format(new Date(event.date), "d")}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-semibold text-secondary leading-tight truncate">{event.title}</h4>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                          <Clock className="w-3 h-3" />
                          {event.time}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                          <MapPin className="w-3 h-3" />
                          <span className="truncate">{event.location}</span>
                        </div>
                      </div>
                    </div>
                  ))
                }
              </div>

              {/* Contact info strip */}
              <div className="mt-5 bg-primary/5 border border-primary/15 rounded-2xl p-4 space-y-2">
                <p className="text-xs font-semibold text-secondary uppercase tracking-widest">Contact Us</p>
                <p className="text-sm text-muted-foreground">3671 Hyatts Rd, Powell, OH 43065</p>
                <p className="text-sm text-muted-foreground">(740) 369-0717</p>
                <p className="text-sm text-primary font-medium">gurukul@bhtohio.org</p>
                <Button size="sm" className="w-full mt-2 rounded-xl" asChild>
                  <Link href="/contact">Get In Touch</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Bottom CTA strip ── */}
      <section className="bg-secondary py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-xl font-display font-bold text-accent">Ready to join the Gurukul family?</h3>
              <p className="text-white/70 text-sm mt-1">Enroll today and give your child the gift of cultural heritage.</p>
            </div>
            <div className="flex gap-3 shrink-0">
              <Button asChild className="bg-accent text-secondary hover:bg-accent/90 font-bold">
                <Link href="/parents">Enroll Now</Link>
              </Button>
              <Button variant="outline" asChild className="text-white border-white hover:bg-white hover:text-secondary">
                <Link href="/about">Learn More</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
