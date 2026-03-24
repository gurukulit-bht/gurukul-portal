import { PageHeader } from "@/components/layout/PageHeader";
import { useListCourses } from "@workspace/api-client-react";
import { motion } from "framer-motion";
import { User, GraduationCap, CheckCircle2, Target, ChevronRight, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

const LEVEL_BADGE_COLORS = [
  "bg-green-50 text-green-700 border-green-200",
  "bg-emerald-50 text-emerald-700 border-emerald-200",
  "bg-teal-50 text-teal-700 border-teal-200",
  "bg-amber-50 text-amber-700 border-amber-200",
  "bg-orange-50 text-orange-700 border-orange-200",
  "bg-red-50 text-red-700 border-red-200",
  "bg-purple-50 text-purple-700 border-purple-200",
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const cardItem = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

type DbLevel = {
  id: number; levelNumber: number; className: string;
  schedule: string; capacity: number;
  sections: { id: number; sectionName: string; schedule: string; capacity: number }[];
};

type Course = {
  id: number; name: string; description: string; ageGroup: string;
  level: string; schedule: string; instructor: string; icon: string;
  learningAreas: string | null; levelsDetail: string | null; outcome: string | null;
  levels?: DbLevel[];
};

export default function Courses() {
  const { data: rawCourses = [], isLoading } = useListCourses();
  const courses = rawCourses as Course[];

  return (
    <div className="min-h-screen bg-background pb-24">
      <PageHeader
        title="Courses Offered"
        description="Structured curriculum designed for different age groups to learn languages, shlokas, and cultural values."
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20">
        {isLoading ? (
          <div className="grid md:grid-cols-2 gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-96 bg-white rounded-2xl animate-pulse shadow-lg" />
            ))}
          </div>
        ) : (
          <motion.div
            className="grid md:grid-cols-2 gap-8"
            variants={container}
            initial="hidden"
            animate="show"
          >
            {courses.map((course) => {
              const learningAreas: string[] = course.learningAreas
                ? JSON.parse(course.learningAreas)
                : [];

              const dbLevels: DbLevel[] = Array.isArray(course.levels) && course.levels.length > 0
                ? course.levels.slice().sort((a, b) => a.levelNumber - b.levelNumber)
                : [];

              return (
                <motion.div
                  key={course.id}
                  variants={cardItem}
                  className="bg-white rounded-2xl shadow-xl shadow-black/5 border border-border/50 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col"
                >
                  {/* Card Header */}
                  <div className="bg-gradient-to-r from-primary/10 via-accent/10 to-secondary/10 px-8 pt-8 pb-6 border-b border-border/40">
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-xl bg-white shadow-md flex items-center justify-center text-3xl flex-shrink-0">
                        {course.icon}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-2xl font-display font-bold text-secondary leading-tight">
                          {course.name}
                        </h3>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/15 text-primary">
                            Age: {course.ageGroup}
                          </span>
                          {dbLevels.length > 0 && (
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-secondary/10 text-secondary flex items-center gap-1">
                              <Layers className="w-3 h-3" /> {dbLevels.length} Levels
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <p className="mt-4 text-foreground/75 text-sm leading-relaxed">
                      {course.description}
                    </p>
                  </div>

                  {/* Card Body */}
                  <div className="px-8 py-6 flex-1 space-y-6">
                    {/* Key Learning Areas */}
                    {learningAreas.length > 0 && (
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-widest text-primary mb-3">
                          Key Learning Areas
                        </h4>
                        <ul className="space-y-1.5">
                          {learningAreas.map((area, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-foreground/80">
                              <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                              <span>{area}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* DB Levels */}
                    {dbLevels.length > 0 && (
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-widest text-primary mb-3">
                          Course Levels
                        </h4>
                        <div className="grid grid-cols-2 gap-2">
                          {dbLevels.map((lvl, i) => (
                            <div
                              key={lvl.id}
                              className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm ${LEVEL_BADGE_COLORS[i % LEVEL_BADGE_COLORS.length]}`}
                            >
                              <GraduationCap className="w-3.5 h-3.5 flex-shrink-0" />
                              <div className="min-w-0">
                                <span className="font-semibold text-xs">{lvl.className}</span>
                                {lvl.sections.length > 0 && (
                                  <span className="block text-[10px] opacity-70">
                                    {lvl.sections.length} section{lvl.sections.length !== 1 ? "s" : ""}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Instructor */}
                    <div className="flex items-center gap-2 text-sm text-foreground/70 pt-1">
                      <User className="w-4 h-4 text-primary" />
                      <span className="font-medium">Instructor:</span>
                      <span>{course.instructor}</span>
                    </div>

                    {/* Outcome */}
                    {course.outcome && (
                      <div className="flex items-start gap-2 bg-secondary/8 border border-secondary/20 rounded-xl px-4 py-3">
                        <Target className="w-4 h-4 text-secondary mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-secondary/90 font-medium leading-snug">
                          {course.outcome}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Card Footer */}
                  <div className="px-8 pb-8">
                    <Button className="w-full group" asChild>
                      <Link href={`/parents?course=${encodeURIComponent(course.name)}`}>
                        Enroll in {course.name}
                        <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                      </Link>
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>
    </div>
  );
}
