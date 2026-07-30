const { google } = require("googleapis");
require("dotenv").config();

// Scopes requested for the Gmail OAuth2 "Connect Gmail" flow.
// Only gmail.send is requested, plus basic profile/email so we can
// store which Gmail address was connected.
const GMAIL_SCOPES = [
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/userinfo.email",
  "openid",
];

function createOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_CALLBACK_URL
  );
}

/**
 * Builds the Google consent screen URL the user is redirected to
 * when they click "Connect Gmail". `state` carries our internal
 * userId so we know who to attach the tokens to on callback.
 */
function getGmailAuthUrl(state) {
  const oauth2Client = createOAuth2Client();
  return oauth2Client.generateAuthUrl({
    access_type: "offline", // required to receive a refresh_token
    prompt: "consent", // forces refresh_token to be re-issued every time
    scope: GMAIL_SCOPES,
    state,
  });
}

/**
 * Returns an OAuth2 client pre-loaded with a user's stored tokens,
 * ready to be used by Nodemailer or the Gmail API.
 */
function getAuthorizedClient({ accessToken, refreshToken }) {
  const oauth2Client = createOAuth2Client();
  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  });
  return oauth2Client;
}

module.exports = {
  GMAIL_SCOPES,
  createOAuth2Client,
  getGmailAuthUrl,
  getAuthorizedClient,
};
