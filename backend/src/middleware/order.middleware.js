import { validateCreateOrder, validateCancelOrder } from "../validation/order.validation.js";

function sendValidationError(res, error) {
  return res.status(error.status || 400).json({ success: false, message: error.message || "Invalid request" });
}

export function validateCreate(req, res, next) {
  const { value, error } = validateCreateOrder(req.body);
  if (error) return sendValidationError(res, error);
  req.body = value;
  return next();
}

export function validateCancel(req, res, next) {
  const { value, error } = validateCancelOrder(req.body);
  if (error) return sendValidationError(res, error);
  req.body = value;
  return next();
}
