const express = require("express");
const router = express.Router();
const {
  scheduleEmail,
  listEmails,
  updateEmail,
  deleteEmail,
} = require("../controllers/emailController");
const { requireAuth } = require("../middleware/authMiddleware");

router.use(requireAuth);

router.post("/schedule", scheduleEmail);
router.get("/", listEmails);
router.put("/:id", updateEmail);
router.delete("/:id", deleteEmail);

module.exports = router;
