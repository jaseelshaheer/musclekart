import mongoose from "mongoose";

const brandSchema = new mongoose.Schema(
{
  name: {
    type: String,
    required: true,
    trim: true
  },

  status: {
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

export default mongoose.model("Brand", brandSchema);