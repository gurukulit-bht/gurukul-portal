export type Teacher = {
  id: number; name: string; email: string; phone: string;
  assignedCourse: string; assignedLevel: string; timing: string; status: "Active" | "Inactive";
};

export type Student = {
  id: string; name: string; parentName: string; course: string; level: string;
  timing: string; enrollDate: string; paymentStatus: "Paid" | "Pending" | "Overdue";
  amountDue: number; amountPaid: number; paymentMethod: string; receiptId: string;
};

export type InventoryItem = {
  id: number; name: string; category: string; dateProcured: string;
  quantityProcured: number; currentStock: number; reorderLevel: number;
  lastReplenishment: string; vendor: string; remarks: string;
};

export type AdminAnnouncement = {
  id: number; title: string; content: string; category: string;
  publishDate: string; expiryDate: string; isActive: boolean; isUrgent: boolean;
};

export type AdminEvent = {
  id: number; title: string; description: string; date: string; time: string;
  location: string; category: string; isRecurring: boolean;
};

export type CourseLevel = {
  level: number; className: string; schedule: string; teacher: string;
  enrolled: number; capacity: number; status: "Active" | "Inactive";
};

export type AdminCourse = {
  id: number; name: string; icon: string; description: string; levels: CourseLevel[];
};

export const mockTeachers: Teacher[] = [
  { id: 1, name: "Smt. Priya Sharma", email: "priya.sharma@bhtohio.org", phone: "(740) 555-0101", assignedCourse: "Hindi", assignedLevel: "Beginner (L1-L3)", timing: "Sundays 10:00–11:00 AM", status: "Active" },
  { id: 2, name: "Smt. Kavita Patel", email: "kavita.patel@bhtohio.org", phone: "(740) 555-0102", assignedCourse: "Dharma", assignedLevel: "All Levels", timing: "Sundays 9:00–10:00 AM", status: "Active" },
  { id: 3, name: "Smt. Lalitha Rao", email: "lalitha.rao@bhtohio.org", phone: "(740) 555-0103", assignedCourse: "Telugu", assignedLevel: "Beginner (L1-L3)", timing: "Saturdays 10:00–11:00 AM", status: "Active" },
  { id: 4, name: "Smt. Vijaya Kumar", email: "vijaya.kumar@bhtohio.org", phone: "(740) 555-0104", assignedCourse: "Tamil", assignedLevel: "All Levels", timing: "Saturdays 11:00–12:00 PM", status: "Active" },
  { id: 5, name: "Pt. Ramesh Joshi", email: "ramesh.joshi@bhtohio.org", phone: "(740) 555-0105", assignedCourse: "Sanskrit", assignedLevel: "All Levels", timing: "Sundays 11:00 AM–12:00 PM", status: "Active" },
  { id: 6, name: "Smt. Hetal Shah", email: "hetal.shah@bhtohio.org", phone: "(740) 555-0106", assignedCourse: "Gujarati", assignedLevel: "All Levels", timing: "Saturdays 12:00–1:00 PM", status: "Active" },
  { id: 7, name: "Smt. Anita Reddy", email: "anita.reddy@bhtohio.org", phone: "(740) 555-0107", assignedCourse: "Hindi", assignedLevel: "Advanced (L4-L7)", timing: "Sundays 10:00–11:00 AM", status: "Active" },
  { id: 8, name: "Sri. Mohan Das", email: "mohan.das@bhtohio.org", phone: "(740) 555-0108", assignedCourse: "Telugu", assignedLevel: "Advanced (L4-L7)", timing: "Saturdays 10:00–11:00 AM", status: "Inactive" },
];

