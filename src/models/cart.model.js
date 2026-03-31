import mongoose from "mongoose";

const cartItemSchema = new mongoose.Schema(
  {
    product_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true
    },
    variant_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Variant",
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: false }
);

const cartSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true
    },
    cart_items: {
      type: [cartItemSchema],
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

export default mongoose.model("Cart", cartSchema);
