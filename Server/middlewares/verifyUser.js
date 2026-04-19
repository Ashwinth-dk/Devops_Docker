import jwt from "jsonwebtoken";

/**
 * Middleware to verify that a user is authenticated via JWT.
 * Expects the token to be stored in a cookie named `jwt`.
 */
export const verifyUser = (req, res, next) => {
  const token = req.cookies?.jwt; // Safely access cookies
  if (!token) {
    return res
      .status(401)
      .json({ Status: false, Error: "Not Authenticated" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res
        .status(403)
        .json({ Status: false, Error: "Invalid Token" });
    }

    // Attach user info to the request object for downstream middleware/routes
    req.role = decoded.role;
    req.id = decoded.id;

    next();
  });
};
