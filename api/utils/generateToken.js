import jwt from "jsonwebtoken";

const ACCESS_EXPIRES_JWT    = "15m";
const REFRESH_EXPIRES_JWT   = "7d";
const ACCESS_EXPIRES_MS     = 15 * 60 * 1000;          // 15 minutes
const REFRESH_EXPIRES_MS    = 7 * 24 * 60 * 60 * 1000; // 7 days

export function signAccessToken({ userId, organizationId, role, isSuperAdmin = false }) {
  return jwt.sign(
    { sub: userId, org: organizationId, role, sadm: isSuperAdmin || undefined },
    process.env.JWT_SECRET,
    { expiresIn: ACCESS_EXPIRES_JWT },
  );
}

export function signRefreshToken({ userId, organizationId, role, isSuperAdmin = false }) {
  return jwt.sign(
    { sub: userId, org: organizationId, role, sadm: isSuperAdmin || undefined },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: REFRESH_EXPIRES_JWT },
  );
}

export function generateTokens({ userId, organizationId, role, isSuperAdmin = false }) {
  const accessToken  = signAccessToken({ userId, organizationId, role, isSuperAdmin });
  const refreshToken = signRefreshToken({ userId, organizationId, role, isSuperAdmin });
  return { accessToken, refreshToken };
}

export function setAuthCookies(res, { accessToken, refreshToken }) {
  const isProd = process.env.NODE_ENV === "production";
  const base   = { httpOnly: true, secure: isProd, sameSite: isProd ? "none" : "lax", path: "/" };

  res.cookie("accessToken",  accessToken,  { ...base, maxAge: ACCESS_EXPIRES_MS  });
  res.cookie("refreshToken", refreshToken, { ...base, maxAge: REFRESH_EXPIRES_MS });
}

export function clearAuthCookies(res) {
  const isProd = process.env.NODE_ENV === "production";
  const base   = { httpOnly: true, secure: isProd, sameSite: isProd ? "none" : "lax", path: "/" };

  res.clearCookie("accessToken",  base);
  res.clearCookie("refreshToken", base);
}

export function verifyAccessToken(token) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return null;
  }
}

export function verifyRefreshToken(token) {
  try {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  } catch {
    return null;
  }
}
