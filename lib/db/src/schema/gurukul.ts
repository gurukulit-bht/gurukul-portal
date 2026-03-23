import {
  pgTable,
  pgEnum,
  text,
  serial,
  boolean,
  integer,
  numeric,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// ─── Enums ────────────────────────────────────────────────────────────────────

export const teacherStatusEnum = pgEnum("teacher_status", ["Active", "Inactive"]);
export const courseLevelStatusEnum = pgEnum("course_level_status", ["Active", "Inactive"]);
export const enrollmentStatusEnum = pgEnum("enrollment_status", ["Enrolled", "Completed", "Withdrawn"]);
export const paymentStatusEnum = pgEnum("payment_status", ["Paid", "Pending", "Overdue"]);

// ─── Existing tables (extended, backward-compatible) ─────────────────────────

export const announcementsTable = pgTable("announcements", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  date: text("date").notNull(),                          // publishDate
  expiryDate: text("expiry_date"),                       // NEW — nullable
  isUrgent: boolean("is_urgent").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true), // NEW — default active
  category: text("category").notNull().default("General"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const eventsTable = pgTable("events", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  date: text("date").notNull(),
  time: text("time").notNull(),
  location: text("location").notNull(),
  category: text("category").notNull().default("General"),
  isRecurring: boolean("is_recurring").notNull().default(false), // NEW
  createdAt: timestamp("created_at").defaultNow(),
});

export const coursesTable = pgTable("courses", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  ageGroup: text("age_group").notNull(),
  level: text("level").notNull(),
  schedule: text("schedule").notNull(),
  instructor: text("instructor").notNull(),
  icon: text("icon").notNull().default("📚"),
  learningAreas: text("learning_areas"),
  levelsDetail: text("levels_detail"),
  outcome: text("outcome"),
  curriculumYear: text("curriculum_year"),            // e.g. "2026-27"; null = not year-scoped
  archivedAt: timestamp("archived_at"),              // null = active; set = archived
  createdAt: timestamp("created_at").defaultNow(),
});

export const contactsTable = pgTable("contacts", {
  id: serial("id").primaryKey(),
  motherName:     text("mother_name"),
  motherPhone:    text("mother_phone"),
  motherEmail:    text("mother_email"),
  fatherName:     text("father_name"),
  fatherPhone:    text("father_phone"),
  fatherEmail:    text("father_email"),
  childName:      text("child_name"),
  childAge:       integer("child_age"),
  courseInterest: text("course_interest").notNull(),
  message:        text("message"),
  createdAt:      timestamp("created_at").defaultNow(),
});

// ─── Teachers ─────────────────────────────────────────────────────────────────
// One row per teacher. Independent of courses.

