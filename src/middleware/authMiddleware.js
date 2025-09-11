import jwt from "jsonwebtoken";

export const authenticateToken = (req, res, next) => {
  const JWTSECRET = process.env.JWT_SECRET || "secret";

  // 1. Get token from cookies
  const token = req.cookies?.access_token;

  if (!token) {
    return res.status(401).json({ error: "Access token missing" });
  }

  try {
    // 2. Verify token
    const decoded = jwt.verify(token, JWTSECRET);

    // 3. Attach user info to req.user
    req.user = {
      user_id: decoded.userId,
    };

    next(); // proceed to the route
  } catch (err) {
    return res.status(403).json({ error: "Invalid or expired token" });
  }
};
