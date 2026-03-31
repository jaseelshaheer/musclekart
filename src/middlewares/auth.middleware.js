import jwt from "jsonwebtoken"
import User from "../models/user.model.js"
import { verifyToken } from "../utils/jwt.js";
import HTTP_STATUS from "../constants/httpStatus.js";

export const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: "Not authorized, token missing",
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = verifyToken(token);

    const user = await User.findById(decoded.userId).select("+password");

    if (!user) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.isBlocked) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: "Your account has been blocked."
      });
    }

    req.user = user;
    res.locals.user = user;
    next();
  } catch (error) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: "Not authorized, invalid token",
    });
  }
};


export const adminOnly = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(HTTP_STATUS.FORBIDDEN).json({
      success: false,
      message: "Admin access only",
    });
  }

  next();
};