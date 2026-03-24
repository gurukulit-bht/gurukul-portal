import { Router, type IRouter } from "express";
import healthRouter from "./health";
import announcementsRouter from "./announcements";
import eventsRouter from "./events";
import coursesRouter from "./courses";
import contactRouter from "./contact";
import testimonialsRouter from "./testimonials";
import adminRouter from "./admin";
import settingsRouter from "./settings";
import weeklyUpdatesRouter from "./weekly-updates";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/announcements", announcementsRouter);
router.use("/events", eventsRouter);
router.use("/courses", coursesRouter);
router.use("/contact", contactRouter);
router.use("/testimonials", testimonialsRouter);
router.use("/admin", adminRouter);
router.use("/settings", settingsRouter);
router.use("/weekly-updates", weeklyUpdatesRouter);

export default router;
