import jwt from "jsonwebtoken";
import BlacklistedToken from "../model/blacklistedToken.model.js";
import {
  validateLoginPayload,
  validateRegisterPayload,
  validateRefreshPayload,
} from "../validation/auth.validation.js";
import { hashToken } from "../service/auth.service.js";

function sendValidationError(res, error) {
  return res.status(error.status || 400).json({
    success: false,
    message: error.message || "Invalid request",
  });
}

export function validateLogin(req, res, next) {
  const { value, error } = validateLoginPayload(req.body);
  if (error) {
    return sendValidationError(res, error);
  }

  req.body = value;
  return next();
}

export function validateRegister(req, res, next) {
  const { value, error } = validateRegisterPayload(req.body);
  if (error) {
    return sendValidationError(res, error);
  }

  req.body = value;
  return next();
}

export function validateRefresh(req, res, next) {
  const { value, error } = validateRefreshPayload(req.body, req.cookies);
  if (error) {
    return sendValidationError(res, error);
  }

  req.body.refreshToken = value.refreshToken;
  return next();
}

export function validateLogout(req, res, next) {
  const { value, error } = validateRefreshPayload(req.body, req.cookies);
  if (error) {
    return sendValidationError(res, error);
  }

  req.body.refreshToken = value.refreshToken;
  return next();
}

export async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Access token is missing",
    });
  }

  if (!process.env.JWT_ACCESS_SECRET) {
    return res.status(500).json({
      success: false,
      message: "Server misconfiguration: JWT_ACCESS_SECRET is missing",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    const tokenHash = hashToken(token);
    const blacklisted = await BlacklistedToken.findOne({ tokenHash });

    if (blacklisted) {
      return res.status(401).json({
        success: false,
        message: "Token has been revoked",
      });
    }

    req.user = decoded;
    return next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Forbidden",
      });
    }

    return next();
  };
}
