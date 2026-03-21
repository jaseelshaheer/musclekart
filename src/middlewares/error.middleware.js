import HTTP_STATUS from "../constants/httpStatus.js";
import { COMMON_MESSAGES, AUTH_MESSAGES } from "../constants/messages.js";

export const errorHandler = (err, req, res, next) => {
  console.error(err);

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];

    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      field, 
      message: `${field} already exists`,
    });
  }

  const statusCode =
    err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;

  res.status(statusCode).json({
    success: false,
    message:
      err.message || COMMON_MESSAGES.SOMETHING_WENT_WRONG,
  });
};

