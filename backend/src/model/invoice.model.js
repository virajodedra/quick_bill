import mongoose from "mongoose";

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: { type: String, unique: true, sparse: true },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      unique: true,
    },
    pdfUrl: { type: String, trim: true },
    status: { type: String, enum: ["pending", "issued"], default: "pending" },
    issuedAt: { type: Date },
    emailedAt: { type: Date },
    customerEmail: { type: String, trim: true, lowercase: true },
  },
  { timestamps: true },
);

export default mongoose.model("Invoice", invoiceSchema);
