const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function buildError(status, message) {
  return { status, message };
}

export function validateLoginPayload(body) {
  if (!body) {
    return {
      error: buildError(
        400,
        "Request body is required. Send JSON with Content-Type: application/json",
      ),
    };
  }

  const usernameOrEmail = String(body.username || body.email || "")
    .toLowerCase()
    .trim();
  const password = String(body.password || "");

  if (!usernameOrEmail || !password) {
    return { error: buildError(400, "Username/Email and password are required") };
  }

  return { value: { usernameOrEmail, password } };
}

export function validateRegisterPayload(body) {
  if (!body) {
    return {
      error: buildError(
        400,
        "Request body is required. Send JSON with Content-Type: application/json",
      ),
    };
  }

  const name = String(body.name || "").trim();
  const username = String(body.username || "")
    .toLowerCase()
    .trim();
  const email = String(body.email || "")
    .toLowerCase()
    .trim();
  const password = String(body.password || "");
  const role = body.role ? String(body.role) : "staff";

  if (!name || !username || !email || !password) {
    return {
      error: buildError(
        400,
        "Name, username, email, and password are required",
      ),
    };
  }

  if (!EMAIL_REGEX.test(email)) {
    return { error: buildError(400, "Invalid email format") };
  }

  if (!["admin", "staff"].includes(role)) {
    return { error: buildError(400, "Role must be admin or staff") };
  }

  return {
    value: {
      name,
      username,
      email,
      password,
      role,
    },
  };
}

export function validateRefreshPayload(body, cookies) {
  const refreshToken = cookies?.refreshToken || body?.refreshToken;

  if (!refreshToken) {
    return { error: buildError(400, "Refresh token is required") };
  }

  return { value: { refreshToken } };
}
