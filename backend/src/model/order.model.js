import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    nameSnapshot: { type: String, trim: true, required: true },
    skuSnapshot: { type: String, trim: true },
    unitSnapshot: { type: String, trim: true },
    quantity: { type: Number, min: 1, required: true },
    price: { type: Number, min: 0, required: true },
    total: { type: Number, min: 0, required: true },
  },
  { _id: false },
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, unique: true, sparse: true },
    status: {
      type: String,
      enum: ["draft", "confirmed", "cancelled"],
      default: "draft",
      index: true,
    },
    items: { type: [orderItemSchema], default: [] },
    customer: {
      name: { type: String, trim: true },
      email: { type: String, trim: true, lowercase: true },
      phone: { type: String, trim: true },
    },
    payment: {
      method: { type: String, trim: true },
      status: { type: String, trim: true },
      reference: { type: String, trim: true },
    },
    subtotal: { type: Number, min: 0, default: 0 },
    discount: { type: Number, min: 0, default: 0 },
    tax: { type: Number, min: 0, default: 0 },
    grandTotal: { type: Number, min: 0, default: 0 },
    currency: { type: String, trim: true, default: "INR" },
    notes: { type: String, trim: true },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    isGuestOrder: { type: Boolean, default: false },
    confirmedAt: { type: Date },
    cancelledAt: { type: Date },
    cancelReason: { type: String, trim: true },
    invoice: { type: mongoose.Schema.Types.ObjectId, ref: "Invoice" },
  },
  { timestamps: true },
);

orderSchema.index({ createdAt: -1 });

export default mongoose.model("Order", orderSchema);
