const jwt = require("jsonwebtoken");
const admin = require("../config/firebaseAdmin");
const { User } = require("../models");
require("dotenv").config();

/**
 * POST /api/auth/google
 * Body: { idToken }
 *
 * Flow:
 * 1. Frontend signs the user in with Firebase (Google popup) and gets a Firebase ID token.
 * 2. Frontend sends that ID token here.
 * 3. Backend verifies it with Firebase Admin SDK.
 * 4. User row is created/updated in SQLite (Firebase UID as primary key).
 * 5. Backend issues its own short-lived JWT for subsequent API calls.
 */
async function googleLogin(req, res) {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({ message: "idToken is required" });
    }

    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const { uid, email, name, picture } = decodedToken;

    if (!email) {
      return res.status(400).json({ message: "Google account has no email" });
    }

    const [user] = await User.findOrCreate({
      where: { id: uid },
      defaults: {
        id: uid,
        name: name || email.split("@")[0],
        email,
      },
    });

    // Keep name/email fresh in case they changed on the Google account.
    user.name = name || user.name;
    user.email = email;
    await user.save();

    const appToken = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      token: appToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        picture: picture || null,
        gmailConnected: Boolean(user.gmailRefreshToken),
        gmailEmail: user.gmailEmail,
      },
    });
  } catch (err) {
    console.error("[authController.googleLogin]", err);
    return res.status(401).json({ message: "Invalid or expired Google sign-in token" });
  }
}

/**
 * GET /api/auth/me
 * Returns the current logged-in user's profile + Gmail connection status.
 */
async function getMe(req, res) {
  try {
    const user = await User.findByPk(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    return res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      gmailConnected: Boolean(user.gmailRefreshToken),
      gmailEmail: user.gmailEmail,
    });
  } catch (err) {
    console.error("[authController.getMe]", err);
    return res.status(500).json({ message: "Failed to load profile" });
  }
}

module.exports = { googleLogin, getMe };
