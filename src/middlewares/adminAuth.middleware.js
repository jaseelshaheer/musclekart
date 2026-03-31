import jwt from "jsonwebtoken";
import HTTP_STATUS from "../constants/httpStatus.js";

export const adminAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: "Authorization token missing",
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== "admin") {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: "Admin access denied",
      });
    }

    req.admin = decoded; 

    next();

  } catch (error) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};
