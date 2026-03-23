import { Router, type IRouter } from "express";
import teachersRouter from "./teachers";
import studentsRouter from "./students";
import membersRouter from "./members";
import inventoryRouter from "./inventory";
import announcementsRouter from "./announcements";
import eventsRouter from "./events";
import coursesRouter from "./courses";
import attendanceRouter from "./attendance";
import notificationsRouter from "./notifications";
import testimonialsRouter from "./testimonials";
import messagingRouter from "./messaging";

const router: IRouter = Router();

router.use("/teachers", teachersRouter);
router.use("/students", studentsRouter);
router.use("/members", membersRouter);
router.use("/inventory", inventoryRouter);
router.use("/announcements", announcementsRouter);
router.use("/events", eventsRouter);
router.use("/courses", coursesRouter);
router.use("/attendance", attendanceRouter);
router.use("/notifications", notificationsRouter);
router.use("/testimonials", testimonialsRouter);
router.use("/messaging", messagingRouter);

export default router;
