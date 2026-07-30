const cron = require("node-cron");
const { Op } = require("sequelize");
const { Email } = require("../models");
const { sendScheduledEmail } = require("../services/emailService");

/**
 * Runs every minute. Finds all PENDING emails whose scheduleTime has
 * passed, sends each through the owning user's connected Gmail
 * account, and updates status to SENT or FAILED.
 */
function startEmailScheduler() {
  cron.schedule("* * * * *", async () => {
    try {
      const dueEmails = await Email.findAll({
        where: {
          scheduleTime: { [Op.lte]: new Date() },
          status: "PENDING",
        },
      });

      if (dueEmails.length === 0) return;

      console.log(`[scheduler] Found ${dueEmails.length} due email(s) to send.`);

      for (const email of dueEmails) {
        try {
          await sendScheduledEmail(email);
          email.status = "SENT";
          email.errorMessage = null;
          await email.save();
          console.log(`[scheduler] Email #${email.id} sent to ${email.receiver}`);
        } catch (err) {
          email.status = "FAILED";
          email.errorMessage = err.message || "Unknown error while sending";
          await email.save();
          console.error(`[scheduler] Email #${email.id} failed:`, err.message);
        }
      }
    } catch (err) {
      console.error("[scheduler] Error while checking due emails:", err);
    }
  });

  console.log("[scheduler] Email scheduler started (runs every minute).");
}

module.exports = { startEmailScheduler };
