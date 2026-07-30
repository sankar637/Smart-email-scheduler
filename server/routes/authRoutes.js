const express = require("express");
const router = express.Router();
const { googleLogin, getMe } = require("../controllers/authController");
const { requireAuth } = require("../middleware/authMiddleware");

router.post("/google", googleLogin);
router.get("/me", requireAuth, getMe);

module.exports = router;
