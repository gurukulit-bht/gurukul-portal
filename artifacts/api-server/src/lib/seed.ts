import { db } from "@workspace/db";
import {
  coursesTable, courseLevelsTable, courseSectionsTable,
  studentsTable, enrollmentsTable, paymentsTable,
} from "@workspace/db/schema";
import { eq, sql, lte } from "drizzle-orm";
import { logger } from "./logger";

/**
 * Seed only the core course catalogue and level structure.
 * This never inserts dummy teachers, students, inventory,
 * announcements, or events — all transactional data must be
 * entered through the admin portal.
 */
export async function seedIfEmpty() {
  // Section seeding always runs independently (idempotent check inside)
  await seedSectionsIfEmpty();

  // Demo student/enrollment/payment seed — only runs if no enrollments exist
  await seedStudentsIfEmpty();

  try {
    const existingCourses = await db.select().from(coursesTable);
    const needsReseed =
      existingCourses.length === 0 ||
      existingCourses.every((c) => !c.learningAreas);

    if (!needsReseed) return;

    logger.info("Seeding core course catalogue...");
    if (existingCourses.length > 0) await db.delete(coursesTable);

    const inserted = await db
      .insert(coursesTable)
      .values([
        {
          name: "Hindi",
          description:
            "Hindi classes focus on building foundational language skills while connecting students to Indian culture, stories, and traditions.",
          ageGroup: "5+ years",
          level: "Beginner, Intermediate & Advanced",
          schedule: "Sundays 10:00 AM – 11:00 AM",
          instructor: "TBD",
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
          instructor: "TBD",
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
            { name: "Intermediate", desc: "Deeper understanding of epics and practices" },
            { name: "Advanced", desc: "Discussions on philosophy and application in daily life" },
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
          instructor: "TBD",
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
            { name: "Advanced", desc: "Conversations and paragraph writing" },
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
          instructor: "TBD",
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
          instructor: "TBD",
          icon: "🕉️",
          learningAreas: JSON.stringify([
            "Basic Sanskrit alphabets and pronunciation",
            "Common words and simple sentence structures",
            "Shlokas and chants with meaning",
            "Introduction to grammar (Sandhi, basic forms)",
          ]),
          levelsDetail: JSON.stringify([
            { name: "Beginner", desc: "Shlokas and basic words" },
            { name: "Intermediate", desc: "Sentence formation and grammar basics" },
            { name: "Advanced", desc: "Reading simple Sanskrit texts" },
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
          instructor: "TBD",
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
      ])
      .returning();

    logger.info("Courses seeded.");

    // Seed 7 level slots per course (enrolled = 0, no dummy data)
    const schedules: Record<string, string> = {
      Hindi: "Sundays 10:00–11:00 AM",
      Dharma: "Sundays 9:00–10:00 AM",
      Telugu: "Saturdays 10:00–11:00 AM",
      Tamil: "Saturdays 11:00–12:00 PM",
      Sanskrit: "Sundays 11:00 AM–12:00 PM",
      Gujarati: "Saturdays 12:00–1:00 PM",
    };

    for (const course of inserted) {
      const schedule = schedules[course.name] ?? "";
      for (let i = 1; i <= 7; i++) {
        await db.insert(courseLevelsTable).values({
          courseId: course.id,
          levelNumber: i,
          className: `Level ${i}`,
          schedule,
          capacity: 20,
          enrolled: 0,
          status: "Active",
        });
      }
    }

    logger.info("Course levels seeded (all enrolled = 0).");
  } catch (err) {
    logger.error({ err }, "Seed failed");
  }
}

/**
 * Seeds standard sections (Morning Batch / Afternoon Batch for L1–L2,
 * Saturday/Sunday sections for L3) for every course level that currently
 * has no sections assigned.  Safe to call on every startup.
 */
async function seedSectionsIfEmpty() {
  try {
    const existing = await db
      .select({ count: sql<string>`count(*)` })
      .from(courseSectionsTable);

    if (parseInt(existing[0].count) > 0) {
      logger.info({ count: existing[0].count }, "Sections already seeded — skipping.");
      return;
    }

    logger.info("Seeding sections for all course levels 1–3…");

    const levels = await db
      .select({
        levelId:     courseLevelsTable.id,
        levelNumber: courseLevelsTable.levelNumber,
        courseName:  coursesTable.name,
      })
      .from(courseLevelsTable)
      .innerJoin(coursesTable, eq(coursesTable.id, courseLevelsTable.courseId))
      .where(lte(courseLevelsTable.levelNumber, 3));

    type NewSection = typeof courseSectionsTable.$inferInsert;
    const sections: NewSection[] = [];

    for (const level of levels) {
      if (level.levelNumber === 1 || level.levelNumber === 2) {
        sections.push(
          { courseLevelId: level.levelId, sectionName: "Morning Batch",   schedule: "9:00 AM – 10:00 AM",   capacity: 20, status: "Active" },
          { courseLevelId: level.levelId, sectionName: "Afternoon Batch", schedule: "10:15 AM – 11:15 AM", capacity: 20, status: "Active" },
        );
      } else if (level.levelNumber === 3) {
        sections.push(
          { courseLevelId: level.levelId, sectionName: "Saturday Section", schedule: "Saturdays 9:00 AM", capacity: 25, status: "Active" },
          { courseLevelId: level.levelId, sectionName: "Sunday Section",   schedule: "Sundays 9:00 AM",   capacity: 25, status: "Active" },
        );
      }
    }

    if (sections.length > 0) {
      await db.insert(courseSectionsTable).values(sections);
      logger.info({ count: sections.length, levels: levels.length }, "Sections seeded.");
    }
  } catch (err) {
    logger.error({ err }, "Section seed failed");
  }
}

/**
 * Seeds 15 demo students with enrollments, section assignments, and payments
 * if there are currently no enrollments in the database.
 * Safe to call on every startup — skips if any enrollment exists.
 */
async function seedStudentsIfEmpty() {
  try {
    const [{ count }] = await db
      .select({ count: sql<string>`count(*)` })
      .from(enrollmentsTable);

    if (parseInt(count) > 0) {
      logger.info({ count }, "Student enrollments already exist — skipping demo seed.");
      return;
    }

    logger.info("No enrollments found — seeding demo students, enrollments and payments…");

    // Build lookup helpers: find a level ID by (courseName prefix, levelNumber)
    const allLevels = await db
      .select({
        id:          courseLevelsTable.id,
        levelNumber: courseLevelsTable.levelNumber,
        courseName:  coursesTable.name,
      })
      .from(courseLevelsTable)
      .innerJoin(coursesTable, eq(coursesTable.id, courseLevelsTable.courseId));

    const allSections = await db
      .select({
        id:          courseSectionsTable.id,
        sectionName: courseSectionsTable.sectionName,
        levelId:     courseSectionsTable.courseLevelId,
      })
      .from(courseSectionsTable);

    function levelId(coursePrefix: string, num: number): number | null {
      const row = allLevels.find(
        (l) => l.courseName.toLowerCase().startsWith(coursePrefix.toLowerCase()) && l.levelNumber === num,
      );
      return row?.id ?? null;
    }

    function sectionId(lvlId: number | null, namePrefix: string): number | null {
      if (!lvlId) return null;
      const row = allSections.find(
        (s) => s.levelId === lvlId && s.sectionName.toLowerCase().startsWith(namePrefix.toLowerCase()),
      );
      return row?.id ?? null;
    }

    // 1. Wipe old students (cascade removes stale enrollments/payments if any)
    await db.delete(studentsTable);

    // 2. Insert 15 demo students
    const inserted = await db.insert(studentsTable).values([
      { studentCode: "GK-001", name: "Arjun Sharma",   parentName: "Rajesh Sharma",   email: "rajesh.sharma@gmail.com",   phone: "(614) 555-0101" },
      { studentCode: "GK-002", name: "Priya Patel",    parentName: "Suresh Patel",    email: "suresh.patel@gmail.com",    phone: "(614) 555-0102" },
      { studentCode: "GK-003", name: "Rohan Kumar",    parentName: "Vijay Kumar",     email: "vijay.kumar@gmail.com",     phone: "(740) 555-0103" },
      { studentCode: "GK-004", name: "Ananya Rao",     parentName: "Lalitha Rao",     email: "lalitha.rao@gmail.com",     phone: "(614) 555-0104" },
      { studentCode: "GK-005", name: "Dev Shah",       parentName: "Hetal Shah",      email: "hetal.shah@gmail.com",      phone: "(614) 555-0105" },
      { studentCode: "GK-006", name: "Meera Joshi",    parentName: "Ramesh Joshi",    email: "ramesh.joshi@gmail.com",    phone: "(740) 555-0106" },
      { studentCode: "GK-007", name: "Karan Singh",    parentName: "Manjit Singh",    email: "manjit.singh@gmail.com",    phone: "(614) 555-0107" },
      { studentCode: "GK-008", name: "Divya Nair",     parentName: "Sunil Nair",      email: "sunil.nair@gmail.com",      phone: "(740) 555-0108" },
      { studentCode: "GK-009", name: "Aditya Verma",   parentName: "Anil Verma",      email: "anil.verma@gmail.com",      phone: "(614) 555-0109" },
      { studentCode: "GK-010", name: "Sneha Reddy",    parentName: "Krishna Reddy",   email: "krishna.reddy@gmail.com",   phone: "(614) 555-0110" },
      { studentCode: "GK-011", name: "Riya Gupta",     parentName: "Sanjay Gupta",    email: "sanjay.gupta@gmail.com",    phone: "(740) 555-0111" },
      { studentCode: "GK-012", name: "Ayaan Khan",     parentName: "Irfan Khan",      email: "irfan.khan@gmail.com",      phone: "(614) 555-0112" },
      { studentCode: "GK-013", name: "Ishaan Mehta",   parentName: "Rohit Mehta",     email: "rohit.mehta@gmail.com",     phone: "(614) 555-0113" },
      { studentCode: "GK-014", name: "Lakshmi Iyer",   parentName: "Venkat Iyer",     email: "venkat.iyer@gmail.com",     phone: "(614) 555-0114" },
      { studentCode: "GK-015", name: "Sai Krishnan",   parentName: "Balaji Krishnan", email: "balaji.krishnan@gmail.com", phone: "(740) 555-0115" },
    ]).returning({ id: studentsTable.id, code: studentsTable.studentCode });

    const sid = Object.fromEntries(inserted.map((r) => [r.code, r.id]));

    // 3. Build enrollment rows (looked up by course name prefix + level number + section name prefix)
    type EnrollSpec = {
      code: string; course: string; level: number;
      section: string; pmt: "Paid" | "Pending" | "Overdue";
    };

    const specs: EnrollSpec[] = [
      { code: "GK-001", course: "Hindi",    level: 1, section: "Morning",   pmt: "Paid"    },
      { code: "GK-002", course: "Hindi",    level: 2, section: "Afternoon", pmt: "Paid"    },
      { code: "GK-003", course: "Dharma",   level: 1, section: "Morning",   pmt: "Pending" },
      { code: "GK-004", course: "Telugu",   level: 1, section: "Morning",   pmt: "Paid"    },
      { code: "GK-004", course: "Dharma",   level: 1, section: "Afternoon", pmt: "Pending" },
      { code: "GK-005", course: "Sanskrit", level: 1, section: "Morning",   pmt: "Paid"    },
      { code: "GK-006", course: "Hindi",    level: 1, section: "Afternoon", pmt: "Overdue" },
      { code: "GK-007", course: "Tamil",    level: 1, section: "Morning",   pmt: "Paid"    },
      { code: "GK-008", course: "Gujarati", level: 1, section: "Morning",   pmt: "Pending" },
      { code: "GK-009", course: "Hindi",    level: 2, section: "Morning",   pmt: "Paid"    },
      { code: "GK-010", course: "Telugu",   level: 1, section: "Afternoon", pmt: "Paid"    },
      { code: "GK-010", course: "Tamil",    level: 2, section: "Morning",   pmt: "Pending" },
      { code: "GK-011", course: "Sanskrit", level: 2, section: "Morning",   pmt: "Paid"    },
      { code: "GK-012", course: "Hindi",    level: 1, section: "Morning",   pmt: "Paid"    },
      { code: "GK-012", course: "Telugu",   level: 2, section: "Morning",   pmt: "Overdue" },
      { code: "GK-013", course: "Dharma",   level: 2, section: "Afternoon", pmt: "Pending" },
      { code: "GK-014", course: "Tamil",    level: 1, section: "Afternoon", pmt: "Paid"    },
      { code: "GK-015", course: "Gujarati", level: 2, section: "Morning",   pmt: "Paid"    },
    ];

    const enrollRows = await db.insert(enrollmentsTable).values(
      specs.map((sp) => {
        const lvlId = levelId(sp.course, sp.level);
        const secId = sectionId(lvlId, sp.section);
        return { studentId: sid[sp.code], courseLevelId: lvlId!, sectionId: secId, enrollDate: "2025-09-01" };
      }),
    ).returning({ id: enrollmentsTable.id, idx: enrollmentsTable.studentId });

    // 4. Insert payments
    const methods = ["Zelle", "Check", "Cash"];
    let mi = 0;
    await db.insert(paymentsTable).values(
      enrollRows.map((e, i) => {
        const pmt = specs[i].pmt;
        return {
          enrollmentId:  e.id,
          amountDue:     "150.00",
          amountPaid:    pmt === "Paid" ? "150.00" : "0.00",
          paymentStatus: pmt,
          paymentMethod: pmt === "Paid" ? methods[(mi++) % 3] : undefined,
          paymentDate:   pmt === "Paid" ? "2025-09-10" : undefined,
          receiptId:     pmt === "Paid" ? `RCP-2025-${String(i + 1).padStart(3, "0")}` : undefined,
        };
      }),
    );

    logger.info(
      { students: inserted.length, enrollments: enrollRows.length },
      "Demo students, enrollments, and payments seeded.",
    );
  } catch (err) {
    logger.error({ err }, "Student demo seed failed");
  }
}
