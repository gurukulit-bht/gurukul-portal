import { motion } from "framer-motion";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Calendar, Bell, Users, BookOpen, ArrowRight, MapPin } from "lucide-react";
import { useListAnnouncements, useListCourses, useListEvents } from "@workspace/api-client-react";
import { format } from "date-fns";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export default function Home() {
  const { data: courses = [], isLoading: loadingCourses } = useListCourses();
  const { data: announcements = [], isLoading: loadingAnnouncements } = useListAnnouncements();
  const { data: events = [], isLoading: loadingEvents } = useListEvents();

  const urgentAnnouncements = announcements.filter(a => a.isUrgent).slice(0, 2);
  const featuredCourses = courses.slice(0, 4);
  const upcomingEvents = events.slice(0, 3);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center pt-20 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src={`${import.meta.env.BASE_URL}images/hero-mandala.png`} 
            alt="Hero Background" 
            className="w-full h-full object-cover opacity-15 mix-blend-multiply"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/50 to-background" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="max-w-2xl"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-medium mb-6">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                Admissions open for {new Date().getFullYear()}
              </div>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-display font-bold leading-tight mb-6">
                Rooted in <span className="text-gradient">Tradition</span>,<br />
                Growing in Wisdom.
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed">
                Empowering the next generation with cultural knowledge, spiritual values, and a profound understanding of Sanatana Dharma.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button size="lg" asChild>
                  <Link href="/parents">Enroll Your Child</Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/courses">Explore Courses</Link>
                </Button>
              </div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="hidden lg:block relative"
            >
              <div className="aspect-square rounded-full bg-gradient-to-tr from-accent/20 to-primary/20 absolute -inset-4 blur-3xl" />
              <img 
                src={`${import.meta.env.BASE_URL}images/about-temple.png`} 
                alt="Temple" 
                className="relative z-10 w-full h-auto rounded-3xl shadow-2xl object-cover aspect-[4/3] border-4 border-white"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Urgent Announcements Bar */}
      {urgentAnnouncements.length > 0 && (
        <div className="bg-destructive text-destructive-foreground py-3">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-4 overflow-hidden">
            <Bell className="w-5 h-5 shrink-0 animate-bounce" />
            <div className="flex-1 truncate">
              <span className="font-bold mr-2">URGENT:</span>
              {urgentAnnouncements[0].title} - {urgentAnnouncements[0].content}
            </div>
            <Link href="/announcements" className="text-sm font-medium underline underline-offset-4 shrink-0 hover:text-white/80">
              View All
            </Link>
          </div>
        </div>
      )}

      {/* Shloka / Motto Section */}
      <section className="py-16 bg-gradient-to-r from-secondary via-secondary/95 to-secondary relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-10">
          <img src={`${import.meta.env.BASE_URL}images/hero-mandala.png`} alt="" className="w-full h-full object-cover" />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10"
        >
          <div className="text-accent text-4xl mb-6 opacity-60">॥</div>
          <p className="text-2xl md:text-3xl font-display text-white leading-relaxed tracking-wide mb-6" lang="sa">
            विद्या ददाति विनयं विनयाद्याति पात्रताम् ।<br />
            पात्रत्वाद्धनमाप्नोति धनाद्धर्मं ततः सुखम् ॥
          </p>
          <div className="w-16 h-0.5 bg-accent mx-auto mb-6" />
          <p className="text-white/75 text-base md:text-lg italic leading-relaxed max-w-2xl mx-auto">
            "Knowledge gives humility, from humility comes worthiness, from worthiness one earns wealth, from wealth one follows dharma, and from dharma comes true happiness."
          </p>
          <p className="text-accent/70 text-sm mt-4 font-medium tracking-widest uppercase">— Hitopadesa</p>
        </motion.div>
      </section>

      {/* Quick Links Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-100px" }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {[
              { icon: BookOpen, title: "Our Curriculum", desc: "Structured learning from shlokas to languages.", link: "/courses" },
              { icon: Calendar, title: "Academic Calendar", desc: "Stay updated with class schedules and holidays.", link: "/calendar" },
              { icon: Users, title: "Parents Portal", desc: "Manage enrollment and student progress easily.", link: "/parents" }
            ].map((feature, i) => (
              <motion.div key={i} variants={item} className="glass-card rounded-2xl p-8 text-center group hover:-translate-y-2 transition-all duration-300">
                <div className="w-16 h-16 mx-auto bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-white transition-colors">
                  <feature.icon className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-display font-bold text-secondary mb-3">{feature.title}</h3>
                <p className="text-muted-foreground mb-6">{feature.desc}</p>
                <Link href={feature.link} className="inline-flex items-center gap-2 text-primary font-medium hover:gap-3 transition-all">
                  Learn More <ArrowRight className="w-4 h-4" />
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Featured Courses */}
      <section className="py-24 bg-background relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-50">
           <img src={`${import.meta.env.BASE_URL}images/pattern-bg.png`} alt="" className="w-full h-full object-cover opacity-30" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-4xl font-display font-bold text-secondary mb-4">Explore Our Courses</h2>
            <p className="text-lg text-muted-foreground">Comprehensive programs designed to instill cultural pride and knowledge at every age level.</p>
          </div>

          {loadingCourses ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1,2,3,4].map(i => <div key={i} className="h-64 bg-black/5 animate-pulse rounded-2xl" />)}
            </div>
          ) : (
            <motion.div 
              variants={container}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            >
              {featuredCourses.map(course => (
                <motion.div key={course.id} variants={item} className="bg-white rounded-2xl p-6 shadow-lg shadow-black/5 border border-border hover:shadow-xl hover:border-primary/30 transition-all group">
                  <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
                    {course.icon}
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-2">{course.name}</h3>
                  <div className="flex items-center gap-2 text-sm text-primary mb-3">
                    <span className="px-2 py-1 bg-primary/10 rounded-md">{course.ageGroup}</span>
                    <span className="px-2 py-1 bg-primary/10 rounded-md">{course.level}</span>
                  </div>
                  <p className="text-muted-foreground text-sm line-clamp-3 mb-6">{course.description}</p>
                  <Link href="/courses" className="text-secondary font-medium text-sm flex items-center gap-1 hover:text-primary">
                    View Details <ArrowRight className="w-3 h-3" />
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          )}
          
          <div className="text-center mt-12">
            <Button variant="outline" size="lg" asChild>
              <Link href="/courses">View All Courses</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Upcoming Events Mini */}
      <section className="py-20 bg-secondary text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
            <div>
              <h2 className="text-4xl font-display font-bold text-accent mb-4">Upcoming Events</h2>
              <p className="text-white/70 max-w-xl">Join us for celebrations, special assemblies, and cultural programs throughout the year.</p>
            </div>
            <Button variant="outline" className="text-white border-white hover:bg-white hover:text-secondary" asChild>
              <Link href="/calendar">Full Calendar</Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {upcomingEvents.map(event => (
              <div key={event.id} className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-colors">
                <div className="text-accent font-bold mb-2">
                  {format(new Date(event.date), "MMMM d, yyyy")} • {event.time}
                </div>
                <h3 className="text-xl font-bold mb-2">{event.title}</h3>
                <p className="text-white/70 text-sm mb-4 line-clamp-2">{event.description}</p>
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-accent" />
                  <span>{event.location}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
