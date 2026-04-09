import bcrypt from "bcrypt";
import User from "../models/user.model.js";
import { generateOTPService, verifyOTPService } from "./otp.service.js";
import { sendEmail } from "../utils/email.js";
import {
  generateUniqueReferralCode,
  findReferrerByCode,
  resolveReferrerFromToken
} from "./user/referral.service.js";

export const createUser = async (userData) => {
  const { firstName, lastName, email, password, phone, referralCode, referralToken } = userData;

  const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;

  if (!strongPasswordRegex.test(password)) {
    throw new Error(
      "Password must be at least 8 characters and include uppercase, lowercase, number and special character."
    );
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new Error("User already exists");
  }

  let referredByUser = null;

  if (referralToken?.trim()) {
    const { referrer } = await resolveReferrerFromToken(referralToken);
    referredByUser = referrer;
  } else if (referralCode?.trim()) {
    referredByUser = await findReferrerByCode(referralCode);

    if (!referredByUser) {
      throw new Error("Invalid referral code");
    }
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const referralCodeForUser = await generateUniqueReferralCode(firstName);

  const user = await User.create({
    firstName,
    lastName,
    email,
    phone,
    password: hashedPassword,
    isEmailVerified: false,
    referral_code: referralCodeForUser,
    referred_by: referredByUser ? referredByUser._id : null
  });

  const otp = await generateOTPService(user._id);

  await sendEmail({
    to: email,
    subject: "Verify your MuscleKart account",
    html: `
      <h2>Email Verification</h2>
      <p>Your OTP is:</p>
      <h1>${otp}</h1>
      <p>This OTP is valid for 5 minutes.</p>
    `
  });

  return user;
};

export const resendSignupOTPService = async (email, type) => {
  const user = await User.findOne({ email });

  if (!user) {
    throw new Error("User not found");
  }

  if (type !== "reset" && user.isEmailVerified) {
    throw new Error("Email already verified");
  }

  const otp = await generateOTPService(user._id);

  await sendEmail({
    to: email,
    subject:
      type === "reset"
        ? "Reset Password OTP - MuscleKart"
        : "Resend OTP - Verify your MuscleKart account",
    html: `
      <h2>${type === "reset" ? "Password Reset" : "Email Verification"}</h2>
      <p>Your OTP is:</p>
      <h1>${otp}</h1>
      <p>This OTP is valid for 5 minutes.</p>
    `
  });

  return true;
};

export const verifySignupOTPService = async (email, otp, type = "signup") => {
  const user = await User.findOne({ email });

  if (!user) {
    throw new Error("User not found");
  }
  console.log(type);

  if (type === "signup" && user.isEmailVerified) {
    throw new Error("Email already verified");
  }

  await verifyOTPService(user._id, otp);

  if (type === "signup") {
    user.isEmailVerified = true;
    await user.save();
  }

  return true;
};

export const loginUser = async (email, password) => {
  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    throw new Error("User not found");
  }

  const isPasswordMatch = await bcrypt.compare(password, user.password);

  if (!isPasswordMatch) {
    throw new Error("Invalid password");
  }

  if (user.isBlocked) {
    throw new Error("Your account is blocked. Contact support.");
  }

  if (!user.isEmailVerified) {
    throw new Error("Please verify your email before logging in.");
  }

  return user;
};

export const forgotPasswordService = async (email) => {
  const user = await User.findOne({ email });

  if (!user) return true;

  if (user.authProvider === "google") {
    throw new Error(
      "Password reset is not allowed for Google accounts. Please login using Google."
    );
  }

  const otp = await generateOTPService(user._id);

  await sendEmail({
    to: email,
    subject: "Reset your MuscleKart password",
    html: `
      <h2>Password Reset</h2>
      <p>Your OTP is:</p>
      <h1>${otp}</h1>
      <p>This OTP is valid for 5 minutes.</p>
    `
  });
};

export const resetPasswordService = async (email, newPassword) => {
  const user = await User.findOne({ email });

  const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;

  if (!strongPasswordRegex.test(newPassword)) {
    throw new Error(
      "Password must be at least 8 characters and include uppercase, lowercase, number and special character."
    );
  }

  if (!user) {
    throw new Error("User not found");
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  user.password = hashedPassword;

  user.otp = undefined;
  user.otpExpiresAt = undefined;

  await user.save();

  return true;
};

export const adminLogin = async (email, password) => {
  const admin = await User.findOne({ email }).select("+password");

  if (!admin) throw new Error("Invalid credentials");
  if (admin.role !== "admin") throw new Error("Admin access denied");

  const isMatch = await bcrypt.compare(password, admin.password);
  if (!isMatch) throw new Error("Invalid credentials");

  return admin;
};

export const resolveReferralTokenService = async (token) => {
  const { referrer, referralCode } = await resolveReferrerFromToken(token);

  return {
    referralCode,
    referrerName: `${referrer.firstName || ""} ${referrer.lastName || ""}`.trim() || "Friend"
  };
};
