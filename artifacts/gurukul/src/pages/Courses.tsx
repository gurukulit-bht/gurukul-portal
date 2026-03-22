import { PageHeader } from "@/components/layout/PageHeader";
import { useListCourses } from "@workspace/api-client-react";
import { motion } from "framer-motion";
import { Clock, User, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function Courses() {
  const { data: courses = [], isLoading } = useListCourses();

  return (
    <div className="min-h-screen bg-background pb-24">
      <PageHeader 
        title="Courses Offered" 
        description="Structured curriculum designed for different age groups to learn languages, shlokas, and cultural values."
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20">
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-80 bg-white rounded-2xl animate-pulse shadow-lg" />
            ))}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {courses.map((course, index) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl p-8 shadow-xl shadow-black/5 border border-border/50 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex flex-col"
              >
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-4xl mb-6 shadow-inner">
                  {course.icon}
                </div>
                
                <h3 className="text-2xl font-display font-bold text-secondary mb-2">{course.name}</h3>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="px-3 py-1 bg-secondary/10 text-secondary text-sm font-semibold rounded-full">
                    {course.category}
                  </span>
                  <span className="px-3 py-1 bg-primary/10 text-primary text-sm font-semibold rounded-full">
                    Age: {course.ageGroup}
                  </span>
                </div>

                <p className="text-muted-foreground mb-6 flex-grow">
                  {course.description}
                </p>

                <div className="space-y-3 mb-8 pt-4 border-t border-border">
                  <div className="flex items-center gap-3 text-sm text-foreground/80">
                    <GraduationCap className="w-4 h-4 text-primary" />
                    <span className="font-medium">Level:</span> {course.level}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-foreground/80">
                    <Clock className="w-4 h-4 text-primary" />
                    <span className="font-medium">Schedule:</span> {course.schedule}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-foreground/80">
                    <User className="w-4 h-4 text-primary" />
                    <span className="font-medium">Instructor:</span> {course.instructor}
                  </div>
                </div>

                <Button className="w-full" asChild>
                  <Link href={`/parents?course=${encodeURIComponent(course.name)}`}>
                    Enroll Now
                  </Link>
                </Button>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
