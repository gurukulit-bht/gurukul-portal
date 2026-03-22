import { db } from "@workspace/db";
import {
  announcementsTable,
  coursesTable,
  eventsTable,
  teachersTable,
  teacherAssignmentsTable,
  courseLevelsTable,
  studentsTable,
  enrollmentsTable,
  paymentsTable,
  inventoryTable,
} from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { logger } from "./logger";

export async function seedIfEmpty() {
  try {
    // --- Courses ---
    const existingCourses = await db.select().from(coursesTable);
    const needsReseed =
      existingCourses.length === 0 ||
      existingCourses.every((c) => !c.learningAreas);
    if (needsReseed) {
      logger.info("Seeding courses...");
      if (existingCourses.length > 0) await db.delete(coursesTable);
      await db.insert(coursesTable).values([
        {
          name: "Hindi",
          description:
            "Hindi classes focus on building foundational language skills while connecting students to Indian culture, stories, and traditions.",
          ageGroup: "5+ years",
          level: "Beginner, Intermediate & Advanced",
          schedule: "Sundays 10:00 AM – 11:00 AM",
          instructor: "Smt. Priya Sharma",
          icon: "📖",
          learningAreas: JSON.stringify([
            "Reading and writing (Varnamala, words, sentences)",
            "Basic to advanced grammar",
            "Vocabulary building through stories and conversations",
            "Introduction to poems, bhajans, and short essays",
          ]),
          levelsDetail: JSON.stringify([
            { name: "Beginner", desc: "Alphabets and basic words" },
            { name: "Intermediate", desc: "Sentence formation and reading" },
            { name: "Advanced", desc: "Paragraph writing and comprehension" },
          ]),
          outcome:
            "Students will be able to read, write, and communicate confidently in Hindi.",
        },
        {
          name: "Dharma",
          description:
            "Dharma classes focus on teaching Hindu values, ethics, traditions, and spiritual knowledge in an engaging and age-appropriate way.",
          ageGroup: "5+ years",
          level: "Beginner, Intermediate & Advanced",
          schedule: "Sundays 9:00 AM – 10:00 AM",
          instructor: "Smt. Kavita Patel",
          icon: "🙏",
          learningAreas: JSON.stringify([
            "Stories from Ramayana, Mahabharata, and Puranas",
            "Moral values and life lessons",
            "Introduction to festivals and their significance",
            "Basic shlokas and prayers",
            "Understanding of Hindu culture and traditions",
          ]),
          levelsDetail: JSON.stringify([
            { name: "Beginner", desc: "Stories and simple values" },
            {
              name: "Intermediate",
              desc: "Deeper understanding of epics and practices",
            },
            {
              name: "Advanced",
              desc: "Discussions on philosophy and application in daily life",
            },
          ]),
          outcome:
            "Students develop strong moral values, cultural awareness, and a connection to their roots.",
        },
        {
          name: "Telugu",
          description:
            "Telugu classes aim to help students learn reading, writing, and conversational Telugu while preserving linguistic heritage.",
          ageGroup: "5+ years",
          level: "Beginner, Intermediate & Advanced",
          schedule: "Saturdays 10:00 AM – 11:00 AM",
          instructor: "Smt. Lalitha Rao",
          icon: "🌺",
          learningAreas: JSON.stringify([
            "Alphabets (Varnamala) and pronunciation",
            "Word formation and sentence construction",
            "Reading simple passages and stories",
            "Basic conversational Telugu",
          ]),
          levelsDetail: JSON.stringify([
            { name: "Beginner", desc: "Letters and basic vocabulary" },
            { name: "Intermediate", desc: "Reading and writing sentences" },
            {
              name: "Advanced",
              desc: "Conversations and paragraph writing",
            },
          ]),
          outcome:
            "Students gain confidence in reading, writing, and speaking Telugu.",
        },
        {
          name: "Tamil",
          description:
            "Tamil classes introduce students to one of the oldest classical languages, focusing on literacy and cultural richness.",
          ageGroup: "5+ years",
          level: "Beginner, Intermediate & Advanced",
          schedule: "Saturdays 11:00 AM – 12:00 PM",
          instructor: "Smt. Vijaya Kumar",
          icon: "🏮",
          learningAreas: JSON.stringify([
            "Tamil alphabets and phonetics",
            "Reading and writing practice",
            "Vocabulary and sentence building",
            "Introduction to Tamil rhymes and cultural content",
          ]),
          levelsDetail: JSON.stringify([
            { name: "Beginner", desc: "Letters and sounds" },
            { name: "Intermediate", desc: "Words and sentences" },
            { name: "Advanced", desc: "Reading passages and writing" },
          ]),
          outcome:
            "Students develop foundational proficiency in Tamil and appreciation for its heritage.",
        },
        {
          name: "Sanskrit",
          description:
            "Sanskrit classes provide an introduction to the ancient language of scriptures, focusing on pronunciation, vocabulary, and basic grammar.",
          ageGroup: "7+ years (recommended)",
          level: "Beginner, Intermediate & Advanced",
          schedule: "Sundays 11:00 AM – 12:00 PM",
          instructor: "Pt. Ramesh Joshi",
          icon: "🕉️",
          learningAreas: JSON.stringify([
            "Basic Sanskrit alphabets and pronunciation",
            "Common words and simple sentence structures",
            "Shlokas and chants with meaning",
            "Introduction to grammar (Sandhi, basic forms)",
          ]),
          levelsDetail: JSON.stringify([
            { name: "Beginner", desc: "Shlokas and basic words" },
            {
              name: "Intermediate",
              desc: "Sentence formation and grammar basics",
            },
            {
              name: "Advanced",
              desc: "Reading simple Sanskrit texts",
            },
          ]),
          outcome:
            "Students gain the ability to recite, understand basic Sanskrit, and connect with scriptures.",
        },
        {
          name: "Gujarati",
          description:
            "Gujarati classes help students learn reading, writing, and speaking skills while staying connected to Gujarati culture and traditions.",
          ageGroup: "5+ years",
          level: "Beginner, Intermediate & Advanced",
          schedule: "Saturdays 12:00 PM – 1:00 PM",
          instructor: "Smt. Hetal Shah",
          icon: "🎨",
          learningAreas: JSON.stringify([
            "Gujarati alphabets and pronunciation",
            "Word and sentence formation",
            "Reading stories and simple texts",
            "Conversational Gujarati",
          ]),
          levelsDetail: JSON.stringify([
            { name: "Beginner", desc: "Alphabets and basic words" },
            { name: "Intermediate", desc: "Reading and writing sentences" },
            { name: "Advanced", desc: "Conversation and comprehension" },
          ]),
          outcome:
            "Students become comfortable communicating and reading in Gujarati.",
        },
      ]);
      logger.info("Courses seeded.");
    }

    // --- Announcements ---
    const announcements = await db.select().from(announcementsTable);
    if (announcements.length === 0) {
      logger.info("Seeding announcements...");
      await db.insert(announcementsTable).values([
        {
          title: "New Session Registration Open — Summer 2026",
          content:
            "Registration for the Summer 2026 Gurukul session is now open! Classes will run from June 1st to August 31st. Early registration ensures your child a spot.",
          date: "April 1, 2026",
          expiryDate: "2026-06-01",
          isUrgent: true,
          isActive: true,
          category: "Registration",
        },
        {
          title: "Guru Purnima Celebration — All Families Invited",
          content:
            "Join us on July 10, 2026, for our annual Guru Purnima celebration. Students will perform shlokas, bhajans, and cultural dances.",
          date: "March 20, 2026",
          expiryDate: "2026-07-10",
          isUrgent: false,
          isActive: true,
          category: "Event",
        },
        {
          title: "Holiday Schedule — Spring Break",
          content:
            "Classes will be suspended from April 14–20 for Spring Break. Regular classes will resume on April 27.",
          date: "March 15, 2026",
          expiryDate: "2026-04-20",
          isUrgent: false,
          isActive: true,
          category: "Schedule",
        },
        {
          title: "New Hindi Intermediate Batch Starting",
          content:
            "A new Hindi Intermediate batch is starting this Sunday for students who have completed Beginner Level 1.",
          date: "March 10, 2026",
          expiryDate: "2026-04-10",
          isUrgent: false,
          isActive: true,
          category: "Course",
        },
        {
          title: "Annual Day 2026 — Save the Date",
          content:
            "Our Annual Day celebration will be held on September 20, 2026. Students across all courses will showcase their learning.",
          date: "March 5, 2026",
          expiryDate: "2026-09-20",
          isUrgent: false,
          isActive: false,
          category: "Event",
        },
      ]);
      logger.info("Announcements seeded.");
    }

    // --- Events ---
    const events = await db.select().from(eventsTable);
    if (events.length === 0) {
      logger.info("Seeding events...");
      await db.insert(eventsTable).values([
        {
          title: "First Day of Summer 2026 Classes",
          description:
            "Welcome back! Classes begin for the Summer 2026 session.",
          date: "2026-06-01",
          time: "9:00 AM",
          location: "Bhartiya Hindu Temple, Main Hall",
          category: "Classes",
          isRecurring: false,
        },
        {
          title: "Guru Purnima Celebration",
          description:
            "Annual celebration honoring all teachers and gurus. Students will perform bhajans and shlokas.",
          date: "2026-07-10",
          time: "10:00 AM",
          location: "Main Auditorium",
          category: "Festival",
          isRecurring: true,
        },
        {
          title: "Parents Orientation Day",
          description:
            "A special orientation for new parents joining the Gurukul family. Meet teachers, learn about curriculum.",
          date: "2026-06-08",
          time: "11:00 AM",
          location: "Conference Room",
          category: "Meeting",
          isRecurring: false,
        },
        {
          title: "Janmashtami Special Program",
          description:
            "Students present a special cultural program on the occasion of Janmashtami.",
          date: "2026-08-16",
          time: "6:00 PM",
          location: "Main Auditorium",
          category: "Festival",
          isRecurring: true,
        },
        {
          title: "Annual Day 2026",
          description:
            "Grand year-end celebration where students from all courses showcase their learning.",
          date: "2026-09-20",
          time: "4:00 PM",
          location: "Main Auditorium",
          category: "Annual Event",
          isRecurring: true,
        },
        {
          title: "Hindi Diwas Celebration",
          description:
            "Celebrating the national language of India with special recitations, essays, and cultural performances.",
          date: "2026-09-14",
          time: "10:00 AM",
          location: "Main Hall",
          category: "Cultural",
          isRecurring: true,
        },
        {
          title: "Mid-Term Assessment — All Courses",
          description: "Mid-term assessments for all Gurukul courses.",
          date: "2026-07-20",
          time: "9:00 AM",
          location: "All Classrooms",
          category: "Exam",
          isRecurring: false,
        },
      ]);
      logger.info("Events seeded.");
    }

    // --- Teachers ---
    const existingTeachers = await db.select().from(teachersTable);
    if (existingTeachers.length === 0) {
      logger.info("Seeding teachers...");
      const insertedTeachers = await db
        .insert(teachersTable)
        .values([
          {
            name: "Smt. Priya Sharma",
            email: "priya.sharma@bhtohio.org",
            phone: "(740) 555-0101",
            status: "Active",
          },
          {
            name: "Smt. Kavita Patel",
            email: "kavita.patel@bhtohio.org",
            phone: "(740) 555-0102",
            status: "Active",
          },
          {
            name: "Smt. Lalitha Rao",
            email: "lalitha.rao@bhtohio.org",
            phone: "(740) 555-0103",
            status: "Active",
          },
          {
            name: "Smt. Vijaya Kumar",
            email: "vijaya.kumar@bhtohio.org",
            phone: "(740) 555-0104",
            status: "Active",
          },
          {
            name: "Pt. Ramesh Joshi",
            email: "ramesh.joshi@bhtohio.org",
            phone: "(740) 555-0105",
            status: "Active",
          },
          {
            name: "Smt. Hetal Shah",
            email: "hetal.shah@bhtohio.org",
            phone: "(740) 555-0106",
            status: "Active",
          },
          {
            name: "Smt. Anita Reddy",
            email: "anita.reddy@bhtohio.org",
            phone: "(740) 555-0107",
            status: "Active",
          },
          {
            name: "Sri. Mohan Das",
            email: "mohan.das@bhtohio.org",
            phone: "(740) 555-0108",
            status: "Inactive",
          },
        ])
        .returning();
      logger.info("Teachers seeded.");

      // --- Course Levels & Teacher Assignments ---
      const courses = await db.select().from(coursesTable);
      const courseMap: Record<string, number> = {};
      courses.forEach((c) => {
        courseMap[c.name] = c.id;
      });

      const courseEnrollments: Record<string, number[]> = {
        Hindi: [12, 10, 8, 7, 5, 3, 2],
        Dharma: [14, 11, 9, 6, 4, 2, 1],
        Telugu: [10, 8, 6, 5, 3, 2, 0],
        Tamil: [9, 7, 5, 4, 2, 1, 0],
        Sanskrit: [11, 8, 6, 4, 3, 1, 1],
        Gujarati: [8, 6, 4, 3, 2, 1, 0],
      };

      const courseSchedules: Record<string, string> = {
        Hindi: "Sundays 10:00–11:00 AM",
        Dharma: "Sundays 9:00–10:00 AM",
        Telugu: "Saturdays 10:00–11:00 AM",
        Tamil: "Saturdays 11:00–12:00 PM",
        Sanskrit: "Sundays 11:00 AM–12:00 PM",
        Gujarati: "Saturdays 12:00–1:00 PM",
      };

      logger.info("Seeding course levels...");
      for (const [courseName, enrollments] of Object.entries(
        courseEnrollments
      )) {
        const courseId = courseMap[courseName];
        if (!courseId) continue;
        for (let i = 0; i < 7; i++) {
          await db.insert(courseLevelsTable).values({
            courseId,
            levelNumber: i + 1,
            className: `Level ${i + 1}`,
            schedule: courseSchedules[courseName],
            capacity: 20,
            enrolled: enrollments[i],
            status: enrollments[i] > 0 ? "Active" : "Inactive",
          });
        }
      }
      logger.info("Course levels seeded.");

      // Teacher assignments
      logger.info("Seeding teacher assignments...");
      const teacherByEmail: Record<string, number> = {};
      insertedTeachers.forEach((t) => {
        teacherByEmail[t.email] = t.id;
      });

      const assignments = [
        {
          email: "priya.sharma@bhtohio.org",
          course: "Hindi",
          levelFrom: 1,
          levelTo: 3,
          timing: "Sundays 10:00–11:00 AM",
        },
        {
          email: "kavita.patel@bhtohio.org",
          course: "Dharma",
          levelFrom: 1,
          levelTo: 7,
          timing: "Sundays 9:00–10:00 AM",
        },
        {
          email: "lalitha.rao@bhtohio.org",
          course: "Telugu",
          levelFrom: 1,
          levelTo: 3,
          timing: "Saturdays 10:00–11:00 AM",
        },
        {
          email: "vijaya.kumar@bhtohio.org",
          course: "Tamil",
          levelFrom: 1,
          levelTo: 7,
          timing: "Saturdays 11:00–12:00 PM",
        },
        {
          email: "ramesh.joshi@bhtohio.org",
          course: "Sanskrit",
          levelFrom: 1,
          levelTo: 7,
          timing: "Sundays 11:00 AM–12:00 PM",
        },
        {
          email: "hetal.shah@bhtohio.org",
          course: "Gujarati",
          levelFrom: 1,
          levelTo: 7,
          timing: "Saturdays 12:00–1:00 PM",
        },
        {
          email: "anita.reddy@bhtohio.org",
          course: "Hindi",
          levelFrom: 4,
          levelTo: 7,
          timing: "Sundays 10:00–11:00 AM",
        },
        {
          email: "mohan.das@bhtohio.org",
          course: "Telugu",
          levelFrom: 4,
          levelTo: 7,
          timing: "Saturdays 10:00–11:00 AM",
        },
      ];

      for (const a of assignments) {
        const teacherId = teacherByEmail[a.email];
        const courseId = courseMap[a.course];
        if (!teacherId || !courseId) continue;
        await db.insert(teacherAssignmentsTable).values({
          teacherId,
          courseId,
          levelFrom: a.levelFrom,
          levelTo: a.levelTo,
          timing: a.timing,
        });
      }
      logger.info("Teacher assignments seeded.");
    }

    // --- Students, Enrollments, Payments ---
    const existingStudents = await db.select().from(studentsTable);
    if (existingStudents.length === 0) {
      logger.info("Seeding students...");

      const courses = await db.select().from(coursesTable);
      const courseMap: Record<string, number> = {};
      courses.forEach((c) => { courseMap[c.name] = c.id; });

      const allLevels = await db.select().from(courseLevelsTable);
      function findLevelId(courseName: string, levelNum: number): number | undefined {
        const cid = courseMap[courseName];
        return allLevels.find((l) => l.courseId === cid && l.levelNumber === levelNum)?.id;
      }

      const studentData = [
        { code: "GK-001", name: "Arjun Sharma", parentName: "Rajesh Sharma", course: "Hindi", level: 1, timing: "Sun 10–11 AM", enrollDate: "2026-06-01", status: "Paid" as const, amountPaid: "150.00", method: "Check", receipt: "RCP-2026-001" },
        { code: "GK-002", name: "Priya Patel", parentName: "Suresh Patel", course: "Dharma", level: 2, timing: "Sun 9–10 AM", enrollDate: "2026-06-01", status: "Paid" as const, amountPaid: "150.00", method: "Zelle", receipt: "RCP-2026-002" },
        { code: "GK-003", name: "Rohan Kumar", parentName: "Vijay Kumar", course: "Hindi", level: 3, timing: "Sun 10–11 AM", enrollDate: "2026-06-01", status: "Pending" as const, amountPaid: "0.00", method: null, receipt: null },
        { code: "GK-004", name: "Ananya Rao", parentName: "Lalitha Rao", course: "Telugu", level: 1, timing: "Sat 10–11 AM", enrollDate: "2026-06-01", status: "Paid" as const, amountPaid: "150.00", method: "Cash", receipt: "RCP-2026-004" },
        { code: "GK-005", name: "Dev Shah", parentName: "Hetal Shah", course: "Gujarati", level: 2, timing: "Sat 12–1 PM", enrollDate: "2026-06-01", status: "Overdue" as const, amountPaid: "0.00", method: null, receipt: null },
        { code: "GK-006", name: "Meera Joshi", parentName: "Ramesh Joshi", course: "Sanskrit", level: 1, timing: "Sun 11–12 PM", enrollDate: "2026-06-01", status: "Paid" as const, amountPaid: "150.00", method: "Check", receipt: "RCP-2026-006" },
        { code: "GK-007", name: "Karan Singh", parentName: "Manjit Singh", course: "Hindi", level: 4, timing: "Sun 10–11 AM", enrollDate: "2026-06-01", status: "Paid" as const, amountPaid: "150.00", method: "Zelle", receipt: "RCP-2026-007" },
        { code: "GK-008", name: "Divya Nair", parentName: "Sunil Nair", course: "Tamil", level: 1, timing: "Sat 11–12 PM", enrollDate: "2026-06-01", status: "Pending" as const, amountPaid: "75.00", method: "Cash", receipt: "RCP-2026-008-P" },
        { code: "GK-009", name: "Aditya Verma", parentName: "Anil Verma", course: "Dharma", level: 3, timing: "Sun 9–10 AM", enrollDate: "2026-06-01", status: "Paid" as const, amountPaid: "150.00", method: "Zelle", receipt: "RCP-2026-009" },
        { code: "GK-010", name: "Sneha Reddy", parentName: "Krishna Reddy", course: "Telugu", level: 2, timing: "Sat 10–11 AM", enrollDate: "2026-06-01", status: "Paid" as const, amountPaid: "150.00", method: "Check", receipt: "RCP-2026-010" },
        { code: "GK-011", name: "Riya Gupta", parentName: "Sanjay Gupta", course: "Hindi", level: 2, timing: "Sun 10–11 AM", enrollDate: "2026-06-08", status: "Overdue" as const, amountPaid: "0.00", method: null, receipt: null },
        { code: "GK-012", name: "Ayaan Khan", parentName: "Irfan Khan", course: "Sanskrit", level: 2, timing: "Sun 11–12 PM", enrollDate: "2026-06-08", status: "Paid" as const, amountPaid: "150.00", method: "Zelle", receipt: "RCP-2026-012" },
        { code: "GK-013", name: "Ishaan Mehta", parentName: "Rohit Mehta", course: "Gujarati", level: 1, timing: "Sat 12–1 PM", enrollDate: "2026-06-08", status: "Paid" as const, amountPaid: "150.00", method: "Check", receipt: "RCP-2026-013" },
        { code: "GK-014", name: "Lakshmi Iyer", parentName: "Venkat Iyer", course: "Tamil", level: 2, timing: "Sat 11–12 PM", enrollDate: "2026-06-08", status: "Pending" as const, amountPaid: "0.00", method: null, receipt: null },
        { code: "GK-015", name: "Sai Krishnan", parentName: "Balaji Krishnan", course: "Telugu", level: 3, timing: "Sat 10–11 AM", enrollDate: "2026-06-08", status: "Paid" as const, amountPaid: "150.00", method: "Cash", receipt: "RCP-2026-015" },
      ];

      for (const s of studentData) {
        const [student] = await db.insert(studentsTable).values({
          studentCode: s.code,
          name: s.name,
          parentName: s.parentName,
        }).returning();

        const courseLevelId = findLevelId(s.course, s.level);
        if (!courseLevelId) continue;

        const [enrollment] = await db.insert(enrollmentsTable).values({
          studentId: student.id,
          courseLevelId,
          enrollDate: s.enrollDate,
          status: "Enrolled",
        }).returning();

        await db.insert(paymentsTable).values({
          enrollmentId: enrollment.id,
          amountDue: "150.00",
          amountPaid: s.amountPaid,
          paymentStatus: s.status,
          paymentMethod: s.method,
          receiptId: s.receipt,
        });
      }
      logger.info("Students, enrollments, and payments seeded.");
    }

    // --- Inventory ---
    const existingInventory = await db.select().from(inventoryTable);
    if (existingInventory.length === 0) {
      logger.info("Seeding inventory...");
      await db.insert(inventoryTable).values([
        { name: "Hindi Textbook Level 1", category: "Books", dateProcured: "2026-05-15", quantityProcured: 50, currentStock: 32, reorderLevel: 15, lastReplenishment: "2026-05-15", vendor: "Bhartiya Pustak Bhandar", remarks: "Standard curriculum book" },
        { name: "Sanskrit Primer", category: "Books", dateProcured: "2026-05-15", quantityProcured: 30, currentStock: 8, reorderLevel: 10, lastReplenishment: "2026-05-15", vendor: "Samskrita Bharati", remarks: "Low stock — order soon" },
        { name: "Dharma Workbook", category: "Books", dateProcured: "2026-05-20", quantityProcured: 40, currentStock: 25, reorderLevel: 10, lastReplenishment: "2026-05-20", vendor: "Temple Publications", remarks: "" },
        { name: "Telugu Reader Level 1", category: "Books", dateProcured: "2026-05-20", quantityProcured: 25, currentStock: 18, reorderLevel: 8, lastReplenishment: "2026-05-20", vendor: "Telugu Academy", remarks: "" },
        { name: "Tamil Alphabet Chart", category: "Books", dateProcured: "2026-05-10", quantityProcured: 30, currentStock: 5, reorderLevel: 8, lastReplenishment: "2026-05-10", vendor: "Tamil Sangam", remarks: "Very low — urgent reorder" },
        { name: "Gujarati Story Book", category: "Books", dateProcured: "2026-05-10", quantityProcured: 20, currentStock: 14, reorderLevel: 5, lastReplenishment: "2026-05-10", vendor: "Gujarat Vidyapith", remarks: "" },
        { name: "Gurukul Drawstring Bag", category: "Bags", dateProcured: "2026-05-01", quantityProcured: 100, currentStock: 45, reorderLevel: 20, lastReplenishment: "2026-05-01", vendor: "Local Vendor - Columbus", remarks: "BHT logo printed" },
        { name: "Pencil Case", category: "Bags", dateProcured: "2026-05-01", quantityProcured: 80, currentStock: 12, reorderLevel: 20, lastReplenishment: "2026-05-01", vendor: "Office Depot", remarks: "Low — reorder needed" },
        { name: "A4 Ruled Paper (Reams)", category: "Papers", dateProcured: "2026-05-15", quantityProcured: 20, currentStock: 14, reorderLevel: 5, lastReplenishment: "2026-05-15", vendor: "Staples", remarks: "" },
        { name: "Worksheet Paper (500 sheets)", category: "Papers", dateProcured: "2026-05-15", quantityProcured: 10, currentStock: 3, reorderLevel: 3, lastReplenishment: "2026-05-15", vendor: "Staples", remarks: "At reorder level" },
        { name: "Pencils (Box of 24)", category: "Supplies", dateProcured: "2026-05-20", quantityProcured: 15, currentStock: 9, reorderLevel: 4, lastReplenishment: "2026-05-20", vendor: "Amazon", remarks: "" },
        { name: "Crayons (24 color sets)", category: "Supplies", dateProcured: "2026-05-20", quantityProcured: 20, currentStock: 16, reorderLevel: 5, lastReplenishment: "2026-05-20", vendor: "Amazon", remarks: "" },
        { name: "Whiteboard Markers (Pack)", category: "Supplies", dateProcured: "2026-05-01", quantityProcured: 10, currentStock: 2, reorderLevel: 3, lastReplenishment: "2026-05-01", vendor: "Office Depot", remarks: "Below reorder — urgent" },
        { name: "Award Certificates (Blank)", category: "Supplies", dateProcured: "2026-04-01", quantityProcured: 200, currentStock: 145, reorderLevel: 50, lastReplenishment: "2026-04-01", vendor: "Temple Print Shop", remarks: "For Annual Day use" },
      ]);
      logger.info("Inventory seeded.");
    }
  } catch (err) {
    logger.error({ err }, "Seed failed");
  }
}
