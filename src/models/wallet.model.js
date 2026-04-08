import mongoose from "mongoose";

const walletTransactionSchema = new mongoose.Schema(
  {
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    type: {
      type: String,
      enum: ["credit", "debit"],
      required: true
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    source: {
      type: String,
      enum: ["order_cancel", "order_return", "wallet_payment", "wallet_topup", "referral_reward"],
      required: true
    },
    order_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      default: null
    },
    created_at: {
      type: Date,
      default: Date.now
    }
  },
  { _id: true }
);

const walletSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true
    },
    balance: {
      type: Number,
      default: 0,
      min: 0
    },
    transactions: {
      type: [walletTransactionSchema],
      default: []
    }
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at"
    }
  }
);

const Wallet = mongoose.model("Wallet", walletSchema);

export default Wallet;
