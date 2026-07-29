import jwt from "jsonwebtoken"

export function authenticate(req, res, next) {

  let token = null

  /* cookies (web) */
  if (req.cookies?.accessToken) {
    token = req.cookies.accessToken
  }

  /* Authorization header (mobile / Postman) */
  if (!token && req.headers.authorization) {
    const parts = req.headers.authorization.split(" ")

    if (parts.length === 2 && parts[0] === "Bearer") {
      token = parts[1]
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Authentication required"
    })
  }

  try {
    const payload = jwt.verify(
      token,
      process.env.JWT_SECRET
    )

    req.user = {
      id:           payload.sub,
      organizationId: payload.org,
      role:         payload.role,
      isSuperAdmin: payload.sadm === true,
    }

    return next()

  } catch (err) {

    let message = "Invalid token"

    if (err.name === "TokenExpiredError") {
      message = "Token expired"
    }

    return res.status(401).json({
      success: false,
      message
    })
  }
}

/**
 * Special authentication for logout - accepts refresh token if access token expired
 * This allows users to logout even when their access token has expired
 */
export function authenticateForLogout(req, res, next) {
  // Try normal access token first
  let token = req.cookies?.accessToken || null;

  if (!token && req.headers.authorization) {
    const parts = req.headers.authorization.split(" ");
    if (parts.length === 2 && parts[0] === "Bearer") {
      token = parts[1];
    }
  }

  // If access token exists and is valid, use it
  if (token) {
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      req.user = {
        id: payload.sub,
        organizationId: payload.org,
        role: payload.role,
        isSuperAdmin: payload.sadm === true,
      };
      return next();
    } catch (err) {
      // Access token invalid/expired - fall through to refresh token
    }
  }

  // Access token missing or expired - try refresh token
  const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken || null;

  if (!refreshToken) {
    return res.status(401).json({
      success: false,
      message: "No valid token provided"
    });
  }

  try {
    const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    req.user = {
      id: payload.sub,
      organizationId: payload.org,
      role: payload.role,
      isSuperAdmin: payload.sadm === true,
    };
    req.usedRefreshToken = true; // Flag for logout controller
    return next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired refresh token"
    });
  }
}




// import jwt from "jsonwebtoken"

// export function authenticate(req, res, next) {

//   let token = null

//   /* cookies (web) */

//   if (req.cookies?.accessToken) {
//     token = req.cookies.accessToken
//   }

//   /* mobile Authorization header */

//   if (!token && req.headers.authorization) {

//     const parts = req.headers.authorization.split(" ")

//     if (parts[0] === "Bearer") {
//       token = parts[1]
//     }

//   }

//   if (!token) {
//     return res.status(401).json({
//       message: "Authentication required test"
//     })
//   }

//   try {

//     const payload = jwt.verify(
//       token,
//       process.env.JWT_SECRET
//     )

//     req.user = {
//       id: payload.sub,
//       organizationId: payload.org,
//       role: payload.role
//     }
  
  

//     next()

//   } catch (err) {

//     return res.status(401).json({
//       message: "Invalid or expired token"
//     })
//   }
//   }
