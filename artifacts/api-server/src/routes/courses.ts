import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { coursesTable, courseLevelsTable, courseSectionsTable } from "@workspace/db/schema";
import { asc, isNull } from "drizzle-orm";

const router: IRouter = Router();

router.get("/", async (req, res) => {
  try {
    const courses = await db
      .select()
      .from(coursesTable)
      .where(isNull(coursesTable.archivedAt))
      .orderBy(asc(coursesTable.id));

    const levels = await db
      .select()
      .from(courseLevelsTable)
      .orderBy(asc(courseLevelsTable.levelNumber));

    const sections = await db
      .select()
      .from(courseSectionsTable)
      .orderBy(asc(courseSectionsTable.id));

    res.json(
      courses.map((c) => {
        const courseLevels = levels
          .filter((l) => l.courseId === c.id)
          .map((l) => {
            const lvlSections = sections
              .filter((s) => s.courseLevelId === l.id)
              .map((s) => ({
                id:          s.id,
                sectionName: s.sectionName,
                schedule:    s.schedule ?? "",
                capacity:    s.capacity,
              }));
            return {
              id:          l.id,
              levelNumber: l.levelNumber,
              className:   l.className,
              schedule:    l.schedule ?? "",
              capacity:    l.capacity,
              sections:    lvlSections,
            };
          });

        return {
          id:             c.id,
          name:           c.name,
          description:    c.description,
          ageGroup:       c.ageGroup,
          level:          c.level,
          schedule:       c.schedule,
          instructor:     c.instructor,
          icon:           c.icon,
          learningAreas:  c.learningAreas ?? null,
          levelsDetail:   c.levelsDetail  ?? null,
          outcome:        c.outcome       ?? null,
          levels:         courseLevels,
        };
      })
    );
  } catch (err) {
    req.log.error({ err }, "Failed to fetch courses");
    res.status(500).json({ error: "Failed to fetch courses" });
  }
});

export default router;
