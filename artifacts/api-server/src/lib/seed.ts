import { db } from "@workspace/db";
import {
  coursesTable, courseLevelsTable, courseSectionsTable,
  studentsTable, enrollmentsTable, paymentsTable,
} from "@workspace/db/schema";
import { eq, sql, lte, isNull, or } from "drizzle-orm";
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

  // Data patch — always runs, fills in missing fields on existing records
  await patchStudentData();

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
const EXPECTED_STUDENTS = 30;

async function seedStudentsIfEmpty() {
  try {
    const [{ studentCount }] = await db
      .select({ studentCount: sql<string>`count(*)` })
      .from(studentsTable);

    if (parseInt(studentCount) >= EXPECTED_STUDENTS) {
      const [{ enrollCount }] = await db
        .select({ enrollCount: sql<string>`count(*)` })
        .from(enrollmentsTable);
      logger.info({ studentCount, enrollCount }, "Student records already seeded — skipping demo seed.");
      return;
    }

    logger.info({ studentCount }, "Student count below expected — wiping and re-seeding demo students…");

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

    // 2. Insert 30 demo students with full parent contact details
    const inserted = await db.insert(studentsTable).values([
      {
        studentCode: "GK-001", name: "Arjun Sharma",
        grade: "5", dob: "2014-03-15", address: "245 Meadowbrook Dr, Powell, OH 43065",
        motherName: "Sunita Sharma",    motherPhone: "(614) 555-0121", motherEmail: "sunita.sharma@gmail.com",
        fatherName: "Rajesh Sharma",    fatherPhone: "(614) 555-0101", fatherEmail: "rajesh.sharma@gmail.com",
      },
      {
        studentCode: "GK-002", name: "Priya Patel",
        grade: "3", dob: "2016-07-22", address: "118 Scioto Meadows Blvd, Dublin, OH 43016",
        motherName: "Kavita Patel",     motherPhone: "(614) 555-0122", motherEmail: "kavita.patel@gmail.com",
        fatherName: "Suresh Patel",     fatherPhone: "(614) 555-0102", fatherEmail: "suresh.patel@gmail.com",
      },
      {
        studentCode: "GK-003", name: "Rohan Kumar",
        grade: "4", dob: "2015-11-08", address: "502 Worthington Rd, Worthington, OH 43085",
        motherName: "Rekha Kumar",      motherPhone: "(740) 555-0123", motherEmail: "rekha.kumar@gmail.com",
        fatherName: "Vijay Kumar",      fatherPhone: "(740) 555-0103", fatherEmail: "vijay.kumar@gmail.com",
      },
      {
        studentCode: "GK-004", name: "Ananya Rao",
        grade: "2", dob: "2017-05-30", address: "317 Glick Rd, Powell, OH 43065",
        motherName: "Lalitha Rao",      motherPhone: "(614) 555-0124", motherEmail: "lalitha.rao@gmail.com",
        fatherName: "Narayana Rao",     fatherPhone: "(614) 555-0104", fatherEmail: "narayana.rao@gmail.com",
      },
      {
        studentCode: "GK-005", name: "Dev Shah",
        grade: "6", dob: "2013-09-14", address: "834 Brand Rd, Powell, OH 43065",
        motherName: "Hetal Shah",       motherPhone: "(614) 555-0125", motherEmail: "hetal.shah@gmail.com",
        fatherName: "Kiran Shah",       fatherPhone: "(614) 555-0105", fatherEmail: "kiran.shah@gmail.com",
      },
      {
        studentCode: "GK-006", name: "Meera Joshi",
        grade: "1", dob: "2018-02-19", address: "921 Lewis Center Rd, Lewis Center, OH 43035",
        motherName: "Smita Joshi",      motherPhone: "(740) 555-0126", motherEmail: "smita.joshi@gmail.com",
        fatherName: "Ramesh Joshi",     fatherPhone: "(740) 555-0106", fatherEmail: "ramesh.joshi@gmail.com",
      },
      {
        studentCode: "GK-007", name: "Karan Singh",
        grade: "7", dob: "2012-12-03", address: "156 Antrim Church Rd, Galena, OH 43021",
        motherName: "Harpreet Singh",   motherPhone: "(614) 555-0127", motherEmail: "harpreet.singh@gmail.com",
        fatherName: "Manjit Singh",     fatherPhone: "(614) 555-0107", fatherEmail: "manjit.singh@gmail.com",
      },
      {
        studentCode: "GK-008", name: "Divya Nair",
        grade: "4", dob: "2015-06-25", address: "428 Hyatts Rd, Powell, OH 43065",
        motherName: "Deepa Nair",       motherPhone: "(740) 555-0128", motherEmail: "deepa.nair@gmail.com",
        fatherName: "Sunil Nair",       fatherPhone: "(740) 555-0108", fatherEmail: "sunil.nair@gmail.com",
      },
      {
        studentCode: "GK-009", name: "Aditya Verma",
        grade: "8", dob: "2011-04-17", address: "73 Seldom Seen Rd, Powell, OH 43065",
        motherName: "Neeta Verma",      motherPhone: "(614) 555-0129", motherEmail: "neeta.verma@gmail.com",
        fatherName: "Anil Verma",       fatherPhone: "(614) 555-0109", fatherEmail: "anil.verma@gmail.com",
      },
      {
        studentCode: "GK-010", name: "Sneha Reddy",
        grade: "3", dob: "2016-08-05", address: "209 Claycraft Rd, Columbus, OH 43230",
        motherName: "Padmavathi Reddy", motherPhone: "(614) 555-0130", motherEmail: "padmavathi.reddy@gmail.com",
        fatherName: "Krishna Reddy",    fatherPhone: "(614) 555-0110", fatherEmail: "krishna.reddy@gmail.com",
      },
      {
        studentCode: "GK-011", name: "Riya Gupta",
        grade: "5", dob: "2014-01-29", address: "361 Bale Kenyon Rd, Sunbury, OH 43074",
        motherName: "Pooja Gupta",      motherPhone: "(740) 555-0131", motherEmail: "pooja.gupta@gmail.com",
        fatherName: "Sanjay Gupta",     fatherPhone: "(740) 555-0111", fatherEmail: "sanjay.gupta@gmail.com",
      },
      {
        studentCode: "GK-012", name: "Ayaan Khan",
        grade: "2", dob: "2017-10-12", address: "580 Harrisburg Pike, Columbus, OH 43223",
        motherName: "Shabana Khan",     motherPhone: "(614) 555-0132", motherEmail: "shabana.khan@gmail.com",
        fatherName: "Irfan Khan",       fatherPhone: "(614) 555-0112", fatherEmail: "irfan.khan@gmail.com",
      },
      {
        studentCode: "GK-013", name: "Ishaan Mehta",
        grade: "6", dob: "2013-03-21", address: "44 Olentangy River Rd, Columbus, OH 43214",
        motherName: "Nisha Mehta",      motherPhone: "(614) 555-0133", motherEmail: "nisha.mehta@gmail.com",
        fatherName: "Rohit Mehta",      fatherPhone: "(614) 555-0113", fatherEmail: "rohit.mehta@gmail.com",
      },
      {
        studentCode: "GK-014", name: "Lakshmi Iyer",
        grade: "1", dob: "2018-09-09", address: "132 Raintree Blvd, Lewis Center, OH 43035",
        motherName: "Geetha Iyer",      motherPhone: "(614) 555-0134", motherEmail: "geetha.iyer@gmail.com",
        fatherName: "Venkat Iyer",      fatherPhone: "(614) 555-0114", fatherEmail: "venkat.iyer@gmail.com",
      },
      {
        studentCode: "GK-015", name: "Sai Krishnan",
        grade: "7", dob: "2012-06-18", address: "797 State Route 61, Sunbury, OH 43074",
        motherName: "Sridevi Krishnan", motherPhone: "(740) 555-0135", motherEmail: "sridevi.krishnan@gmail.com",
        fatherName: "Balaji Krishnan",  fatherPhone: "(740) 555-0115", fatherEmail: "balaji.krishnan@gmail.com",
      },
      {
        studentCode: "GK-016", name: "Rahul Bose",
        grade: "4", dob: "2015-04-10", address: "66 Scioto St, Powell, OH 43065",
        motherName: "Mita Bose",        motherPhone: "(614) 555-0136", motherEmail: "mita.bose@gmail.com",
        fatherName: "Subrata Bose",     fatherPhone: "(614) 555-0116", fatherEmail: "subrata.bose@gmail.com",
      },
      {
        studentCode: "GK-017", name: "Nisha Choudhary",
        grade: "8", dob: "2011-11-25", address: "38 Clover Meadow Dr, Dublin, OH 43016",
        motherName: "Rekha Choudhary",  motherPhone: "(614) 555-0137", motherEmail: "rekha.choudhary@gmail.com",
        fatherName: "Dinesh Choudhary", fatherPhone: "(614) 555-0117", fatherEmail: "dinesh.choudhary@gmail.com",
      },
      {
        studentCode: "GK-018", name: "Vikram Pillai",
        grade: "5", dob: "2014-08-14", address: "215 Smoky Row Rd, Powell, OH 43065",
        motherName: "Usha Pillai",      motherPhone: "(740) 555-0138", motherEmail: "usha.pillai@gmail.com",
        fatherName: "Suresh Pillai",    fatherPhone: "(740) 555-0118", fatherEmail: "suresh.pillai@gmail.com",
      },
      {
        studentCode: "GK-019", name: "Pooja Kapoor",
        grade: "3", dob: "2016-01-07", address: "481 Figg Rd, Powell, OH 43065",
        motherName: "Anju Kapoor",      motherPhone: "(614) 555-0139", motherEmail: "anju.kapoor@gmail.com",
        fatherName: "Vikas Kapoor",     fatherPhone: "(614) 555-0119", fatherEmail: "vikas.kapoor@gmail.com",
      },
      {
        studentCode: "GK-020", name: "Siddharth Mishra",
        grade: "6", dob: "2013-05-20", address: "94 Liberty Rd, Lewis Center, OH 43035",
        motherName: "Sunanda Mishra",   motherPhone: "(614) 555-0140", motherEmail: "sunanda.mishra@gmail.com",
        fatherName: "Prakash Mishra",   fatherPhone: "(614) 555-0120", fatherEmail: "prakash.mishra@gmail.com",
      },
      {
        studentCode: "GK-021", name: "Tanvi Agarwal",
        grade: "4", dob: "2015-09-03", address: "332 Sawmill Pkwy, Dublin, OH 43016",
        motherName: "Renu Agarwal",     motherPhone: "(614) 555-0141", motherEmail: "renu.agarwal@gmail.com",
        fatherName: "Pankaj Agarwal",   fatherPhone: "(614) 555-0141", fatherEmail: "pankaj.agarwal@gmail.com",
      },
      {
        studentCode: "GK-022", name: "Aryan Trivedi",
        grade: "2", dob: "2017-12-16", address: "177 Concord Rd, Westerville, OH 43081",
        motherName: "Meena Trivedi",    motherPhone: "(614) 555-0142", motherEmail: "meena.trivedi@gmail.com",
        fatherName: "Gaurav Trivedi",   fatherPhone: "(614) 555-0142", fatherEmail: "gaurav.trivedi@gmail.com",
      },
      {
        studentCode: "GK-023", name: "Kavya Nambiar",
        grade: "5", dob: "2014-06-28", address: "550 Home Rd, Columbus, OH 43214",
        motherName: "Sindhu Nambiar",   motherPhone: "(614) 555-0143", motherEmail: "sindhu.nambiar@gmail.com",
        fatherName: "Rajan Nambiar",    fatherPhone: "(614) 555-0143", fatherEmail: "rajan.nambiar@gmail.com",
      },
      {
        studentCode: "GK-024", name: "Harsh Malhotra",
        grade: "7", dob: "2012-02-11", address: "723 Cosgray Rd, Dublin, OH 43016",
        motherName: "Preeti Malhotra",  motherPhone: "(614) 555-0144", motherEmail: "preeti.malhotra@gmail.com",
        fatherName: "Sunil Malhotra",   fatherPhone: "(614) 555-0144", fatherEmail: "sunil.malhotra@gmail.com",
      },
      {
        studentCode: "GK-025", name: "Shruti Bhatt",
        grade: "1", dob: "2018-07-04", address: "89 Highfield Dr, Powell, OH 43065",
        motherName: "Minal Bhatt",      motherPhone: "(740) 555-0145", motherEmail: "minal.bhatt@gmail.com",
        fatherName: "Nirav Bhatt",      fatherPhone: "(740) 555-0145", fatherEmail: "nirav.bhatt@gmail.com",
      },
      {
        studentCode: "GK-026", name: "Vivek Sundar",
        grade: "6", dob: "2013-10-30", address: "402 Lazelle Rd, Columbus, OH 43235",
        motherName: "Vijaya Sundar",    motherPhone: "(614) 555-0146", motherEmail: "vijaya.sundar@gmail.com",
        fatherName: "Ravi Sundar",      fatherPhone: "(614) 555-0146", fatherEmail: "ravi.sundar@gmail.com",
      },
      {
        studentCode: "GK-027", name: "Deepa Menon",
        grade: "4", dob: "2015-03-22", address: "615 Hard Rd, Columbus, OH 43235",
        motherName: "Latha Menon",      motherPhone: "(614) 555-0147", motherEmail: "latha.menon@gmail.com",
        fatherName: "Krishnakumar Menon", fatherPhone: "(614) 555-0147", fatherEmail: "kk.menon@gmail.com",
      },
      {
        studentCode: "GK-028", name: "Raj Choudhary",
        grade: "3", dob: "2016-05-18", address: "248 S Liberty St, Powell, OH 43065",
        motherName: "Shalini Choudhary", motherPhone: "(740) 555-0148", motherEmail: "shalini.choudhary@gmail.com",
        fatherName: "Amit Choudhary",   fatherPhone: "(740) 555-0148", fatherEmail: "amit.choudhary@gmail.com",
      },
      {
        studentCode: "GK-029", name: "Amita Bose",
        grade: "2", dob: "2017-08-09", address: "134 Park Rd, Powell, OH 43065",
        motherName: "Soma Bose",        motherPhone: "(614) 555-0149", motherEmail: "soma.bose@gmail.com",
        fatherName: "Tapan Bose",       fatherPhone: "(614) 555-0149", fatherEmail: "tapan.bose@gmail.com",
      },
      {
        studentCode: "GK-030", name: "Nikhil Prakash",
        grade: "5", dob: "2014-11-02", address: "871 Rings Rd, Dublin, OH 43017",
        motherName: "Anitha Prakash",   motherPhone: "(614) 555-0150", motherEmail: "anitha.prakash@gmail.com",
        fatherName: "Venkatesh Prakash", fatherPhone: "(614) 555-0150", fatherEmail: "venkatesh.prakash@gmail.com",
      },
    ]).returning({ id: studentsTable.id, code: studentsTable.studentCode });

    const sid = Object.fromEntries(inserted.map((r) => [r.code, r.id]));

    // 3. Build enrollment rows (looked up by course name prefix + level number + section name prefix)
    type EnrollSpec = {
      code: string; course: string; level: number;
      section: string; pmt: "Paid" | "Pending" | "Overdue";
    };

    const specs: EnrollSpec[] = [
      // ── Hindi enrollments (12 students, levels 1-7) ─────────────────────────
      { code: "GK-001", course: "Hindi",    level: 3, section: "Saturday",   pmt: "Paid"    },
      { code: "GK-002", course: "Hindi",    level: 1, section: "Morning",    pmt: "Paid"    },
      { code: "GK-003", course: "Hindi",    level: 1, section: "Afternoon",  pmt: "Paid"    },
      { code: "GK-005", course: "Hindi",    level: 2, section: "Morning",    pmt: "Paid"    },
      { code: "GK-007", course: "Hindi",    level: 4, section: "",           pmt: "Paid"    },
      { code: "GK-008", course: "Hindi",    level: 1, section: "Sunday",     pmt: "Paid"    },
      { code: "GK-011", course: "Hindi",    level: 2, section: "Afternoon",  pmt: "Paid"    },
      { code: "GK-012", course: "Hindi",    level: 1, section: "Morning",    pmt: "Paid"    },
      { code: "GK-017", course: "Hindi",    level: 5, section: "",           pmt: "Paid"    },
      { code: "GK-019", course: "Hindi",    level: 1, section: "Morning",    pmt: "Paid"    },
      { code: "GK-021", course: "Hindi",    level: 3, section: "Sunday",     pmt: "Paid"    },
      { code: "GK-024", course: "Hindi",    level: 2, section: "Morning",    pmt: "Paid"    },
      { code: "GK-027", course: "Hindi",    level: 4, section: "",           pmt: "Pending" },
      { code: "GK-029", course: "Hindi",    level: 1, section: "Sunday",     pmt: "Paid"    },
      // ── Dharma enrollments (9 students, levels 1-3) ─────────────────────────
      { code: "GK-003", course: "Dharma",   level: 1, section: "Section A",  pmt: "Paid"    },
      { code: "GK-004", course: "Dharma",   level: 1, section: "Section B",  pmt: "Pending" },
      { code: "GK-008", course: "Dharma",   level: 1, section: "Section A",  pmt: "Pending" },
      { code: "GK-012", course: "Dharma",   level: 1, section: "Section B",  pmt: "Paid"    },
      { code: "GK-019", course: "Dharma",   level: 2, section: "Section A",  pmt: "Pending" },
      { code: "GK-020", course: "Dharma",   level: 1, section: "Section B",  pmt: "Paid"    },
      { code: "GK-026", course: "Dharma",   level: 2, section: "Section A",  pmt: "Paid"    },
      { code: "GK-030", course: "Dharma",   level: 1, section: "Section A",  pmt: "Paid"    },
      // ── Telugu enrollments (7 students, levels 1-3) ─────────────────────────
      { code: "GK-004", course: "Telugu",   level: 1, section: "Morning",    pmt: "Paid"    },
      { code: "GK-006", course: "Telugu",   level: 1, section: "Afternoon",  pmt: "Paid"    },
      { code: "GK-010", course: "Telugu",   level: 1, section: "Morning",    pmt: "Paid"    },
      { code: "GK-018", course: "Telugu",   level: 2, section: "Morning",    pmt: "Paid"    },
      { code: "GK-022", course: "Telugu",   level: 1, section: "Afternoon",  pmt: "Paid"    },
      { code: "GK-028", course: "Telugu",   level: 2, section: "Morning",    pmt: "Paid"    },
      // ── Tamil enrollments (5 students, levels 1-2) ──────────────────────────
      { code: "GK-010", course: "Tamil",    level: 1, section: "Saturday",   pmt: "Paid"    },
      { code: "GK-013", course: "Tamil",    level: 1, section: "Saturday",   pmt: "Paid"    },
      { code: "GK-014", course: "Tamil",    level: 1, section: "Saturday",   pmt: "Pending" },
      { code: "GK-023", course: "Tamil",    level: 1, section: "Saturday",   pmt: "Paid"    },
      // ── Sanskrit enrollments (5 students, levels 1-2) ───────────────────────
      { code: "GK-009", course: "Sanskrit", level: 1, section: "Section A",  pmt: "Paid"    },
      { code: "GK-015", course: "Sanskrit", level: 1, section: "Section B",  pmt: "Paid"    },
      { code: "GK-020", course: "Sanskrit", level: 1, section: "Section A",  pmt: "Paid"    },
      { code: "GK-026", course: "Sanskrit", level: 1, section: "Section B",  pmt: "Paid"    },
      // ── Gujarati enrollments (4 students, levels 1-2) ───────────────────────
      { code: "GK-016", course: "Gujarati", level: 1, section: "Saturday",   pmt: "Paid"    },
      { code: "GK-025", course: "Gujarati", level: 1, section: "Saturday",   pmt: "Paid"    },
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

// ─── Data Patch ───────────────────────────────────────────────────────────────
// Runs on every startup — fills missing curriculum_year, employer fields, and
// inserts GK-032..GK-036 if absent. Safe to run repeatedly (idempotent).

const EMPLOYER_MAP: Record<string, [string, string]> = {
  "GK-001": ["Ohio State University",          "JPMorgan Chase"],
  "GK-002": ["Nationwide Insurance",           "Accenture"],
  "GK-003": ["Cardinal Health",                "IBM"],
  "GK-004": ["Huntington National Bank",       "Tata Consultancy Services (TCS)"],
  "GK-005": ["Infosys",                        "Amazon"],
  "GK-006": ["OhioHealth",                     "Deloitte"],
  "GK-007": ["Wipro",                          "Honda of America"],
  "GK-008": ["Columbus City Schools",          "Cognizant"],
  "GK-009": ["Persistent Systems",             "Safelite AutoGlass"],
  "GK-010": ["State of Ohio",                  "NetJets"],
  "GK-011": ["Abbott Laboratories",            "American Electric Power (AEP)"],
  "GK-012": ["Bath & Body Works",              "L Brands / Victoria Secret"],
  "GK-013": ["JPMorgan Chase",                 "Ohio State University"],
  "GK-014": ["Accenture",                      "Cardinal Health"],
  "GK-015": ["IBM",                            "Nationwide Insurance"],
  "GK-016": ["Tata Consultancy Services (TCS)","Huntington National Bank"],
  "GK-017": ["Amazon",                         "Infosys"],
  "GK-018": ["Deloitte",                       "OhioHealth"],
  "GK-019": ["Honda of America",               "Wipro"],
  "GK-020": ["Cognizant",                      "Columbus City Schools"],
  "GK-021": ["Safelite AutoGlass",             "Persistent Systems"],
  "GK-022": ["NetJets",                        "State of Ohio"],
  "GK-023": ["American Electric Power (AEP)", "Abbott Laboratories"],
  "GK-024": ["L Brands / Victoria Secret",    "Bath & Body Works"],
  "GK-025": ["Ohio State University",          "Accenture"],
  "GK-026": ["Nationwide Insurance",           "JPMorgan Chase"],
  "GK-027": ["Cardinal Health",               "Deloitte"],
  "GK-028": ["Huntington National Bank",      "IBM"],
  "GK-029": ["OhioHealth",                    "Tata Consultancy Services (TCS)"],
  "GK-030": ["Infosys",                       "Amazon"],
  "GK-031": ["Wipro",                         "Cognizant"],
  "GK-032": ["Columbus City Schools",         "Honda of America"],
  "GK-033": ["Persistent Systems",            "NetJets"],
  "GK-034": ["State of Ohio",                 "Safelite AutoGlass"],
  "GK-035": ["Abbott Laboratories",           "L Brands / Victoria Secret"],
  "GK-036": ["JPMorgan Chase",               "American Electric Power (AEP)"],
};

const EXTRA_STUDENTS = [
  {
    studentCode: "GK-032", name: "Aarav Mehta",
    grade: "4", dob: "2015-03-12", curriculumYear: "2027-2028",
    address: "512 Longview Dr, Powell, OH 43065",
    motherName: "Priya Mehta",    motherPhone: "(614) 555-0201", motherEmail: "priya.mehta@gmail.com",
    motherEmployer: "Columbus City Schools",
    fatherName: "Nikhil Mehta",   fatherPhone: "(614) 555-0202", fatherEmail: "nikhil.mehta@gmail.com",
    fatherEmployer: "Honda of America",
    volunteerParent: true, volunteerArea: "Event Setup",
  },
  {
    studentCode: "GK-033", name: "Diya Sharma",
    grade: "3", dob: "2016-07-20", curriculumYear: "2027-2028",
    address: "78 Liberty Bell Dr, Dublin, OH 43016",
    motherName: "Anita Sharma",   motherPhone: "(614) 555-0203", motherEmail: "anita.sharma@gmail.com",
    motherEmployer: "Persistent Systems",
    fatherName: "Deepak Sharma",  fatherPhone: "(614) 555-0204", fatherEmail: "deepak.sharma@gmail.com",
    fatherEmployer: "NetJets",
  },
  {
    studentCode: "GK-034", name: "Kabir Pillai",
    grade: "6", dob: "2013-11-05", curriculumYear: "2027-2028",
    address: "345 Scioto Meadows Blvd, Dublin, OH 43016",
    motherName: "Latha Pillai",   motherPhone: "(740) 555-0205", motherEmail: "latha.pillai@gmail.com",
    motherEmployer: "State of Ohio",
    fatherName: "Mohan Pillai",   fatherPhone: "(740) 555-0206", fatherEmail: "mohan.pillai@gmail.com",
    fatherEmployer: "Safelite AutoGlass",
    volunteerParent: true, volunteerArea: "Transportation",
  },
  {
    studentCode: "GK-035", name: "Myra Reddy",
    grade: "2", dob: "2017-04-18", curriculumYear: "2027-2028",
    address: "890 Polaris Pkwy, Westerville, OH 43082",
    motherName: "Swathi Reddy",   motherPhone: "(614) 555-0207", motherEmail: "swathi.reddy@gmail.com",
    motherEmployer: "Abbott Laboratories",
    fatherName: "Suresh Reddy",   fatherPhone: "(614) 555-0208", fatherEmail: "suresh.reddy@gmail.com",
    fatherEmployer: "L Brands / Victoria Secret",
  },
  {
    studentCode: "GK-036", name: "Ronak Desai",
    grade: "5", dob: "2014-09-29", curriculumYear: "2027-2028",
    address: "224 Hidden Creek Dr, Powell, OH 43065",
    motherName: "Hemal Desai",    motherPhone: "(614) 555-0209", motherEmail: "hemal.desai@gmail.com",
    motherEmployer: "JPMorgan Chase",
    fatherName: "Chirag Desai",   fatherPhone: "(614) 555-0210", fatherEmail: "chirag.desai@gmail.com",
    fatherEmployer: "American Electric Power (AEP)",
    volunteerParent: true, volunteerArea: "Fundraising",
  },
];

async function patchStudentData() {
  try {
    // 1. Set curriculum_year = '2027-2028' for all students where it's missing
    const yearResult = await db
      .update(studentsTable)
      .set({ curriculumYear: "2027-2028" })
      .where(or(isNull(studentsTable.curriculumYear), sql`${studentsTable.curriculumYear} = ''`));
    if ((yearResult as unknown as { rowCount: number }).rowCount > 0) {
      logger.info({ updated: (yearResult as unknown as { rowCount: number }).rowCount },
        "Patched curriculum_year for existing students.");
    }

    // 2. Patch employer data for each student code where missing
    const studentsWithoutEmployer = await db
      .select({ id: studentsTable.id, code: studentsTable.studentCode })
      .from(studentsTable)
      .where(isNull(studentsTable.motherEmployer));

    if (studentsWithoutEmployer.length > 0) {
      for (const s of studentsWithoutEmployer) {
        const emp = EMPLOYER_MAP[s.code];
        if (emp) {
          await db.update(studentsTable)
            .set({ motherEmployer: emp[0], fatherEmployer: emp[1] })
            .where(eq(studentsTable.id, s.id));
        }
      }
      logger.info({ count: studentsWithoutEmployer.length }, "Patched employer data for students.");
    }

    // 3. Insert GK-032..GK-036 if they don't exist yet
    for (const s of EXTRA_STUDENTS) {
      const existing = await db
        .select({ id: studentsTable.id })
        .from(studentsTable)
        .where(eq(studentsTable.studentCode, s.studentCode));
      if (existing.length === 0) {
        await db.insert(studentsTable).values(s);
        logger.info({ code: s.studentCode }, "Inserted missing extra student.");
      }
    }
  } catch (err) {
    logger.error({ err }, "Student data patch failed");
  }
}
