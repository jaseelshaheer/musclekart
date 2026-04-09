import mongoose from "mongoose";

const attributeSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true
    },

    value: {
      type: String,
      required: true
    }
  },
  { _id: false }
);

const variantSchema = new mongoose.Schema(
  {
    product_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true
    },

    price: {
      type: Number,
      required: true
    },

    stock_qty: {
      type: Number,
      required: true,
      default: 0
    },

    main_image: {
      type: String
    },

    gallery_images: {
      type: [String],
      default: []
    },

    attributes: {
      type: [attributeSchema],
      default: []
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

const Variant = mongoose.model("Variant", variantSchema);

export default Variant;
