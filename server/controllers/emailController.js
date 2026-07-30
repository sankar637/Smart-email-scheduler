const { Op } = require("sequelize");
const { Email, User } = require("../models");

/**
 * POST /api/email/schedule
 * Body: { receiver, subject, message, scheduleDate, scheduleTime }
 */
async function scheduleEmail(req, res) {
  try {
    const { receiver, subject, message, scheduleDate, scheduleTime } = req.body;

    if (!receiver || !subject || !message || !scheduleDate || !scheduleTime) {
      return res.status(400).json({
        message: "receiver, subject, message, scheduleDate and scheduleTime are required",
      });
    }

    const user = await User.findByPk(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!user.gmailRefreshToken) {
      return res.status(400).json({
        message: "Please connect Gmail before scheduling",
      });
    }

    const scheduledAt = new Date(`${scheduleDate}T${scheduleTime}:00`);
    if (Number.isNaN(scheduledAt.getTime())) {
      return res.status(400).json({ message: "Invalid schedule date/time" });
    }

    const email = await Email.create({
      userId: user.id,
      sender: user.gmailEmail,
      receiver,
      subject,
      message,
      scheduleTime: scheduledAt,
      status: "PENDING",
    });

    return res.status(201).json({
      message: "Email scheduled successfully",
      email,
    });
  } catch (err) {
    console.error("[emailController.scheduleEmail]", err);
    return res.status(500).json({ message: "Failed to schedule email" });
  }
}

/**
 * GET /api/email
 * Returns all scheduled emails belonging to the logged-in user, newest first.
 */
async function listEmails(req, res) {
  try {
    const emails = await Email.findAll({
      where: { userId: req.userId },
      order: [["scheduleTime", "ASC"]],
    });
    return res.json(emails);
  } catch (err) {
    console.error("[emailController.listEmails]", err);
    return res.status(500).json({ message: "Failed to load scheduled emails" });
  }
}

/**
 * PUT /api/email/:id
 * Only allowed while status is still PENDING.
 */
async function updateEmail(req, res) {
  try {
    const { id } = req.params;
    const { receiver, subject, message, scheduleDate, scheduleTime } = req.body;

    const email = await Email.findOne({ where: { id, userId: req.userId } });
    if (!email) return res.status(404).json({ message: "Scheduled email not found" });

    if (email.status !== "PENDING") {
      return res.status(400).json({
        message: `Cannot edit an email that has already been ${email.status.toLowerCase()}`,
      });
    }

    if (receiver) email.receiver = receiver;
    if (subject) email.subject = subject;
    if (message) email.message = message;
    if (scheduleDate && scheduleTime) {
      const scheduledAt = new Date(`${scheduleDate}T${scheduleTime}:00`);
      if (Number.isNaN(scheduledAt.getTime())) {
        return res.status(400).json({ message: "Invalid schedule date/time" });
      }
      email.scheduleTime = scheduledAt;
    }

    await email.save();
    return res.json({ message: "Scheduled email updated", email });
  } catch (err) {
    console.error("[emailController.updateEmail]", err);
    return res.status(500).json({ message: "Failed to update scheduled email" });
  }
}

/**
 * DELETE /api/email/:id
 * Allowed for any status (PENDING, SENT, or FAILED) — it just removes
 * the record from the list. Editing (above) is still restricted to
 * PENDING since it wouldn't make sense to edit an email that has
 * already been sent or attempted.
 */
async function deleteEmail(req, res) {
  try {
    const { id } = req.params;
    const email = await Email.findOne({ where: { id, userId: req.userId } });
    if (!email) return res.status(404).json({ message: "Scheduled email not found" });

    await email.destroy();
    return res.json({ message: "Scheduled email deleted" });
  } catch (err) {
    console.error("[emailController.deleteEmail]", err);
    return res.status(500).json({ message: "Failed to delete scheduled email" });
  }
}

module.exports = { scheduleEmail, listEmails, updateEmail, deleteEmail };