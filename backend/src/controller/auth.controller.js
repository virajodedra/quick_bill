import authService from "../service/auth.service.js";

function buildUserResponse(user) {
  return {
    id: user._id,
    name: user.name,
    username: user.username,
    email: user.email,
    role: user.role,
  };
}

function sendError(res, error) {
  const status = error?.status || 500;
  const message = error?.message || "Something went wrong";

  if (status >= 500) {
    console.error(error);
  }

  return res.status(status).json({
    success: false,
    message,
  });
}

function setRefreshCookie(res, refreshToken) {
  res.cookie(
    "refreshToken",
    refreshToken,
    authService.getRefreshCookieOptions(),
  );
}

function clearRefreshCookie(res) {
  res.clearCookie("refreshToken", authService.getRefreshCookieOptions());
}

async function register(req, res) {
  try {
    const user = await authService.registerUser({
      ...req.body,
      createdBy: req.user?.id,
    });

    return res.status(201).json({
      success: true,
      message: "User created successfully",
      data: { user: buildUserResponse(user) },
    });
  } catch (error) {
    return sendError(res, error);
  }
}

async function login(req, res) {
  try {
    const { accessToken, refreshToken, user } = await authService.loginUser({
      ...req.body,
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });

    setRefreshCookie(res, refreshToken);

    return res.status(200).json({
      success: true,
      message: "Logged in successfully",
      data: {
        accessToken,
        user: buildUserResponse(user),
      },
    });
  } catch (error) {
    return sendError(res, error);
  }
}

async function refresh(req, res) {
  try {
    const { accessToken, refreshToken } = await authService.refreshSession({
      refreshToken: req.body.refreshToken,
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });

    setRefreshCookie(res, refreshToken);

    return res.status(200).json({
      success: true,
      message: "Access token refreshed successfully",
      data: { accessToken },
    });
  } catch (error) {
    return sendError(res, error);
  }
}

async function logout(req, res) {
  try {
    const accessToken = authService.getAccessTokenFromHeader(req);

    await authService.logoutUser({
      refreshToken: req.body.refreshToken,
      accessToken,
    });

    clearRefreshCookie(res);

    return res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    return sendError(res, error);
  }
}

export default {
  register,
  login,
  refresh,
  logout,
};
