import bcrypt from "bcrypt";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import User from "../model/user.model.js";
import RefreshToken from "../model/refreshToken.model.js";
import BlacklistedToken from "../model/blacklistedToken.model.js";

const ACCESS_TTL = process.env.JWT_ACCESS_TTL || "15m";
const REFRESH_TTL = process.env.JWT_REFRESH_TTL || "7d";
const REFRESH_COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

function buildError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

export function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function ensureAccessSecret() {
  if (!process.env.JWT_ACCESS_SECRET) {
    throw buildError(
      500,
      "Server misconfiguration: JWT_ACCESS_SECRET is missing",
    );
  }
  return process.env.JWT_ACCESS_SECRET;
}

function ensureRefreshSecret() {
  if (!process.env.JWT_REFRESH_SECRET) {
    throw buildError(
      500,
      "Server misconfiguration: JWT_REFRESH_SECRET is missing",
    );
  }
  return process.env.JWT_REFRESH_SECRET;
}

function getExpiresAt(token) {
  const decoded = jwt.decode(token);
  if (!decoded?.exp) {
    return null;
  }
  return new Date(decoded.exp * 1000);
}

function createAccessToken(user) {
  const secret = ensureAccessSecret();
  return jwt.sign({ id: user._id, role: user.role }, secret, {
    expiresIn: ACCESS_TTL,
  });
}

function createRefreshToken(user) {
  const secret = ensureRefreshSecret();
  const token = jwt.sign(
    { id: user._id, tokenId: crypto.randomUUID() },
    secret,
    { expiresIn: REFRESH_TTL },
  );

  return {
    token,
    tokenHash: hashToken(token),
    expiresAt: getExpiresAt(token),
  };
}

export function getRefreshCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: REFRESH_COOKIE_MAX_AGE,
    path: "/",
  };
}

export async function registerUser({ name, username, email, password, role }) {
  const existingUser = await User.findOne({
    $or: [{ email }, { username }],
  });

  if (existingUser) {
    throw buildError(409, "Username or email already exists");
  }

  const user = await User.create({
    name,
    username,
    email,
    passwordHash: password,
    role: role || "staff",
  });

  return user;
}

export async function loginUser({ usernameOrEmail, password, ip, userAgent }) {
  const user = await User.findOne({
    $or: [{ email: usernameOrEmail }, { username: usernameOrEmail }]
  }).select("+passwordHash");

  if (!user || !user.isActive) {
    throw buildError(401, "Invalid credentials");
  }

  const isValidPassword = await bcrypt.compare(password, user.passwordHash);
  if (!isValidPassword) {
    throw buildError(401, "Invalid credentials");
  }

  const accessToken = createAccessToken(user);
  const refresh = createRefreshToken(user);

  if (!refresh.expiresAt) {
    throw buildError(500, "Failed to compute refresh token expiry");
  }

  await RefreshToken.create({
    user: user._id,
    tokenHash: refresh.tokenHash,
    expiresAt: refresh.expiresAt,
    ip,
    userAgent,
  });

  user.lastLoginAt = new Date();
  await user.save({ validateBeforeSave: false });

  return { accessToken, refreshToken: refresh.token, user };
}

export async function refreshSession({ refreshToken, ip, userAgent }) {
  const secret = ensureRefreshSecret();
  let decoded;

  try {
    decoded = jwt.verify(refreshToken, secret);
  } catch (error) {
    throw buildError(401, "Invalid refresh token");
  }

  const tokenHash = hashToken(refreshToken);
  const storedToken = await RefreshToken.findOne({
    tokenHash,
    isRevoked: false,
  });

  if (!storedToken) {
    throw buildError(401, "Invalid refresh token");
  }

  const user = await User.findById(decoded.id);
  if (!user || !user.isActive) {
    throw buildError(401, "User not found or inactive");
  }

  const accessToken = createAccessToken(user);
  const refresh = createRefreshToken(user);

  if (!refresh.expiresAt) {
    throw buildError(500, "Failed to compute refresh token expiry");
  }

  storedToken.isRevoked = true;
  storedToken.replacedByTokenHash = refresh.tokenHash;
  storedToken.lastUsedAt = new Date();
  await storedToken.save();

  await RefreshToken.create({
    user: user._id,
    tokenHash: refresh.tokenHash,
    expiresAt: refresh.expiresAt,
    ip,
    userAgent,
  });

  return { accessToken, refreshToken: refresh.token };
}

export async function logoutUser({ refreshToken, accessToken }) {
  if (!refreshToken) {
    throw buildError(400, "Refresh token is required");
  }

  const secret = ensureRefreshSecret();
  try {
    jwt.verify(refreshToken, secret);
  } catch (error) {
    throw buildError(401, "Invalid refresh token");
  }

  const tokenHash = hashToken(refreshToken);
  const storedToken = await RefreshToken.findOne({ tokenHash });

  if (!storedToken || storedToken.isRevoked) {
    throw buildError(401, "Invalid refresh token");
  }

  storedToken.isRevoked = true;
  storedToken.lastUsedAt = new Date();
  await storedToken.save();

  if (accessToken) {
    const expiresAt = getExpiresAt(accessToken);
    if (expiresAt) {
      const accessTokenHash = hashToken(accessToken);
      await BlacklistedToken.updateOne(
        { tokenHash: accessTokenHash },
        { tokenHash: accessTokenHash, expiresAt, reason: "logout" },
        { upsert: true },
      );
    }
  }
}

export default {
  registerUser,
  loginUser,
  refreshSession,
  logoutUser,
  getRefreshCookieOptions,
  hashToken,
  getAccessTokenFromHeader: (req) => {
    const authHeader = req.headers.authorization || "";
    return authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  },
};