export const mockStudents: Student[] = [
  { id: "GK-001", name: "Arjun Sharma", parentName: "Rajesh Sharma", course: "Hindi", level: "Level 1", timing: "Sun 10–11 AM", enrollDate: "2026-06-01", paymentStatus: "Paid", amountDue: 150, amountPaid: 150, paymentMethod: "Check", receiptId: "RCP-2026-001" },
  { id: "GK-002", name: "Priya Patel", parentName: "Suresh Patel", course: "Dharma", level: "Level 2", timing: "Sun 9–10 AM", enrollDate: "2026-06-01", paymentStatus: "Paid", amountDue: 150, amountPaid: 150, paymentMethod: "Zelle", receiptId: "RCP-2026-002" },
  { id: "GK-003", name: "Rohan Kumar", parentName: "Vijay Kumar", course: "Hindi", level: "Level 3", timing: "Sun 10–11 AM", enrollDate: "2026-06-01", paymentStatus: "Pending", amountDue: 150, amountPaid: 0, paymentMethod: "-", receiptId: "-" },
  { id: "GK-004", name: "Ananya Rao", parentName: "Lalitha Rao", course: "Telugu", level: "Level 1", timing: "Sat 10–11 AM", enrollDate: "2026-06-01", paymentStatus: "Paid", amountDue: 150, amountPaid: 150, paymentMethod: "Cash", receiptId: "RCP-2026-004" },
  { id: "GK-005", name: "Dev Shah", parentName: "Hetal Shah", course: "Gujarati", level: "Level 2", timing: "Sat 12–1 PM", enrollDate: "2026-06-01", paymentStatus: "Overdue", amountDue: 150, amountPaid: 0, paymentMethod: "-", receiptId: "-" },
  { id: "GK-006", name: "Meera Joshi", parentName: "Ramesh Joshi", course: "Sanskrit", level: "Level 1", timing: "Sun 11–12 PM", enrollDate: "2026-06-01", paymentStatus: "Paid", amountDue: 150, amountPaid: 150, paymentMethod: "Check", receiptId: "RCP-2026-006" },
  { id: "GK-007", name: "Karan Singh", parentName: "Manjit Singh", course: "Hindi", level: "Level 4", timing: "Sun 10–11 AM", enrollDate: "2026-06-01", paymentStatus: "Paid", amountDue: 150, amountPaid: 150, paymentMethod: "Zelle", receiptId: "RCP-2026-007" },
  { id: "GK-008", name: "Divya Nair", parentName: "Sunil Nair", course: "Tamil", level: "Level 1", timing: "Sat 11–12 PM", enrollDate: "2026-06-01", paymentStatus: "Pending", amountDue: 150, amountPaid: 75, paymentMethod: "Cash", receiptId: "RCP-2026-008-P" },
  { id: "GK-009", name: "Aditya Verma", parentName: "Anil Verma", course: "Dharma", level: "Level 3", timing: "Sun 9–10 AM", enrollDate: "2026-06-01", paymentStatus: "Paid", amountDue: 150, amountPaid: 150, paymentMethod: "Zelle", receiptId: "RCP-2026-009" },
  { id: "GK-010", name: "Sneha Reddy", parentName: "Krishna Reddy", course: "Telugu", level: "Level 2", timing: "Sat 10–11 AM", enrollDate: "2026-06-01", paymentStatus: "Paid", amountDue: 150, amountPaid: 150, paymentMethod: "Check", receiptId: "RCP-2026-010" },
  { id: "GK-011", name: "Riya Gupta", parentName: "Sanjay Gupta", course: "Hindi", level: "Level 2", timing: "Sun 10–11 AM", enrollDate: "2026-06-08", paymentStatus: "Overdue", amountDue: 150, amountPaid: 0, paymentMethod: "-", receiptId: "-" },
  { id: "GK-012", name: "Ayaan Khan", parentName: "Irfan Khan", course: "Sanskrit", level: "Level 2", timing: "Sun 11–12 PM", enrollDate: "2026-06-08", paymentStatus: "Paid", amountDue: 150, amountPaid: 150, paymentMethod: "Zelle", receiptId: "RCP-2026-012" },
  { id: "GK-013", name: "Ishaan Mehta", parentName: "Rohit Mehta", course: "Gujarati", level: "Level 1", timing: "Sat 12–1 PM", enrollDate: "2026-06-08", paymentStatus: "Paid", amountDue: 150, amountPaid: 150, paymentMethod: "Check", receiptId: "RCP-2026-013" },
  { id: "GK-014", name: "Lakshmi Iyer", parentName: "Venkat Iyer", course: "Tamil", level: "Level 2", timing: "Sat 11–12 PM", enrollDate: "2026-06-08", paymentStatus: "Pending", amountDue: 150, amountPaid: 0, paymentMethod: "-", receiptId: "-" },
  { id: "GK-015", name: "Sai Krishnan", parentName: "Balaji Krishnan", course: "Telugu", level: "Level 3", timing: "Sat 10–11 AM", enrollDate: "2026-06-08", paymentStatus: "Paid", amountDue: 150, amountPaid: 150, paymentMethod: "Cash", receiptId: "RCP-2026-015" },
];

