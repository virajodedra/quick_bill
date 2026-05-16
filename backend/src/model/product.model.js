import mongoose from "mongoose";

const stationerySpecSchema = new mongoose.Schema(
  {
    color: { type: String, trim: true },
    size: { type: String, trim: true },
    material: { type: String, trim: true },
    pages: { type: Number, min: 1 },
    gsm: { type: Number, min: 1 },
    inkColor: { type: String, trim: true },
  },
  { _id: false },
);

const electronicsSpecSchema = new mongoose.Schema(
  {
    model: { type: String, trim: true },
    warrantyMonths: { type: Number, min: 0 },
    voltage: { type: String, trim: true },
    power: { type: String, trim: true },
    serialNumber: { type: String, trim: true },
  },
  { _id: false },
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, required: true },
    brand: { type: String, trim: true, default: "" },
    category: { type: String, trim: true },
    itemType: {
      type: String,
      enum: ["stationery", "electronics"],
      required: true,
    },
    description: { type: String, trim: true },
    sku: {
      type: String,
      trim: true,
      uppercase: true,
      unique: true,
      sparse: true,
    },
    barcode: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
    },
    unit: { type: String, trim: true, default: "" },
    price: { type: Number, min: 0, required: true },
    costPrice: { type: Number, min: 0 },
    taxRate: { type: Number, min: 0, max: 100, default: 0 },
    stock: { type: Number, min: 0, default: 0 },
    lowStockThreshold: { type: Number, min: 0, default: 5 },
    isActive: { type: Boolean, default: true },
    imageUrl: { type: String, trim: true },
    specs: {
      stationery: { type: stationerySpecSchema },
      electronics: { type: electronicsSpecSchema },
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

productSchema.index({ name: 1, brand: 1, unit: 1 }, { unique: true });
productSchema.index({ category: 1 });
productSchema.index({ itemType: 1 });
productSchema.index({
  name: "text",
  brand: "text",
  description: "text",
  sku: "text",
  barcode: "text",
});

export default mongoose.model("Product", productSchema);
