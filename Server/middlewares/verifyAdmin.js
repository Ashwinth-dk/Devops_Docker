import jwt from "jsonwebtoken";
import db from "../utils/db.js";

/**
 * Middleware to verify that the request is coming from a valid admin.
 * Expects JWT in the `Authorization` header as: "Bearer <token>"
 */
export const verifyAdmin = async (req, res, next) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(403)
        .json({ success: false, message: "Access denied: No token provided" });
    }

    const token = authHeader.split(" ")[1];

    // Verify JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if admin exists in the database
    const adminResult = await db.query("SELECT * FROM admin WHERE id = $1", [
      decoded.id,
    ]);

    if (adminResult.rows.length === 0) {
      return res
        .status(403)
        .json({ success: false, message: "Access denied: Admin not found" });
    }

    // Attach admin info to request
    req.adminId = decoded.id;
    next();
  } catch (error) {
    console.error("Error verifying admin:", error);
    return res
      .status(403)
      .json({ success: false, message: "Access denied: Invalid token" });
  }
};
