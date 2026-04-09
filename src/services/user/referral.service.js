import User from "../../models/user.model.js";
import jwt from "jsonwebtoken";

function generateReferralCode(firstName = "") {
  const prefix =
    String(firstName || "MK")
      .replace(/[^a-zA-Z0-9]/g, "")
      .toUpperCase()
      .slice(0, 4) || "MK";

  const randomPart = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `${prefix}${randomPart}`;
}

export async function generateUniqueReferralCode(firstName = "") {
  let code = generateReferralCode(firstName);
  let exists = await User.findOne({ referral_code: code }).lean();

  while (exists) {
    code = generateReferralCode(firstName);
    exists = await User.findOne({ referral_code: code }).lean();
  }

  return code;
}

export async function findReferrerByCode(referralCode) {
  if (!referralCode?.trim()) return null;

  const normalizedCode = referralCode.trim().toUpperCase();

  const referrer = await User.findOne({
    referral_code: normalizedCode,
    isBlocked: false
  }).lean();

  return referrer || null;
}

const REFERRAL_TOKEN_EXPIRY = "30d";

function getReferralTokenSecret() {
  return process.env.REFERRAL_TOKEN_SECRET || process.env.JWT_SECRET;
}

export function generateReferralToken(referralCode) {
  const normalized = String(referralCode || "")
    .trim()
    .toUpperCase();

  if (!normalized) {
    throw new Error("Referral code is required");
  }

  return jwt.sign(
    {
      type: "referral_signup",
      referralCode: normalized
    },
    getReferralTokenSecret(),
    { expiresIn: REFERRAL_TOKEN_EXPIRY }
  );
}

export function verifyReferralToken(token) {
  if (!token?.trim()) {
    throw new Error("Referral token is required");
  }

  let decoded;
  try {
    decoded = jwt.verify(token.trim(), getReferralTokenSecret());
  } catch {
    throw new Error("Invalid or expired referral link");
  }

  if (decoded?.type !== "referral_signup" || !decoded?.referralCode) {
    throw new Error("Invalid referral link payload");
  }

  return String(decoded.referralCode).toUpperCase();
}

export async function resolveReferrerFromToken(token) {
  const referralCode = verifyReferralToken(token);
  const referrer = await findReferrerByCode(referralCode);

  if (!referrer) {
    throw new Error("Referral link is invalid");
  }

  return { referrer, referralCode };
}
