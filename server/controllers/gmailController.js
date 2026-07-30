const jwt = require("jsonwebtoken");
const axios = require("axios");
const { getGmailAuthUrl, createOAuth2Client } = require("../config/googleAuth");
const { User } = require("../models");
require("dotenv").config();

/**
 * GET /api/gmail/connect
 * Protected route. Redirects the browser to Google's OAuth2 consent
 * screen requesting the gmail.send scope. The user's id is embedded
 * in a short-lived `state` JWT so the callback knows who to save
 * tokens for (Google round-trips the `state` param unchanged).
 */
function connectGmail(req, res) {
  const state = jwt.sign({ userId: req.userId }, process.env.JWT_SECRET, {
    expiresIn: "10m",
  });
  const url = getGmailAuthUrl(state);
  return res.json({ url });
}

/**
 * GET /api/gmail/callback?code=...&state=...
 * Public route (Google redirects the browser here directly, so it
 * can't carry an Authorization header). We recover the user id from
 * the `state` JWT instead.
 */
async function gmailCallback(req, res) {
  const { code, state, error } = req.query;
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5178";

  if (error) {
    return res.redirect(`${frontendUrl}/dashboard?gmail=denied`);
  }

  try {
    const { userId } = jwt.verify(state, process.env.JWT_SECRET);

    const oauth2Client = createOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);
    // tokens: { access_token, refresh_token, scope, token_type, expiry_date }

    if (!tokens.refresh_token) {
      // Google only returns a refresh_token the first time consent is
      // granted (or when prompt=consent forces re-issue, which we set).
      return res.redirect(`${frontendUrl}/dashboard?gmail=no_refresh_token`);
    }

    oauth2Client.setCredentials(tokens);

    // Fetch the connected Gmail address so we can display it.
    const { data: profile } = await axios.get(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      { headers: { Authorization: `Bearer ${tokens.access_token}` } }
    );

    const user = await User.findByPk(userId);
    if (!user) {
      return res.redirect(`${frontendUrl}/dashboard?gmail=user_not_found`);
    }

    user.gmailEmail = profile.email;
    user.gmailAccessToken = tokens.access_token;
    user.gmailRefreshToken = tokens.refresh_token;
    user.gmailTokenExpiry = tokens.expiry_date
      ? new Date(tokens.expiry_date)
      : null;
    await user.save();

    return res.redirect(`${frontendUrl}/dashboard?gmail=connected`);
  } catch (err) {
    console.error("[gmailController.gmailCallback]", err);
    return res.redirect(`${frontendUrl}/dashboard?gmail=error`);
  }
}

/**
 * GET /api/gmail/status
 * Protected route used by the dashboard to show connection state.
 */
async function gmailStatus(req, res) {
  const user = await User.findByPk(req.userId);
  if (!user) return res.status(404).json({ message: "User not found" });

  return res.json({
    connected: Boolean(user.gmailRefreshToken),
    gmailEmail: user.gmailEmail || null,
  });
}

/**
 * POST /api/gmail/disconnect
 * Protected route to remove stored Gmail tokens.
 */
async function disconnectGmail(req, res) {
  const user = await User.findByPk(req.userId);
  if (!user) return res.status(404).json({ message: "User not found" });

  user.gmailEmail = null;
  user.gmailAccessToken = null;
  user.gmailRefreshToken = null;
  user.gmailTokenExpiry = null;
  await user.save();

  return res.json({ message: "Gmail disconnected" });
}

module.exports = { connectGmail, gmailCallback, gmailStatus, disconnectGmail };
