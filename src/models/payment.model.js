import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    order_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true
    },
    method: {
      type: String,
      enum: ["cod", "card", "upi", "wallet"],
      required: true
    },
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "failed", "cancelled", "refunded"],
      default: "pending"
    },
    transaction_id: {
      type: String,
      default: "",
      trim: true
    },
    paid_at: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at"
    }
  }
);

const Payment = mongoose.model("Payment", paymentSchema);

export default Payment;
