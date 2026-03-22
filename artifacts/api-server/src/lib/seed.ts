import { db } from "@workspace/db";
import { announcementsTable, coursesTable, eventsTable } from "@workspace/db/schema";

import { logger } from "./logger";

export async function seedIfEmpty() {
  try {
    // --- Courses ---
    // Re-seed if empty OR if existing courses are missing the detailed content (learningAreas)
    const existingCourses = await db.select().from(coursesTable);
    const needsReseed = existingCourses.length === 0 || existingCourses.every((c) => !c.learningAreas);
    if (needsReseed) {
      logger.info("Seeding courses (new or missing detail content)...");
      if (existingCourses.length > 0) {
        await db.delete(coursesTable);
      }
      await db.insert(coursesTable).values([
        {
          name: "Hindi",
          description: "Hindi classes focus on building foundational language skills while connecting students to Indian culture, stories, and traditions.",
          ageGroup: "5+ years",
          level: "Beginner, Intermediate & Advanced",
          schedule: "Sundays 10:00 AM – 11:00 AM",
          instructor: "Smt. Priya Sharma",
          icon: "📖",
          learningAreas: JSON.stringify(["Reading and writing (Varnamala, words, sentences)", "Basic to advanced grammar", "Vocabulary building through stories and conversations", "Introduction to poems, bhajans, and short essays"]),
          levelsDetail: JSON.stringify([{ name: "Beginner", desc: "Alphabets and basic words" }, { name: "Intermediate", desc: "Sentence formation and reading" }, { name: "Advanced", desc: "Paragraph writing and comprehension" }]),
          outcome: "Students will be able to read, write, and communicate confidently in Hindi.",
        },
        {
          name: "Dharma",
          description: "Dharma classes focus on teaching Hindu values, ethics, traditions, and spiritual knowledge in an engaging and age-appropriate way.",
          ageGroup: "5+ years",
          level: "Beginner, Intermediate & Advanced",
          schedule: "Sundays 9:00 AM – 10:00 AM",
          instructor: "Smt. Kavita Patel",
          icon: "🙏",
          learningAreas: JSON.stringify(["Stories from Ramayana, Mahabharata, and Puranas", "Moral values and life lessons", "Introduction to festivals and their significance", "Basic shlokas and prayers", "Understanding of Hindu culture and traditions"]),
          levelsDetail: JSON.stringify([{ name: "Beginner", desc: "Stories and simple values" }, { name: "Intermediate", desc: "Deeper understanding of epics and practices" }, { name: "Advanced", desc: "Discussions on philosophy and application in daily life" }]),
          outcome: "Students develop strong moral values, cultural awareness, and a connection to their roots.",
        },
        {
          name: "Telugu",
          description: "Telugu classes aim to help students learn reading, writing, and conversational Telugu while preserving linguistic heritage.",
          ageGroup: "5+ years",
          level: "Beginner, Intermediate & Advanced",
          schedule: "Saturdays 10:00 AM – 11:00 AM",
          instructor: "Smt. Lalitha Rao",
          icon: "🌺",
          learningAreas: JSON.stringify(["Alphabets (Varnamala) and pronunciation", "Word formation and sentence construction", "Reading simple passages and stories", "Basic conversational Telugu"]),
          levelsDetail: JSON.stringify([{ name: "Beginner", desc: "Letters and basic vocabulary" }, { name: "Intermediate", desc: "Reading and writing sentences" }, { name: "Advanced", desc: "Conversations and paragraph writing" }]),
          outcome: "Students gain confidence in reading, writing, and speaking Telugu.",
        },
        {
          name: "Tamil",
          description: "Tamil classes introduce students to one of the oldest classical languages, focusing on literacy and cultural richness.",
          ageGroup: "5+ years",
          level: "Beginner, Intermediate & Advanced",
          schedule: "Saturdays 11:00 AM – 12:00 PM",
          instructor: "Smt. Vijaya Kumar",
          icon: "🏮",
          learningAreas: JSON.stringify(["Tamil alphabets and phonetics", "Reading and writing practice", "Vocabulary and sentence building", "Introduction to Tamil rhymes and cultural content"]),
          levelsDetail: JSON.stringify([{ name: "Beginner", desc: "Letters and sounds" }, { name: "Intermediate", desc: "Words and sentences" }, { name: "Advanced", desc: "Reading passages and writing" }]),
          outcome: "Students develop foundational proficiency in Tamil and appreciation for its heritage.",
        },
        {
          name: "Sanskrit",
          description: "Sanskrit classes provide an introduction to the ancient language of scriptures, focusing on pronunciation, vocabulary, and basic grammar.",
          ageGroup: "7+ years (recommended)",
          level: "Beginner, Intermediate & Advanced",
          schedule: "Sundays 11:00 AM – 12:00 PM",
          instructor: "Pt. Ramesh Joshi",
          icon: "🕉️",
          learningAreas: JSON.stringify(["Basic Sanskrit alphabets and pronunciation", "Common words and simple sentence structures", "Shlokas and chants with meaning", "Introduction to grammar (Sandhi, basic forms)"]),
          levelsDetail: JSON.stringify([{ name: "Beginner", desc: "Shlokas and basic words" }, { name: "Intermediate", desc: "Sentence formation and grammar basics" }, { name: "Advanced", desc: "Reading simple Sanskrit texts" }]),
          outcome: "Students gain the ability to recite, understand basic Sanskrit, and connect with scriptures.",
        },
        {
          name: "Gujarati",
          description: "Gujarati classes help students learn reading, writing, and speaking skills while staying connected to Gujarati culture and traditions.",
          ageGroup: "5+ years",
          level: "Beginner, Intermediate & Advanced",
          schedule: "Saturdays 12:00 PM – 1:00 PM",
          instructor: "Smt. Hetal Shah",
          icon: "🎨",
          learningAreas: JSON.stringify(["Gujarati alphabets and pronunciation", "Word and sentence formation", "Reading stories and simple texts", "Conversational Gujarati"]),
          levelsDetail: JSON.stringify([{ name: "Beginner", desc: "Alphabets and basic words" }, { name: "Intermediate", desc: "Reading and writing sentences" }, { name: "Advanced", desc: "Conversation and comprehension" }]),
          outcome: "Students become comfortable communicating and reading in Gujarati.",
        },
      ]);
      logger.info("Courses seeded.");
    }

    // --- Announcements ---
    const announcements = await db.select().from(announcementsTable);
    if (announcements.length === 0) {
      logger.info("Seeding announcements...");
      await db.insert(announcementsTable).values([
        { title: "New Session Registration Open — Summer 2026", content: "Registration for the Summer 2026 Gurukul session is now open! Classes will run from June 1st to August 31st. Early registration ensures your child a spot. Please visit the Parents Portal to register.", date: "April 1, 2026", isUrgent: true, category: "Registration" },
        { title: "Guru Purnima Celebration — All Families Invited", content: "Join us on July 10, 2026, for our annual Guru Purnima celebration. Students will perform shlokas, bhajans, and cultural dances. Refreshments will be served. All families are warmly invited!", date: "March 20, 2026", isUrgent: false, category: "Event" },
        { title: "Holiday Schedule — Spring Break", content: "Classes will be suspended from April 14–20 for Spring Break. Regular classes will resume on April 27. Wishing all our families a peaceful and joyful Navratri!", date: "March 15, 2026", isUrgent: false, category: "Schedule" },
        { title: "New Hindi Intermediate Batch Starting", content: "A new Hindi Intermediate batch is starting this Sunday for students who have completed Beginner Level 1. Please contact us to register your child for this new batch.", date: "March 10, 2026", isUrgent: false, category: "Courses" },
        { title: "Annual Day 2026 — Save the Date", content: "Our Annual Day celebration will be held on September 20, 2026. Students across all courses will showcase their learning through performances. More details to follow.", date: "March 5, 2026", isUrgent: false, category: "Event" },
      ]);
      logger.info("Announcements seeded.");
    }

    // --- Events ---
    const events = await db.select().from(eventsTable);
    if (events.length === 0) {
      logger.info("Seeding events...");
      await db.insert(eventsTable).values([
        { title: "First Day of Summer 2026 Classes", description: "Welcome back! Classes begin for the Summer 2026 session. All students and new enrollees are warmly invited. Please arrive 10 minutes early.", date: "2026-06-01", time: "9:00 AM", location: "Bhartiya Hindu Temple, Main Hall", category: "Classes" },
        { title: "Guru Purnima Celebration", description: "Annual celebration honoring all teachers and gurus. Students will perform bhajans and shlokas. A grand puja followed by prasad distribution.", date: "2026-07-10", time: "10:00 AM", location: "Bhartiya Hindu Temple, Main Auditorium", category: "Festival" },
        { title: "Parents Orientation Day", description: "A special orientation for new parents joining the Gurukul family. Meet teachers, learn about curriculum, and ask all your questions.", date: "2026-06-08", time: "11:00 AM", location: "Bhartiya Hindu Temple, Conference Room", category: "Meeting" },
        { title: "Janmashtami Special Program", description: "Students present a special cultural program on the occasion of Janmashtami. Includes skits, bhajans, and a Lord Krishna tribute.", date: "2026-08-16", time: "6:00 PM", location: "Bhartiya Hindu Temple, Main Auditorium", category: "Festival" },
        { title: "Annual Day 2026", description: "Grand year-end celebration where students from all courses showcase their learning through performances, recitations, and cultural displays.", date: "2026-09-20", time: "4:00 PM", location: "Bhartiya Hindu Temple, Main Auditorium", category: "Annual Event" },
        { title: "Hindi Diwas Celebration", description: "Celebrating the national language of India with special recitations, essays, and cultural performances by Gurukul students.", date: "2026-09-14", time: "10:00 AM", location: "Bhartiya Hindu Temple, Main Hall", category: "Cultural" },
      ]);
      logger.info("Events seeded.");
    }
  } catch (err) {
    logger.error({ err }, "Seed failed");
  }
}