export const mockInventory: InventoryItem[] = [
  { id: 1, name: "Hindi Textbook Level 1", category: "Books", dateProcured: "2026-05-15", quantityProcured: 50, currentStock: 32, reorderLevel: 15, lastReplenishment: "2026-05-15", vendor: "Bhartiya Pustak Bhandar", remarks: "Standard curriculum book" },
  { id: 2, name: "Sanskrit Primer", category: "Books", dateProcured: "2026-05-15", quantityProcured: 30, currentStock: 8, reorderLevel: 10, lastReplenishment: "2026-05-15", vendor: "Samskrita Bharati", remarks: "Low stock — order soon" },
  { id: 3, name: "Dharma Workbook", category: "Books", dateProcured: "2026-05-20", quantityProcured: 40, currentStock: 25, reorderLevel: 10, lastReplenishment: "2026-05-20", vendor: "Temple Publications", remarks: "" },
  { id: 4, name: "Telugu Reader Level 1", category: "Books", dateProcured: "2026-05-20", quantityProcured: 25, currentStock: 18, reorderLevel: 8, lastReplenishment: "2026-05-20", vendor: "Telugu Academy", remarks: "" },
  { id: 5, name: "Tamil Alphabet Chart", category: "Books", dateProcured: "2026-05-10", quantityProcured: 30, currentStock: 5, reorderLevel: 8, lastReplenishment: "2026-05-10", vendor: "Tamil Sangam", remarks: "Very low — urgent reorder" },
  { id: 6, name: "Gujarati Story Book", category: "Books", dateProcured: "2026-05-10", quantityProcured: 20, currentStock: 14, reorderLevel: 5, lastReplenishment: "2026-05-10", vendor: "Gujarat Vidyapith", remarks: "" },
  { id: 7, name: "Gurukul Drawstring Bag", category: "Bags", dateProcured: "2026-05-01", quantityProcured: 100, currentStock: 45, reorderLevel: 20, lastReplenishment: "2026-05-01", vendor: "Local Vendor - Columbus", remarks: "BHT logo printed" },
  { id: 8, name: "Pencil Case", category: "Bags", dateProcured: "2026-05-01", quantityProcured: 80, currentStock: 12, reorderLevel: 20, lastReplenishment: "2026-05-01", vendor: "Office Depot", remarks: "Low — reorder needed" },
  { id: 9, name: "A4 Ruled Paper (Reams)", category: "Papers", dateProcured: "2026-05-15", quantityProcured: 20, currentStock: 14, reorderLevel: 5, lastReplenishment: "2026-05-15", vendor: "Staples", remarks: "" },
  { id: 10, name: "Worksheet Paper (500 sheets)", category: "Papers", dateProcured: "2026-05-15", quantityProcured: 10, currentStock: 3, reorderLevel: 3, lastReplenishment: "2026-05-15", vendor: "Staples", remarks: "At reorder level" },
  { id: 11, name: "Pencils (Box of 24)", category: "Supplies", dateProcured: "2026-05-20", quantityProcured: 15, currentStock: 9, reorderLevel: 4, lastReplenishment: "2026-05-20", vendor: "Amazon", remarks: "" },
  { id: 12, name: "Crayons (24 color sets)", category: "Supplies", dateProcured: "2026-05-20", quantityProcured: 20, currentStock: 16, reorderLevel: 5, lastReplenishment: "2026-05-20", vendor: "Amazon", remarks: "" },
  { id: 13, name: "Whiteboard Markers (Pack)", category: "Supplies", dateProcured: "2026-05-01", quantityProcured: 10, currentStock: 2, reorderLevel: 3, lastReplenishment: "2026-05-01", vendor: "Office Depot", remarks: "Below reorder — urgent" },
  { id: 14, name: "Award Certificates (Blank)", category: "Supplies", dateProcured: "2026-04-01", quantityProcured: 200, currentStock: 145, reorderLevel: 50, lastReplenishment: "2026-04-01", vendor: "Temple Print Shop", remarks: "For Annual Day use" },
];

export const mockAdminAnnouncements: AdminAnnouncement[] = [
  { id: 1, title: "New Session Registration Open — Summer 2026", content: "Registration for the Summer 2026 Gurukul session is now open!", category: "Registration", publishDate: "2026-04-01", expiryDate: "2026-06-01", isActive: true, isUrgent: true },
  { id: 2, title: "Guru Purnima Celebration", content: "Join us on July 10, 2026 for our annual Guru Purnima celebration.", category: "Event", publishDate: "2026-03-20", expiryDate: "2026-07-10", isActive: true, isUrgent: false },
  { id: 3, title: "Holiday Schedule — Spring Break", content: "Classes suspended April 14–20 for Spring Break.", category: "Schedule", publishDate: "2026-03-15", expiryDate: "2026-04-20", isActive: true, isUrgent: false },
  { id: 4, title: "New Hindi Intermediate Batch", content: "A new Hindi Intermediate batch is starting this Sunday.", category: "Course", publishDate: "2026-03-10", expiryDate: "2026-04-10", isActive: true, isUrgent: false },
  { id: 5, title: "Annual Day 2026 — Save the Date", content: "Annual Day celebration on September 20, 2026.", category: "Event", publishDate: "2026-03-05", expiryDate: "2026-09-20", isActive: false, isUrgent: false },
];

