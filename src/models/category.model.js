import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    description: {
      type: String,
      trim: true
    },
    offer_discount_type: {
      type: String,
      enum: ["flat", "percentage"],
      default: null
    },
    offer_discount_value: {
      type: Number,
      default: 0,
      min: 0
    },
    offer_start_date: {
      type: Date,
      default: null
    },
    offer_expiry_date: {
      type: Date,
      default: null
    },
    offer_is_active: {
      type: Boolean,
      default: false
    },

    isActive: {
      type: Boolean,
      default: true
    },

    isDeleted: {
      type: Boolean,
      default: false
    },

    deletedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model("Category", categorySchema);
