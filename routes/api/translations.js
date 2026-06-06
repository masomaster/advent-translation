const express = require("express");
const rateLimit = require("express-rate-limit");
const router = express.Router();
const translationCtrl = require("../../controllers/api/translations");
const verifyFirebaseToken = require("../../config/auth");

/** Shared cap for all /api/translations routes (per IP, behind proxy on Vercel). */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests. Try again later.", code: "rate_limit" },
});

const feedbackLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 45,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Too many feedback requests from this network. Try again later.",
    code: "rate_limit_feedback",
  },
});

const officialLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 150,
  standardHeaders: true,
  legacyHeaders: false,
});

router.use(apiLimiter);

// Query ?passage=… avoids broken paths when references contain spaces or ":" (e.g. "John 1:1").
router.get("/official", officialLimiter, translationCtrl.getOfficialTranslations);
router.get("/:id", verifyFirebaseToken, translationCtrl.getDayTranslations);
router.post("/", verifyFirebaseToken, translationCtrl.create);
router.put("/:id", verifyFirebaseToken, translationCtrl.update);
router.post(
  "/feedback",
  feedbackLimiter,
  verifyFirebaseToken,
  translationCtrl.getTranslationFeedback
);

module.exports = router;
