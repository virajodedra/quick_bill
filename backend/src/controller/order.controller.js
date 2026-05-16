import * as orderService from "../service/order.service.js";

function sendError(res, error) {
  const status = error?.status || 500;
  const message = error?.message || "Something went wrong";
  if (status >= 500) console.error(error);
  return res.status(status).json({ success: false, message });
}

async function create(req, res) {
  try {
    const order = await orderService.createOrder({ ...req.body, userId: req.user.id });
    return res.status(201).json({ success: true, message: "Order created", data: { order } });
  } catch (e) { return sendError(res, e); }
}

async function confirm(req, res) {
  try {
    const order = await orderService.confirmOrder(req.params.id, req.user.id);
    return res.status(200).json({ success: true, message: "Order confirmed", data: { order } });
  } catch (e) { return sendError(res, e); }
}

async function cancel(req, res) {
  try {
    const order = await orderService.cancelOrder(req.params.id, { reason: req.body.reason, userId: req.user.id });
    return res.status(200).json({ success: true, message: "Order cancelled", data: { order } });
  } catch (e) { return sendError(res, e); }
}

async function list(req, res) {
  try {
    const result = await orderService.getOrders(req.query);
    return res.status(200).json({ success: true, data: { orders: result.items }, meta: result.meta });
  } catch (e) { return sendError(res, e); }
}

async function getOne(req, res) {
  try {
    const order = await orderService.getOrderById(req.params.id);
    return res.status(200).json({ success: true, data: { order } });
  } catch (e) { return sendError(res, e); }
}

async function publicCreate(req, res) {
  try {
    // Guest order — no userId, customer info required
    const order = await orderService.createOrder({ ...req.body, userId: null });
    return res.status(201).json({ success: true, message: "Order placed successfully", data: { order } });
  } catch (e) { return sendError(res, e); }
}

export default { create, confirm, cancel, list, getOne, publicCreate };
