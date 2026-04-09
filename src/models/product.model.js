import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    product_name: {
      type: String,
      required: true,
      trim: true
    },

    description: {
      type: String,
      trim: true
    },

    specifications: {
      type: String,
      trim: true
    },

    category_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true
    },

    brand_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Brand",
      required: true
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
    offer_min_final_price: {
      type: Number,
      default: 0,
      min: 0
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

const Product = mongoose.model("Product", productSchema);

export default Product;
