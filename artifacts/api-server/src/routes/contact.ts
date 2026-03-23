import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { contactsTable, insertContactSchema } from "@workspace/db/schema";

const router: IRouter = Router();

router.post("/", async (req, res) => {
  try {
    const parsed = insertContactSchema.safeParse({
      motherName:     req.body.motherName     || null,
      motherPhone:    req.body.motherPhone    || null,
      motherEmail:    req.body.motherEmail    || null,
      fatherName:     req.body.fatherName     || null,
      fatherPhone:    req.body.fatherPhone    || null,
      fatherEmail:    req.body.fatherEmail    || null,
      childName:      req.body.childName      || null,
      childAge:       req.body.childAge       || null,
      courseInterest: req.body.courseInterest,
      message:        req.body.message        || null,
    });

    if (!parsed.success) {
      res.status(400).json({ success: false, message: "Invalid request data" });
      return;
    }

    await db.insert(contactsTable).values(parsed.data);

    res.json({
      success: true,
      message: "Thank you! We will contact you soon to confirm your enrollment.",
    });
  } catch (err) {
    req.log.error({ err }, "Failed to submit contact form");
    res.status(500).json({ success: false, message: "Failed to submit form. Please try again." });
  }
});

export default router;
