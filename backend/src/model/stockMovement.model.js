import mongoose from "mongoose";

const stockMovementSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["in", "out", "adjustment", "cancel"],
      required: true,
    },
    quantity: { type: Number, min: 0, required: true },
    beforeQty: { type: Number, min: 0, required: true },
    afterQty: { type: Number, min: 0, required: true },
    reason: { type: String, trim: true },
    note: { type: String, trim: true },
    relatedOrder: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

export default mongoose.model("StockMovement", stockMovementSchema);