export const mockAdminEvents: AdminEvent[] = [
  { id: 1, title: "First Day of Summer 2026 Classes", description: "Classes begin for Summer 2026 session.", date: "2026-06-01", time: "9:00 AM", location: "Bhartiya Hindu Temple, Main Hall", category: "Classes", isRecurring: false },
  { id: 2, title: "Guru Purnima Celebration", description: "Annual celebration honoring all teachers and gurus.", date: "2026-07-10", time: "10:00 AM", location: "Main Auditorium", category: "Festival", isRecurring: true },
  { id: 3, title: "Parents Orientation Day", description: "Orientation for new parents joining the Gurukul family.", date: "2026-06-08", time: "11:00 AM", location: "Conference Room", category: "Meeting", isRecurring: false },
  { id: 4, title: "Janmashtami Special Program", description: "Cultural program on the occasion of Janmashtami.", date: "2026-08-16", time: "6:00 PM", location: "Main Auditorium", category: "Festival", isRecurring: true },
  { id: 5, title: "Annual Day 2026", description: "Grand year-end celebration with student performances.", date: "2026-09-20", time: "4:00 PM", location: "Main Auditorium", category: "Annual Event", isRecurring: true },
  { id: 6, title: "Hindi Diwas Celebration", description: "Celebrating the national language with special performances.", date: "2026-09-14", time: "10:00 AM", location: "Main Hall", category: "Cultural", isRecurring: true },
  { id: 7, title: "Mid-Term Assessment — All Courses", description: "Mid-term assessments for all Gurukul courses.", date: "2026-07-20", time: "9:00 AM", location: "All Classrooms", category: "Exam", isRecurring: false },
];

const makeLevels = (teacher: string, timing: string, counts: number[]): CourseLevel[] =>
  counts.map((enrolled, i) => ({
    level: i + 1,
    className: `Level ${i + 1}`,
    schedule: timing,
    teacher,
    enrolled,
    capacity: 20,
    status: (enrolled > 0 ? "Active" : "Inactive") as "Active" | "Inactive",
  }));

export const mockAdminCourses: AdminCourse[] = [
  { id: 1, name: "Hindi", icon: "📖", description: "Building foundational Hindi language skills connecting students to Indian culture.", levels: makeLevels("Smt. Priya Sharma / Smt. Anita Reddy", "Sundays 10:00–11:00 AM", [12, 10, 8, 7, 5, 3, 2]) },
  { id: 2, name: "Dharma", icon: "🙏", description: "Teaching Hindu values, ethics, and traditions in an engaging way.", levels: makeLevels("Smt. Kavita Patel", "Sundays 9:00–10:00 AM", [14, 11, 9, 6, 4, 2, 1]) },
  { id: 3, name: "Telugu", icon: "🌺", description: "Learning reading, writing, and conversational Telugu.", levels: makeLevels("Smt. Lalitha Rao / Sri. Mohan Das", "Saturdays 10:00–11:00 AM", [10, 8, 6, 5, 3, 2, 0]) },
  { id: 4, name: "Tamil", icon: "🏮", description: "Introduction to one of the oldest classical languages.", levels: makeLevels("Smt. Vijaya Kumar", "Saturdays 11:00–12:00 PM", [9, 7, 5, 4, 2, 1, 0]) },
  { id: 5, name: "Sanskrit", icon: "🕉️", description: "Introduction to the ancient language of scriptures.", levels: makeLevels("Pt. Ramesh Joshi", "Sundays 11:00 AM–12:00 PM", [11, 8, 6, 4, 3, 1, 1]) },
  { id: 6, name: "Gujarati", icon: "🎨", description: "Learning reading, writing, and speaking Gujarati.", levels: makeLevels("Smt. Hetal Shah", "Saturdays 12:00–1:00 PM", [8, 6, 4, 3, 2, 1, 0]) },
];
