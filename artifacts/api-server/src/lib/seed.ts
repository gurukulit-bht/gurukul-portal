import { db } from "@workspace/db";
import { coursesTable, courseLevelsTable } from "@workspace/db/schema";
import { logger } from "./logger";

/**
 * Seed only the core course catalogue and level structure.
 * This never inserts dummy teachers, students, inventory,
 * announcements, or events — all transactional data must be
 * entered through the admin portal.
 */
export async function seedIfEmpty() {
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
