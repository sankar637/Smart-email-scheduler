const { google } = require("googleapis");
const { getAuthorizedClient } = require("../config/googleAuth");
const { User } = require("../models");

/**
 * Returns a Gmail API client (gmail.users.messages.send) authenticated
 * as the given user's connected Gmail account via OAuth2.
 *
 * We intentionally do NOT use Nodemailer/SMTP here. The "gmail.send"
 * OAuth scope is only valid for calling the Gmail REST API — it is
 * NOT accepted by Gmail's SMTP server for a raw AUTH XOAUTH2 login
 * (that requires the much broader "https://mail.google.com/" scope).
 * Calling the API directly lets us keep the narrower, safer gmail.send
 * scope and avoids the SMTP layer entirely.
 */
async function createGmailClientForUser(user) {
  if (!user.gmailRefreshToken) {
    throw new Error("Gmail is not connected for this user");
  }

  const oauth2Client = getAuthorizedClient({
    accessToken: user.gmailAccessToken,
    refreshToken: user.gmailRefreshToken,
  });

  // Always fetch a fresh access token before sending; googleapis
  // handles refreshing automatically using the refresh_token.
  const { token: freshAccessToken } = await oauth2Client.getAccessToken();

  // Persist the refreshed access token so it can be reused until it expires.
  if (freshAccessToken && freshAccessToken !== user.gmailAccessToken) {
    user.gmailAccessToken = freshAccessToken;
    await user.save();
  }

  oauth2Client.setCredentials({
    access_token: freshAccessToken,
    refresh_token: user.gmailRefreshToken,
  });

  return google.gmail({ version: "v1", auth: oauth2Client });
}

/**
 * Encodes header values so names/subjects with non-ASCII characters
 * (emoji, accented characters, etc.) survive as a valid RFC 2047
 * "encoded-word", instead of breaking the raw MIME message.
 */
function encodeHeader(value) {
  const needsEncoding = /[^\x00-\x7F]/.test(value);
  if (!needsEncoding) return value;
  return `=?UTF-8?B?${Buffer.from(value, "utf-8").toString("base64")}?=`;
}

/**
 * Builds a base64url-encoded RFC 2822 MIME message, which is the
 * format the Gmail API's users.messages.send endpoint expects in
 * the `raw` field.
 */
function buildRawMessage({ fromName, fromEmail, to, subject, text, html }) {
  const boundary = `boundary_${Date.now()}_${Math.random().toString(36).slice(2)}`;

  const headers = [
    `From: "${encodeHeader(fromName || fromEmail)}" <${fromEmail}>`,
    `To: ${to}`,
    `Subject: ${encodeHeader(subject)}`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
  ].join("\r\n");

  const body = [
    "",
    `--${boundary}`,
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: 7bit",
    "",
    text,
    "",
    `--${boundary}`,
    "Content-Type: text/html; charset=UTF-8",
    "Content-Transfer-Encoding: 7bit",
    "",
    html,
    "",
    `--${boundary}--`,
  ].join("\r\n");

  const message = `${headers}${body}`;

  // Gmail API requires URL-safe base64 (base64url), no padding issues.
  return Buffer.from(message)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/**
 * Sends a single scheduled email through the owning user's Gmail account
 * using the Gmail API (users.messages.send), authenticated with the
 * gmail.send OAuth2 scope. Throws on failure so the caller (scheduler or
 * manual "send now") can record status = FAILED with the error message.
 */
async function sendScheduledEmail(emailRecord) {
  const user = await User.findByPk(emailRecord.userId);
  if (!user) {
    throw new Error("Owning user not found for this scheduled email");
  }

  const gmail = await createGmailClientForUser(user);

  const raw = buildRawMessage({
    fromName: user.name || user.gmailEmail,
    fromEmail: user.gmailEmail,
    to: emailRecord.receiver,
    subject: emailRecord.subject,
    text: emailRecord.message,
    html: emailRecord.message.replace(/\n/g, "<br/>"),
  });

  await gmail.users.messages.send({
    userId: "me",
    requestBody: { raw },
  });
}

module.exports = { createGmailClientForUser, sendScheduledEmail };