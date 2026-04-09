import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true
    },

    lastName: {
      type: String,
      trim: true
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true
    },

    phone: {
      type: String,
      unique: true,
      sparse: true
    },

    password: {
      type: String,
      select: false
    },

    profileImage: {
      type: String,
      default: "/images/user-dp.jpg"
    },

    authProvider: {
      type: String,
      enum: ["local", "google"],
      default: "local"
    },

    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user"
    },

    isBlocked: {
      type: Boolean,
      default: false
    },

    referral_code: {
      type: String,
      unique: true
    },

    referred_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },

    referral_reward_granted: {
      type: Boolean,
      default: false
    },

    last_login_at: {
      type: Date
    },

    pendingEmail: {
      type: String
    },

    otpPurpose: {
      type: String,
      enum: ["signup", "forgot_password", "email_change"]
    },

    otp: {
      type: String,
      select: false
    },

    otpExpiresAt: {
      type: Date
    },

    isEmailVerified: {
      type: Boolean,
      default: false
    }
  },

  {
    timestamps: true
  }
);

export default mongoose.model("User", userSchema);
