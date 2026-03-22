import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { coursesTable } from "@workspace/db/schema";
import { asc } from "drizzle-orm";

const router: IRouter = Router();

router.get("/", async (req, res) => {
  try {
    const courses = await db
      .select()
      .from(coursesTable)
      .orderBy(asc(coursesTable.id));
    res.json(
      courses.map((c) => ({
        id: c.id,
        name: c.name,
        description: c.description,
        ageGroup: c.ageGroup,
        level: c.level,
        schedule: c.schedule,
        instructor: c.instructor,
        icon: c.icon,
      }))
    );
  } catch (err) {
    req.log.error({ err }, "Failed to fetch courses");
    res.status(500).json({ error: "Failed to fetch courses" });
  }
});

export default router;
