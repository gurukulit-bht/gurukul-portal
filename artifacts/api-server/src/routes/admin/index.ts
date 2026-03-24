import { Router, type IRouter } from "express";
import teachersRouter from "./teachers";
import studentsRouter from "./students";
import membersRouter from "./members";
import inventoryRouter from "./inventory";
import announcementsRouter from "./announcements";
import eventsRouter from "./events";
import coursesRouter from "./courses";
import attendanceRouter from "./attendance";
import testimonialsRouter from "./testimonials";
import messagingRouter from "./messaging";
import settingsRouter from "./settings";
import weeklyUpdatesRouter from "./weekly-updates";
import portalUsersRouter from "./portal-users";

const router: IRouter = Router();

router.use("/teachers", teachersRouter);
router.use("/students", studentsRouter);
router.use("/members", membersRouter);
router.use("/inventory", inventoryRouter);
router.use("/announcements", announcementsRouter);
router.use("/events", eventsRouter);
router.use("/courses", coursesRouter);
router.use("/attendance", attendanceRouter);
router.use("/testimonials", testimonialsRouter);
router.use("/messaging", messagingRouter);
router.use("/settings", settingsRouter);
router.use("/weekly-updates", weeklyUpdatesRouter);
router.use("/portal-users", portalUsersRouter);

export default router;
