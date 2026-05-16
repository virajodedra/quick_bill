import {
  validateCreateProduct,
  validateUpdateProduct,
  validateProductQuery,
} from "../validation/product.validation.js";

function sendValidationError(res, error) {
  return res.status(error.status || 400).json({
    success: false,
    message: error.message || "Invalid request",
  });
}

export function validateCreate(req, res, next) {
  const { value, error } = validateCreateProduct(req.body);
  if (error) {
    return sendValidationError(res, error);
  }

  req.body = value;
  return next();
}

export function validateUpdate(req, res, next) {
  const { value, error } = validateUpdateProduct(req.body);
  if (error) {
    return sendValidationError(res, error);
  }

  req.body = value;
  return next();
}

export function validateList(req, res, next) {
  const { value, error } = validateProductQuery(req.query);
  if (error) {
    return sendValidationError(res, error);
  }

  req.validatedQuery = value;
  return next();
}
