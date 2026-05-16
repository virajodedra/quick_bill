import mongoose from "mongoose";
import Order from "../model/order.model.js";
import Product from "../model/product.model.js";
import Invoice from "../model/invoice.model.js";
import StockMovement from "../model/stockMovement.model.js";

function buildError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function generateOrderNumber() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `QB-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${rand}`;
}

function generateInvoiceNumber() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const rand = Math.floor(Math.random() * 90000) + 10000;
  return `INV-${d.getFullYear()}${pad(d.getMonth() + 1)}-${rand}`;
}

async function buildOrderItems(itemsInput) {
  const productIds = itemsInput.map((i) => i.productId);
  const products = await Product.find({ _id: { $in: productIds }, isActive: true });
  const productMap = new Map(products.map((p) => [p._id.toString(), p]));

  const items = [];
  for (const item of itemsInput) {
    const product = productMap.get(item.productId);
    if (!product) throw buildError(404, `Product not found or inactive: ${item.productId}`);
    if (item.quantity < 1) throw buildError(400, `Quantity must be at least 1`);

    items.push({
      product: product._id,
      nameSnapshot: product.name,
      skuSnapshot: product.sku || "",
      unitSnapshot: product.unit || "",
      quantity: item.quantity,
      price: product.price,
      total: +(product.price * item.quantity).toFixed(2),
    });
  }
  return items;
}

export async function createOrder({ items: itemsInput, customer, notes, userId }) {
  const items = await buildOrderItems(itemsInput);
  const subtotal = +items.reduce((s, i) => s + i.total, 0).toFixed(2);

  const order = await Order.create({
    orderNumber: generateOrderNumber(),
    items,
    customer: customer || {},
    notes: notes || "",
    subtotal,
    grandTotal: subtotal,
    createdBy: userId || null,
    isGuestOrder: !userId,
    status: "draft",
  });

  return Order.findById(order._id).populate("createdBy", "name username");
}

export async function confirmOrder(orderId, userId) {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      const order = await Order.findById(orderId).session(session);
      if (!order) throw buildError(404, "Order not found");
      if (order.status !== "draft") throw buildError(400, `Order is already ${order.status}`);

      // Atomic: check stock then deduct for all items
      for (const item of order.items) {
        const product = await Product.findById(item.product).session(session);
        if (!product || !product.isActive) {
          throw buildError(400, `Product "${item.nameSnapshot}" is no longer available`);
        }
        if (product.stock < item.quantity) {
          throw buildError(
            400,
            `Insufficient stock for "${product.name}". Available: ${product.stock}, Requested: ${item.quantity}`
          );
        }

        const beforeQty = product.stock;
        const afterQty = product.stock - item.quantity;

        await Product.findByIdAndUpdate(
          product._id,
          { $inc: { stock: -item.quantity } },
          { session }
        );

        await StockMovement.create(
          [{ product: product._id, type: "out", quantity: item.quantity, beforeQty, afterQty, reason: "sale", relatedOrder: order._id, createdBy: userId }],
          { session }
        );
      }

      // Create invoice atomically
      const [invoice] = await Invoice.create(
        [{ invoiceNumber: generateInvoiceNumber(), order: order._id, status: "issued", issuedAt: new Date(), customerEmail: order.customer?.email || "" }],
        { session }
      );

      order.status = "confirmed";
      order.confirmedAt = new Date();
      order.invoice = invoice._id;
      await order.save({ session });
      result = order._id;
    });

    return Order.findById(result).populate("createdBy", "name username").populate("invoice");
  } finally {
    await session.endSession();
  }
}

export async function cancelOrder(orderId, { reason, userId }) {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      const order = await Order.findById(orderId).session(session);
      if (!order) throw buildError(404, "Order not found");
      if (order.status === "cancelled") throw buildError(400, "Order is already cancelled");

      // Restore stock only if confirmed (stock was deducted)
      if (order.status === "confirmed") {
        for (const item of order.items) {
          const product = await Product.findById(item.product).session(session);
          if (!product) continue;

          const beforeQty = product.stock;
          const afterQty = product.stock + item.quantity;

          await Product.findByIdAndUpdate(product._id, { $inc: { stock: item.quantity } }, { session });
          await StockMovement.create(
            [{ product: product._id, type: "cancel", quantity: item.quantity, beforeQty, afterQty, reason: "order_cancelled", relatedOrder: order._id, createdBy: userId }],
            { session }
          );
        }

        if (order.invoice) {
          await Invoice.findByIdAndUpdate(order.invoice, { status: "cancelled" }, { session });
        }
      }

      order.status = "cancelled";
      order.cancelledAt = new Date();
      order.cancelReason = reason || "No reason provided";
      await order.save({ session });
      result = order._id;
    });

    return Order.findById(result).populate("createdBy", "name username").populate("invoice");
  } finally {
    await session.endSession();
  }
}

export async function getOrders({ page = 1, limit = 20, status, search }) {
  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.min(100, Math.max(1, Number(limit) || 20));
  const filter = {};
  if (status) filter.status = status;
  if (search) {
    const r = new RegExp(search, "i");
    filter.$or = [{ orderNumber: r }, { "customer.name": r }, { "customer.email": r }];
  }

  const [items, total] = await Promise.all([
    Order.find(filter).populate("createdBy", "name username").populate("invoice", "invoiceNumber").sort({ createdAt: -1 }).skip((safePage - 1) * safeLimit).limit(safeLimit),
    Order.countDocuments(filter),
  ]);

  return { items, meta: { page: safePage, limit: safeLimit, total, totalPages: Math.max(1, Math.ceil(total / safeLimit)) } };
}

export async function getOrderById(orderId) {
  const order = await Order.findById(orderId)
    .populate("createdBy", "name username")
    .populate("invoice")
    .populate("items.product", "name sku unit price");
  if (!order) throw buildError(404, "Order not found");
  return order;
}
