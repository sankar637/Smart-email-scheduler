const express = require("express");
const cors = require("cors");
require("dotenv").config();

const { initDatabase } = require("./models");
const { startEmailScheduler } = require("./scheduler/emailScheduler");

const authRoutes = require("./routes/authRoutes");
const gmailRoutes = require("./routes/gmailRoutes");
const emailRoutes = require("./routes/emailRoutes");

const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5178",
    credentials: true,
  })
);
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ status: "ok", service: "Smart Email Scheduler API" });
});

app.use("/api/auth", authRoutes);
app.use("/api/gmail", gmailRoutes);
app.use("/api/email", emailRoutes);

// Fallback error handler
app.use((err, req, res, next) => {
  console.error("[unhandled error]", err);
  res.status(500).json({ message: "Something went wrong" });
});

const PORT = process.env.PORT || 5001;

(async () => {
  try {
    await initDatabase();
    app.listen(PORT, () => {
      console.log(`[server] Smart Email Scheduler API running on port ${PORT}`);
    });
    startEmailScheduler();
  } catch (err) {
    console.error("[server] Failed to start:", err);
    process.exit(1);
  }
})();
