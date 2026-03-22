import { useState } from "react";
import { mockAdminCourses, AdminCourse, CourseLevel } from "../mockData";
import { Edit2, Check, X, Users, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function CoursesAdmin() {
  const [courses, setCourses] = useState<AdminCourse[]>(mockAdminCourses);
  const [selectedCourse, setSelectedCourse] = useState<number>(0);
  const [editingLevel, setEditingLevel] = useState<{ courseId: number; level: number } | null>(null);
  const [editForm, setEditForm] = useState<Partial<CourseLevel>>({});

  const course = courses[selectedCourse];

  function openEditLevel(level: CourseLevel) {
    setEditingLevel({ courseId: course.id, level: level.level });
    setEditForm({ ...level });
  }

  function saveLevel() {
    if (!editingLevel) return;
    setCourses(prev => prev.map(c =>
      c.id === editingLevel.courseId
        ? { ...c, levels: c.levels.map(l => l.level === editingLevel.level ? { ...l, ...editForm } : l) }
        : c
    ));
    setEditingLevel(null);
  }

  const totalEnrolled = courses.reduce((a, c) => a + c.levels.reduce((b, l) => b + l.enrolled, 0), 0);
  const totalCapacity = courses.reduce((a, c) => a + c.levels.reduce((b, l) => b + l.capacity, 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-secondary">Courses & Classes</h2>
        <p className="text-sm text-muted-foreground">{courses.length} courses • {totalEnrolled} enrolled of {totalCapacity} capacity</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {courses.map((c, i) => {
          const enrolled = c.levels.reduce((a, l) => a + l.enrolled, 0);
          const cap = c.levels.reduce((a, l) => a + l.capacity, 0);
          return (
            <button key={c.id} onClick={() => setSelectedCourse(i)}
              className={`p-4 rounded-2xl border text-center transition-all ${selectedCourse === i ? "bg-primary/10 border-primary shadow-sm" : "bg-white border-border hover:border-primary/50"}`}>
              <div className="text-3xl mb-2">{c.icon}</div>
              <div className="font-semibold text-secondary text-sm">{c.name}</div>
              <div className="text-xs text-muted-foreground mt-1">{enrolled}/{cap}</div>
            </button>
          );
        })}
      </div>

      <div className="bg-white rounded-2xl border border-border p-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl">{course.icon}</span>
              <h3 className="text-xl font-bold text-secondary">{course.name}</h3>
            </div>
            <p className="text-sm text-muted-foreground max-w-lg">{course.description}</p>
          </div>
          <div className="flex gap-4 shrink-0">
            <div className="text-center p-3 bg-gray-50 rounded-xl">
              <div className="text-xl font-bold text-secondary">{course.levels.reduce((a, l) => a + l.enrolled, 0)}</div>
              <div className="text-xs text-muted-foreground">Enrolled</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-xl">
              <div className="text-xl font-bold text-secondary">{course.levels.filter(l => l.status === "Active").length}</div>
              <div className="text-xs text-muted-foreground">Active Levels</div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left font-semibold text-muted-foreground pb-3 pr-4">Level</th>
                <th className="text-left font-semibold text-muted-foreground pb-3 pr-4">Schedule</th>
                <th className="text-left font-semibold text-muted-foreground pb-3 pr-4">Teacher</th>
                <th className="text-left font-semibold text-muted-foreground pb-3 pr-4">Enrollment</th>
                <th className="text-left font-semibold text-muted-foreground pb-3 pr-4">Status</th>
                <th className="text-left font-semibold text-muted-foreground pb-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {course.levels.map(level => (
                <tr key={level.level} className="border-b border-border/50 hover:bg-gray-50 transition-colors">
                  {editingLevel?.level === level.level && editingLevel?.courseId === course.id ? (
                    <>
                      <td className="py-3 pr-4 font-semibold text-secondary whitespace-nowrap">Level {level.level}</td>
                      <td className="py-3 pr-4">
                        <Input value={editForm.schedule ?? ""} onChange={e => setEditForm(f => ({ ...f, schedule: e.target.value }))} className="rounded-lg h-8 text-xs w-40" />
                      </td>
                      <td className="py-3 pr-4">
                        <Input value={editForm.teacher ?? ""} onChange={e => setEditForm(f => ({ ...f, teacher: e.target.value }))} className="rounded-lg h-8 text-xs w-40" />
                      </td>
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-1">
                          <Input type="number" value={editForm.enrolled ?? 0} onChange={e => setEditForm(f => ({ ...f, enrolled: +e.target.value }))} className="rounded-lg h-8 text-xs w-14" />
                          <span className="text-muted-foreground">/</span>
                          <Input type="number" value={editForm.capacity ?? 20} onChange={e => setEditForm(f => ({ ...f, capacity: +e.target.value }))} className="rounded-lg h-8 text-xs w-14" />
                        </div>
                      </td>
                      <td className="py-3 pr-4">
                        <select value={editForm.status} onChange={e => setEditForm(f => ({ ...f, status: e.target.value as "Active" | "Inactive" }))} className="border border-input rounded-lg px-2 py-1 text-xs">
                          <option>Active</option><option>Inactive</option>
                        </select>
                      </td>
                      <td className="py-3">
                        <div className="flex gap-1">
                          <button onClick={saveLevel} className="w-7 h-7 rounded-lg bg-green-500 text-white hover:bg-green-600 flex items-center justify-center transition-colors"><Check className="w-3 h-3" /></button>
                          <button onClick={() => setEditingLevel(null)} className="w-7 h-7 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 flex items-center justify-center transition-colors"><X className="w-3 h-3" /></button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 bg-primary/10 text-primary rounded-lg flex items-center justify-center font-bold text-xs">{level.level}</div>
                          <span className="font-medium text-secondary">Level {level.level}</span>
                        </div>
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground text-xs whitespace-nowrap">{level.schedule}</td>
                      <td className="py-3 pr-4 text-muted-foreground text-xs">{level.teacher}</td>
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-gray-100 rounded-full w-16">
                            <div className="h-full bg-primary rounded-full" style={{ width: `${Math.round((level.enrolled / level.capacity) * 100)}%` }} />
                          </div>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">{level.enrolled}/{level.capacity}</span>
                        </div>
                      </td>
                      <td className="py-3 pr-4">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${level.status === "Active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                          {level.status}
                        </span>
                      </td>
                      <td className="py-3">
                        <button onClick={() => openEditLevel(level)} className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 flex items-center justify-center transition-colors">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-border p-6">
        <h3 className="font-bold text-secondary mb-4 flex items-center gap-2"><BookOpen className="w-4 h-4" /> All Courses Overview</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map(c => {
            const enrolled = c.levels.reduce((a, l) => a + l.enrolled, 0);
            const cap = c.levels.reduce((a, l) => a + l.capacity, 0);
            const pct = Math.round((enrolled / cap) * 100);
            return (
              <div key={c.id} className="p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">{c.icon}</span>
                  <div>
                    <div className="font-semibold text-secondary">{c.name}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1"><Users className="w-3 h-3" /> {enrolled} students</div>
                  </div>
                </div>
                <div className="h-2 bg-white rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-primary to-accent rounded-full" style={{ width: `${pct}%` }} />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>{enrolled}/{cap} enrolled</span>
                  <span>{pct}% full</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
