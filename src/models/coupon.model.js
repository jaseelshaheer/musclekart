import mongoose from "mongoose";

const couponSchema = new mongoose.Schema(
  {
    coupon_code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true
    },
    is_active: {
      type: Boolean,
      default: true
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    min_purchase: {
      type: Number,
      required: true,
      min: 0
    },
    discount_type: {
      type: String,
      enum: ["flat", "percentage"],
      required: true
    },
    discount_value: {
      type: Number,
      required: true,
      min: 0
    },
    usage_limit: {
      type: Number,
      required: true,
      min: 1
    },
    usage_per_user: {
      type: Number,
      required: true,
      min: 1
    },
    used_count: {
      type: Number,
      default: 0,
      min: 0
    },
    max_discount: {
      type: Number,
      default: 0,
      min: 0
    },
    start_date: {
      type: Date,
      required: true
    },
    expiry_date: {
      type: Date,
      required: true
    }
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at"
    }
  }
);

const Coupon = mongoose.model("Coupon", couponSchema);

export default Coupon;