export const teachersTable = pgTable("teachers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  bio: text("bio"),
  status: teacherStatusEnum("status").notNull().default("Active"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ─── Teacher Assignments ──────────────────────────────────────────────────────
// Links a teacher to a course with an optional level range and timing.
// A teacher can be assigned to many courses; a course can have many teachers.

export const teacherAssignmentsTable = pgTable("teacher_assignments", {
  id: serial("id").primaryKey(),
  teacherId: integer("teacher_id")
    .notNull()
    .references(() => teachersTable.id, { onDelete: "cascade" }),
  courseId: integer("course_id")
    .notNull()
    .references(() => coursesTable.id, { onDelete: "cascade" }),
  levelFrom: integer("level_from").notNull().default(1),   // e.g., 1
  levelTo: integer("level_to").notNull().default(7),       // e.g., 3 = handles L1–L3
  timing: text("timing"),                                   // e.g., "Sundays 10–11 AM"
  createdAt: timestamp("created_at").defaultNow(),
});

// ─── Course Levels ────────────────────────────────────────────────────────────
// Each course has up to 7 levels. This is the granular class unit.

export const courseLevelsTable = pgTable("course_levels", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id")
    .notNull()
    .references(() => coursesTable.id, { onDelete: "cascade" }),
  levelNumber: integer("level_number").notNull(),  // 1–7
  className: text("class_name").notNull(),          // e.g., "Level 1"
  schedule: text("schedule"),                        // e.g., "Sundays 10–11 AM"
  capacity: integer("capacity").notNull().default(20),
  enrolled: integer("enrolled").notNull().default(0),
  status: courseLevelStatusEnum("status").notNull().default("Active"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ─── Temple Members ───────────────────────────────────────────────────────────
// A temple member (parent/guardian) who has registered or been looked up.

export const membersTable = pgTable("members", {
  id: serial("id").primaryKey(),
  name:             text("name"),
  email:            text("email"),
  phone:            text("phone"),
  isExistingMember: boolean("is_existing_member").default(false),
  policyAgreed:     boolean("policy_agreed").default(false),
  createdAt:        timestamp("created_at").defaultNow(),
});

// ─── Students ─────────────────────────────────────────────────────────────────
// One row per student (child). Parent info lives here too.

export const studentsTable = pgTable("students", {
  id: serial("id").primaryKey(),
  studentCode: text("student_code").notNull().unique(), // e.g., GK-001
  name: text("name").notNull(),
  // Extended student fields
  dob: text("dob"),                        // Date of birth e.g. "2015-06-10"
  grade: text("grade"),                    // School grade e.g. "4th"
  isNewStudent: boolean("is_new_student").default(true),
  // Member linkage
  memberId: integer("member_id").references(() => membersTable.id),
  // Separate parent contacts
  motherName:     text("mother_name"),
  motherPhone:    text("mother_phone"),
  motherEmail:    text("mother_email"),
  motherEmployer: text("mother_employer"),
  fatherName:     text("father_name"),
  fatherPhone:    text("father_phone"),
  fatherEmail:    text("father_email"),
  fatherEmployer: text("father_employer"),
  address: text("address"),
  // Volunteer info
  volunteerParent: boolean("volunteer_parent").default(false),
  volunteerArea:   text("volunteer_area"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ─── Enrollments ──────────────────────────────────────────────────────────────
// A student may be enrolled in multiple course levels (one row each).
// sectionId is nullable — a student enrolled in a level can be assigned to a
// specific section within that level. null = unassigned / whole level.

export const enrollmentsTable = pgTable("enrollments", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id")
    .notNull()
    .references(() => studentsTable.id, { onDelete: "cascade" }),
  courseLevelId: integer("course_level_id")
    .notNull()
    .references(() => courseLevelsTable.id, { onDelete: "restrict" }),
  sectionId: integer("section_id")
    .references(() => courseSectionsTable.id, { onDelete: "set null" }),
  enrollDate: text("enroll_date").notNull(),
  status: enrollmentStatusEnum("status").notNull().default("Enrolled"),
  createdAt: timestamp("created_at").defaultNow(),
}, (t) => [
  // A student can only be enrolled in one section per course level at a time
  unique("enrollment_student_level_uniq").on(t.studentId, t.courseLevelId),
]);

// ─── Payments ─────────────────────────────────────────────────────────────────
// One payment record per enrollment (1-to-1, but kept separate for audit trail).

export const paymentsTable = pgTable("payments", {
  id: serial("id").primaryKey(),
  enrollmentId: integer("enrollment_id")
    .notNull()
    .unique()
    .references(() => enrollmentsTable.id, { onDelete: "cascade" }),
  amountDue: numeric("amount_due", { precision: 10, scale: 2 }).notNull().default("150.00"),
  amountPaid: numeric("amount_paid", { precision: 10, scale: 2 }).notNull().default("0.00"),
  paymentStatus: paymentStatusEnum("payment_status").notNull().default("Pending"),
  paymentMethod: text("payment_method"),   // Check, Zelle, Cash
  receiptId: text("receipt_id"),
  paymentDate: text("payment_date"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ─── Inventory ────────────────────────────────────────────────────────────────
// Temple Gurukul supplies and materials stock tracking.

export const inventoryTable = pgTable("inventory", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),           // Books, Bags, Papers, Supplies
  dateProcured: text("date_procured"),
  quantityProcured: integer("quantity_procured").notNull().default(0),
  currentStock: integer("current_stock").notNull().default(0),
  reorderLevel: integer("reorder_level").notNull().default(5),
  lastReplenishment: text("last_replenishment"),
  vendor: text("vendor"),
  remarks: text("remarks"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ─── Course Sections ─────────────────────────────────────────────────────────
// Sections subdivide a level (e.g., Level 1 Morning / Level 1 Afternoon).
// Students are enrolled at the level level; sections handle scheduling/grouping.

export const courseSectionsTable = pgTable("course_sections", {
  id:            serial("id").primaryKey(),
  courseLevelId: integer("course_level_id")
    .notNull()
    .references(() => courseLevelsTable.id, { onDelete: "cascade" }),
  sectionName:   text("section_name").notNull(),    // e.g., "Morning Batch", "Section A"
  schedule:      text("schedule"),                   // e.g., "Sundays 10–11 AM"
  capacity:      integer("capacity").notNull().default(20),
  status:        courseLevelStatusEnum("status").notNull().default("Active"),
  createdAt:     timestamp("created_at").defaultNow(),
});

// Teacher/Assistant → Section assignment (granular, per section)
export const sectionAssignmentsTable = pgTable("section_assignments", {
  id:        serial("id").primaryKey(),
  sectionId: integer("section_id")
    .notNull()
    .references(() => courseSectionsTable.id, { onDelete: "cascade" }),
  teacherId: integer("teacher_id")
    .notNull()
    .references(() => teachersTable.id, { onDelete: "cascade" }),
  role:      text("role").notNull().default("Teacher"),  // "Teacher" | "Assistant"
  createdAt: timestamp("created_at").defaultNow(),
});

// ─── Attendance ───────────────────────────────────────────────────────────────

export const attendanceStatusEnum = pgEnum("attendance_status", ["Present", "Absent", "Late"]);

export const attendanceRecordsTable = pgTable("attendance_records", {
  id:            serial("id").primaryKey(),
  courseLevelId: integer("course_level_id")
    .notNull()
    .references(() => courseLevelsTable.id, { onDelete: "cascade" }),
  studentId:     integer("student_id")
    .notNull()
    .references(() => studentsTable.id, { onDelete: "cascade" }),
  date:          text("date").notNull(),
  status:        attendanceStatusEnum("status").notNull(),
  recordedBy:    text("recorded_by").notNull(),
  createdAt:     timestamp("created_at").defaultNow(),
});

// ─── Parent Notifications ─────────────────────────────────────────────────────

export const notificationStatusEnum   = pgEnum("notification_status",   ["Draft", "Published", "Sent"]);
export const notificationPriorityEnum = pgEnum("notification_priority",  ["High", "Normal", "Low"]);

export const parentNotificationsTable = pgTable("parent_notifications", {
  id:          serial("id").primaryKey(),
  title:       text("title").notNull(),
  message:     text("message").notNull(),
  courseId:    integer("course_id").references(() => coursesTable.id, { onDelete: "set null" }),
  courseName:  text("course_name"),
  audience:    text("audience").notNull().default("All Students"),
  priority:    notificationPriorityEnum("priority").notNull().default("Normal"),
  status:      notificationStatusEnum("status").notNull().default("Draft"),
  createdBy:   text("created_by").notNull(),
  createdAt:   timestamp("created_at").defaultNow(),
  publishedAt: timestamp("published_at"),
});

// ─── Relations ────────────────────────────────────────────────────────────────

export const coursesRelations = relations(coursesTable, ({ many }) => ({
  levels: many(courseLevelsTable),
  teacherAssignments: many(teacherAssignmentsTable),
}));

export const courseLevelsRelations = relations(courseLevelsTable, ({ one, many }) => ({
  course: one(coursesTable, {
    fields: [courseLevelsTable.courseId],
    references: [coursesTable.id],
  }),
  enrollments: many(enrollmentsTable),
}));

export const teachersRelations = relations(teachersTable, ({ many }) => ({
  assignments: many(teacherAssignmentsTable),
}));

export const teacherAssignmentsRelations = relations(teacherAssignmentsTable, ({ one }) => ({
  teacher: one(teachersTable, {
    fields: [teacherAssignmentsTable.teacherId],
    references: [teachersTable.id],
  }),
  course: one(coursesTable, {
    fields: [teacherAssignmentsTable.courseId],
    references: [coursesTable.id],
  }),
}));

export const studentsRelations = relations(studentsTable, ({ many }) => ({
  enrollments: many(enrollmentsTable),
}));

export const enrollmentsRelations = relations(enrollmentsTable, ({ one }) => ({
  student: one(studentsTable, {
    fields: [enrollmentsTable.studentId],
    references: [studentsTable.id],
  }),
  courseLevel: one(courseLevelsTable, {
    fields: [enrollmentsTable.courseLevelId],
    references: [courseLevelsTable.id],
  }),
  section: one(courseSectionsTable, {
    fields: [enrollmentsTable.sectionId],
    references: [courseSectionsTable.id],
  }),
  payment: one(paymentsTable, {
    fields: [enrollmentsTable.id],
    references: [paymentsTable.enrollmentId],
  }),
}));

export const paymentsRelations = relations(paymentsTable, ({ one }) => ({
  enrollment: one(enrollmentsTable, {
    fields: [paymentsTable.enrollmentId],
    references: [enrollmentsTable.id],
  }),
}));

// ─── Insert Schemas (Zod validation) ─────────────────────────────────────────

export const insertAnnouncementSchema = createInsertSchema(announcementsTable).omit({ id: true, createdAt: true });
export const insertEventSchema = createInsertSchema(eventsTable).omit({ id: true, createdAt: true });
export const insertCourseSchema = createInsertSchema(coursesTable).omit({ id: true, createdAt: true });
export const insertContactSchema = createInsertSchema(contactsTable).omit({ id: true, createdAt: true });
export const insertTeacherSchema = createInsertSchema(teachersTable).omit({ id: true, createdAt: true });
export const insertTeacherAssignmentSchema = createInsertSchema(teacherAssignmentsTable).omit({ id: true, createdAt: true });
export const insertCourseLevelSchema = createInsertSchema(courseLevelsTable).omit({ id: true, createdAt: true });
export const insertStudentSchema = createInsertSchema(studentsTable).omit({ id: true, createdAt: true });
export const insertEnrollmentSchema = createInsertSchema(enrollmentsTable).omit({ id: true, createdAt: true });
export const insertPaymentSchema = createInsertSchema(paymentsTable).omit({ id: true, createdAt: true });
export const insertInventorySchema = createInsertSchema(inventoryTable).omit({ id: true, createdAt: true });
export const insertAttendanceSchema       = createInsertSchema(attendanceRecordsTable).omit({ id: true, createdAt: true });
export const insertParentNotificationSchema = createInsertSchema(parentNotificationsTable).omit({ id: true, createdAt: true, publishedAt: true });

// ─── Types ────────────────────────────────────────────────────────────────────

export type Announcement = typeof announcementsTable.$inferSelect;
export type Event = typeof eventsTable.$inferSelect;
export type Course = typeof coursesTable.$inferSelect;
export type Contact = typeof contactsTable.$inferSelect;
export type Teacher = typeof teachersTable.$inferSelect;
export type TeacherAssignment = typeof teacherAssignmentsTable.$inferSelect;
export type CourseLevel = typeof courseLevelsTable.$inferSelect;
export type Student = typeof studentsTable.$inferSelect;
export type Enrollment = typeof enrollmentsTable.$inferSelect;
export type Payment = typeof paymentsTable.$inferSelect;
export type InventoryItem = typeof inventoryTable.$inferSelect;

export type InsertAnnouncement = z.infer<typeof insertAnnouncementSchema>;
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type InsertCourse = z.infer<typeof insertCourseSchema>;
export type InsertContact = z.infer<typeof insertContactSchema>;
export type InsertTeacher = z.infer<typeof insertTeacherSchema>;
export type InsertTeacherAssignment = z.infer<typeof insertTeacherAssignmentSchema>;
export type InsertCourseLevel = z.infer<typeof insertCourseLevelSchema>;
export type InsertStudent = z.infer<typeof insertStudentSchema>;
export type InsertEnrollment = z.infer<typeof insertEnrollmentSchema>;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type InsertInventory = z.infer<typeof insertInventorySchema>;
