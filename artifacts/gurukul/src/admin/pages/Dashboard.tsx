import { Link } from "wouter";
import { mockAdminAnnouncements, mockAdminCourses, mockAdminEvents, mockInventory, mockStudents, mockTeachers } from "../mockData";
import { BookOpen, Users, GraduationCap, Megaphone, Calendar, Package, AlertTriangle, CreditCard, ArrowRight } from "lucide-react";

export default function Dashboard() {
  const totalStudents = mockStudents.length;
  const pendingPayments = mockStudents.filter(s => s.paymentStatus !== "Paid").length;
  const overduePayments = mockStudents.filter(s => s.paymentStatus === "Overdue").length;
  const lowStockItems = mockInventory.filter(i => i.currentStock <= i.reorderLevel).length;
  const activeCourses = mockAdminCourses.length;
  const upcomingEvents = mockAdminEvents.filter(e => new Date(e.date) >= new Date()).slice(0, 3);
  const totalEnrolled = mockAdminCourses.reduce((a, c) => a + c.levels.reduce((b, l) => b + l.enrolled, 0), 0);
  const totalRevenue = mockStudents.filter(s => s.paymentStatus === "Paid").reduce((a, s) => a + s.amountPaid, 0);
  const pendingRevenue = mockStudents.filter(s => s.paymentStatus !== "Paid").reduce((a, s) => a + (s.amountDue - s.amountPaid), 0);

  const stats = [
    { label: "Active Courses", value: activeCourses, icon: BookOpen, color: "bg-blue-500", link: "/admin/courses" },
    { label: "Total Enrollments", value: totalEnrolled, icon: GraduationCap, color: "bg-green-500", link: "/admin/students" },
    { label: "Total Teachers", value: mockTeachers.filter(t => t.status === "Active").length, icon: Users, color: "bg-purple-500", link: "/admin/teachers" },
    { label: "Pending Payments", value: pendingPayments, icon: CreditCard, color: "bg-orange-500", link: "/admin/students" },
    { label: "Announcements", value: mockAdminAnnouncements.filter(a => a.isActive).length, icon: Megaphone, color: "bg-primary", link: "/admin/announcements" },
    { label: "Low Stock Alerts", value: lowStockItems, icon: Package, color: "bg-red-500", link: "/admin/inventory" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-secondary">Welcome back, Admin</h2>
        <p className="text-muted-foreground text-sm mt-1">Here's what's happening at Gurukul today — {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
      </div>

      {(overduePayments > 0 || lowStockItems > 0) && (
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
          <div className="text-sm text-orange-800">
            <span className="font-semibold">Action Required: </span>
            {overduePayments > 0 && `${overduePayments} student(s) have overdue payments. `}
            {lowStockItems > 0 && `${lowStockItems} inventory item(s) are at or below reorder level.`}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map(stat => (
          <Link key={stat.label} href={stat.link} className="bg-white rounded-2xl p-5 shadow-sm border border-border hover:shadow-md transition-all group">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-3xl font-bold text-secondary">{stat.value}</div>
                <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
              </div>
              <div className={`${stat.color} w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0`}>
                <stat.icon className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-center gap-1 text-primary text-xs font-medium mt-4 group-hover:gap-2 transition-all">
              View details <ArrowRight className="w-3 h-3" />
            </div>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-border shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-secondary">Payment Summary</h3>
            <Link href="/admin/students" className="text-primary text-xs font-medium flex items-center gap-1 hover:gap-2 transition-all">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-green-50 rounded-xl">
              <span className="text-sm font-medium text-green-800">Total Collected</span>
              <span className="font-bold text-green-700">${totalRevenue.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-orange-50 rounded-xl">
              <span className="text-sm font-medium text-orange-800">Pending Amount</span>
              <span className="font-bold text-orange-700">${pendingRevenue.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
              <span className="text-sm font-medium text-gray-700">Total Students</span>
              <span className="font-bold text-gray-800">{totalStudents}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-border shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-secondary">Upcoming Events</h3>
            <Link href="/admin/calendar" className="text-primary text-xs font-medium flex items-center gap-1 hover:gap-2 transition-all">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {upcomingEvents.map(event => (
              <div key={event.id} className="flex gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex flex-col items-center justify-center text-primary shrink-0">
                  <Calendar className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-secondary truncate">{event.title}</div>
                  <div className="text-xs text-muted-foreground">{new Date(event.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })} • {event.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-border shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-secondary">Course Enrollment</h3>
            <Link href="/admin/courses" className="text-primary text-xs font-medium flex items-center gap-1 hover:gap-2 transition-all">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {mockAdminCourses.map(course => {
              const enrolled = course.levels.reduce((a, l) => a + l.enrolled, 0);
              const capacity = course.levels.reduce((a, l) => a + l.capacity, 0);
              const pct = Math.round((enrolled / capacity) * 100);
              return (
                <div key={course.id} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-secondary">{course.icon} {course.name}</span>
                    <span className="text-muted-foreground">{enrolled}/{capacity}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-border shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-secondary">Low Stock Alerts</h3>
            <Link href="/admin/inventory" className="text-primary text-xs font-medium flex items-center gap-1 hover:gap-2 transition-all">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {mockInventory.filter(i => i.currentStock <= i.reorderLevel).map(item => (
              <div key={item.id} className="flex items-center justify-between p-3 bg-red-50 rounded-xl">
                <div>
                  <div className="text-sm font-medium text-red-800">{item.name}</div>
                  <div className="text-xs text-red-600">{item.category}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-red-700">{item.currentStock} left</div>
                  <div className="text-xs text-red-500">Reorder: {item.reorderLevel}</div>
                </div>
              </div>
            ))}
            {lowStockItems === 0 && <p className="text-sm text-muted-foreground text-center py-4">All items are well stocked</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
