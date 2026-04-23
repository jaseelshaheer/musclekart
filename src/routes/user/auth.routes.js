import express from "express";
import {
  signup,
  login,
  verifySignupOTP,
  resendSignupOTP,
  forgotPassword,
  resetPassword,
  resolveReferralToken
} from "../../controllers/user/auth.controller.js";
import { generateToken } from "../../utils/jwt.js";
import passport from "passport";
import { validateSignup, validateLogin } from "../../middlewares/validate.middleware.js";
// import { googleCallback } from "../../controllers/user/auth.controller.js";
import { authLimiter, loginAuthLimiter } from "../../middlewares/rateLimit.middleware.js";

const router = express.Router();

router.post("/signup", authLimiter, validateSignup, signup);
router.post("/resend-otp", authLimiter, resendSignupOTP);
router.post("/login", loginAuthLimiter, validateLogin, login);
router.post("/verify-otp", authLimiter, verifySignupOTP);
router.post("/forgot-password", authLimiter, forgotPassword);
router.post("/reset-password", authLimiter, resetPassword);

router.get("/referral/resolve", resolveReferralToken);

router.get("/google",
  passport.authenticate("google", {
    scope: ["profile", "email"] ,
    prompt: "select_account"
  })
);

router.get("/google/callback", passport.authenticate("google", { session: false }), (req, res) => {
  const token = generateToken({
    userId: req.user._id,
    role: req.user.role
  });

  res.redirect(`/home?token=${token}`);
});

export default router;
