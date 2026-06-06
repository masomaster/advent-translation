const express = require("express");
const router = express.Router();
const translationCtrl = require("../../controllers/api/translations");
const verifyFirebaseToken = require("../../config/auth");

// Query ?passage=… avoids broken paths when references contain spaces or ":" (e.g. "John 1:1").
router.get("/official", translationCtrl.getOfficialTranslations);
router.get("/:id", verifyFirebaseToken, translationCtrl.getDayTranslations);
router.post("/", verifyFirebaseToken, translationCtrl.create);
router.put("/:id", verifyFirebaseToken, translationCtrl.update);
router.post("/feedback", verifyFirebaseToken, translationCtrl.getTranslationFeedback);

module.exports = router;
