const jwt = require("jsonwebtoken");
require("dotenv").config();

/**
 * Protects routes using our own app JWT (issued by /api/auth/google
 * after Firebase ID token verification). Attaches req.userId.
 */
function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: "Missing or invalid Authorization header" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    req.userEmail = decoded.email;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Session expired, please log in again" });
  }
}

module.exports = { requireAuth };
