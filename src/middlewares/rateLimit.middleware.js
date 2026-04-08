import rateLimit from "express-rate-limit";

export const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,

  message: {
    success: false,
    message: "Too many requests. Please try again later."
  }
});

export const loginAuthLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,

  message: {
    success: false,
    message: "Too many requests. Please try again later."
  }
});


export const emailOtpLimiter = rateLimit({
  windowMs: 30 * 1000,
  max: 1,
  message: {
    success: false,
    message: "Please wait 30 seconds before requesting another OTP."
  }
});