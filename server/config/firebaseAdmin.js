const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

let credential;

if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
  // Service account provided directly as an env variable (useful for hosting platforms)
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  credential = admin.credential.cert(serviceAccount);
} else {
  // Service account provided as a JSON file on disk
  const keyPath = path.resolve(
    __dirname,
    "..",
    process.env.FIREBASE_SERVICE_ACCOUNT_PATH || "./config/serviceAccountKey.json"
  );

  if (fs.existsSync(keyPath)) {
    const serviceAccount = require(keyPath);
    credential = admin.credential.cert(serviceAccount);
  } else {
    console.warn(
      "[firebaseAdmin] No service account key found at " +
        keyPath +
        ". Firebase ID token verification will fail until you add one. " +
        "See server/.env.example for instructions."
    );
  }
}

if (!admin.apps.length) {
  admin.initializeApp(
    credential
      ? { credential }
      : {
          // Falls back to Application Default Credentials if configured on the host.
          credential: admin.credential.applicationDefault(),
        }
  );
}

module.exports = admin;
