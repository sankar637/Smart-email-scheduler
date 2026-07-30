const express = require("express");
const router = express.Router();
const {
  connectGmail,
  gmailCallback,
  gmailStatus,
  disconnectGmail,
} = require("../controllers/gmailController");
const { requireAuth } = require("../middleware/authMiddleware");

// Protected: returns the Google consent URL for the frontend to redirect to.
router.get("/connect", requireAuth, connectGmail);

// Public: Google redirects the user's browser here directly after consent.
router.get("/callback", gmailCallback);

router.get("/status", requireAuth, gmailStatus);
router.post("/disconnect", requireAuth, disconnectGmail);

module.exports = router;
