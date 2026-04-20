// import jwt from "jsonwebtoken";

// const ACCESS_EXPIRES = "15m";
// const REFRESH_EXPIRES = "7d";

// /* ACCESS TOKEN */
// export function signAccessToken({ userId, organizationId, role }) {
//   return jwt.sign(
//     {
//       sub: userId,
//       org: organizationId,
//       role,
//       typ: "access",
//     },
//     process.env.JWT_SECRET,
//     { expiresIn: ACCESS_EXPIRES },
//   );
// }

// /* REFRESH TOKEN */
// export function signRefreshToken({ userId, organizationId, role }) {
//   return jwt.sign(
//     {
//       sub: userId,
//       org: organizationId,
//       role,
//       typ: "refresh",
//     },
//     process.env.JWT_REFRESH_SECRET,
//     { expiresIn: REFRESH_EXPIRES },
//   );
// }

// /* GENERATE BOTH */
// export function generateTokens({ userId, organizationId, role }) {
//   return {
//     accessToken: signAccessToken({ userId, organizationId, role }),
//     refreshToken: signRefreshToken({ userId, organizationId, role }),
//   };
// }
///////////////////////////
import jwt from "jsonwebtoken";

const ACCESS_EXPIRES = "7d";
const REFRESH_EXPIRES = "7d";

/*
Generate access token
*/
export function signAccessToken({ userId, organizationId, role }) {
  return jwt.sign(
    {
      sub: userId,
      org: organizationId,
      role,
    },
    process.env.JWT_SECRET,
    { expiresIn: ACCESS_EXPIRES },
  );
}

/*
Generate refresh token
*/
export function signRefreshToken({ userId }) {
  return jwt.sign(
    {
      sub: userId,
    },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: REFRESH_EXPIRES },
  );
}

/*
Generate both tokens
*/
export function generateTokens({ userId, organizationId, role }) {
  const accessToken = signAccessToken({
    userId,
    organizationId,
    role,
  });

  const refreshToken = signRefreshToken({
    userId,
  });

  return { accessToken, refreshToken };
}

/*
Set authentication cookies
*/
export function setAuthCookies(res, { accessToken, refreshToken }) {
  const isProd = process.env.NODE_ENV === "production";

  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    maxAge: 15 * 600 * 10000,
    path: "/",
  });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/",
  });
}

/*
Clear cookies on logout
*/
export function clearAuthCookies(res) {
  const isProd = process.env.NODE_ENV === "production";

  res.clearCookie("accessToken", {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    path: "/",
  });

  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    path: "/",
  });
}

/*
Verify access token
*/
export function verifyAccessToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}

/*
Verify refresh token
*/
export function verifyRefreshToken(token) {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
}
