import mongoose from "mongoose";

const orderItemAttributeSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      trim: true
    },
    value: {
      type: String,
      required: true,
      trim: true
    }
  },
  { _id: false }
);

const orderItemSchema = new mongoose.Schema(
  {
    product_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    variant_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Variant",
      required: true,
    },
    product_name: {
      type: String,
      required: true,
      trim: true,
    },
    main_image: {
      type: String,
      default: "",
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    original_price: {
      type: Number,
      default: 0,
      min: 0,
    },
    discount_amount: {
      type: Number,
      default: 0,
      min: 0,
    },
    total: {
      type: Number,
      required: true,
      min: 0,
    },
    item_status: {
      type: String,
      enum: [
        "active",
        "cancelled",
        "return_requested",
        "return_rejected",
        "returned",
      ],
      default: "active",
    },
    cancel_reason: {
      type: String,
      trim: true,
      default: "",
    },
    return_reason: {
      type: String,
      trim: true,
      default: "",
    },
    return_reject_reason: {
      type: String,
      trim: true,
      default: "",
    },
    attributes: {
      type: [orderItemAttributeSchema],
      default: [],
    },
  },
  { _id: false },
);

const addressSnapshotSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    phone: {
      type: String,
      required: true,
      trim: true
    },
    house: {
      type: String,
      required: true,
      trim: true
    },
    country: {
      type: String,
      required: true,
      trim: true
    },
    district: {
      type: String,
      required: true,
      trim: true
    },
    state: {
      type: String,
      required: true,
      trim: true
    },
    pincode: {
      type: String,
      required: true,
      trim: true
    },
    landmark: {
      type: String,
      trim: true,
      default: ""
    },
    address_type: {
      type: String,
      enum: ["home", "work"],
      default: "home"
    }
  },
  { _id: false }
);

const statusHistorySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      required: true,
      trim: true
    },
    changed_at: {
      type: Date,
      default: Date.now
    },
    note: {
      type: String,
      trim: true,
      default: ""
    }
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    order_id: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    order_date: {
      type: Date,
      default: Date.now,
    },
    order_status: {
      type: String,
      enum: [
        "order_placed",
        "pending",
        "confirmed",
        "packed",
        "shipped",
        "out_for_delivery",
        "delivered",
        "return_requested",
        "return_rejected",
        "cancelled",
        "returned",
      ],
      default: "order_placed",
      index: true,
    },
    payment_method: {
      type: String,
      enum: ["cod", "card", "upi", "wallet"],
      required: true,
    },
    payment_status: {
      type: String,
      enum: ["pending", "paid", "failed", "cancelled", "refunded"],
      default: "pending",
    },

    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    delivery_charge: {
      type: Number,
      default: 0,
      min: 0,
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
    },
    grand_total: {
      type: Number,
      required: true,
      min: 0,
    },
    address_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Address",
      required: true,
    },
    coupon_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Coupon",
      default: null,
    },
    return_reject_reason: {
      type: String,
      trim: true,
      default: "",
    },
    address_snapshot: {
      type: addressSnapshotSchema,
      required: true,
    },
    items: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator: function (value) {
          return Array.isArray(value) && value.length > 0;
        },
        message: "Order must contain at least one item",
      },
    },
    status_history: {
      type: [statusHistorySchema],
      default: [],
    },
  },
  {
    timestamps: {
      createdAt: false,
      updatedAt: "updated_at",
    },
  },
);

const Order = mongoose.model("Order", orderSchema);

export default Order;
