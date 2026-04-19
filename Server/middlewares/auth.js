import jwt from "jsonwebtoken";

/**
 * Middleware to verify that a user is authenticated.
 */
export const verifyUser = (req, res, next) => {
  const token = req.cookies?.jwt;
  if (!token) {
    return res
      .status(401)
      .json({ success: false, message: "Not Authenticated" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res
        .status(403)
        .json({ success: false, message: "Invalid Token" });
    }

    req.role = decoded.role;
    req.id = decoded.id;
    next();
  });
};

/**
 * Middleware to allow only admins.
 */
export const verifyAdmin = (req, res, next) => {
  verifyUser(req, res, () => {
    if (req.role !== "admin") {
      return res
        .status(403)
        .json({ success: false, message: "Access Denied" });
    }
    next();
  });
};

/**
 * Middleware to allow only managers.
 */
export const verifyManager = (req, res, next) => {
  verifyUser(req, res, () => {
    if (req.role !== "manager") {
      return res
        .status(403)
        .json({ success: false, message: "Access Denied" });
    }
    next();
  });
};

/**
 * Middleware to allow admins or managers.
 */
export const verifyAdminOrManager = (req, res, next) => {
  verifyUser(req, res, () => {
    if (req.role === "admin" || req.role === "manager") {
      return next();
    }
    return res
      .status(403)
      .json({ success: false, message: "Access Denied" });
  });
};
