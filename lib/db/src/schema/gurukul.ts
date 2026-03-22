import { pgTable, text, serial, boolean, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const announcementsTable = pgTable("announcements", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  date: text("date").notNull(),
  isUrgent: boolean("is_urgent").notNull().default(false),
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
  createdAt: timestamp("created_at").defaultNow(),
});

export const contactsTable = pgTable("contacts", {
  id: serial("id").primaryKey(),
  parentName: text("parent_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  childName: text("child_name").notNull(),
  childAge: integer("child_age"),
  courseInterest: text("course_interest").notNull(),
  message: text("message"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAnnouncementSchema = createInsertSchema(announcementsTable).omit({ id: true, createdAt: true });
export const insertEventSchema = createInsertSchema(eventsTable).omit({ id: true, createdAt: true });
export const insertCourseSchema = createInsertSchema(coursesTable).omit({ id: true, createdAt: true });
export const insertContactSchema = createInsertSchema(contactsTable).omit({ id: true, createdAt: true });

export type Announcement = typeof announcementsTable.$inferSelect;
export type Event = typeof eventsTable.$inferSelect;
export type Course = typeof coursesTable.$inferSelect;
export type Contact = typeof contactsTable.$inferSelect;
export type InsertAnnouncement = z.infer<typeof insertAnnouncementSchema>;
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type InsertCourse = z.infer<typeof insertCourseSchema>;
export type InsertContact = z.infer<typeof insertContactSchema>;
