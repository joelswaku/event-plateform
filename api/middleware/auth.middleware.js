import jwt from "jsonwebtoken"

export function authenticate(req, res, next) {

  console.log("AUTH CHECK:", req.method, req.originalUrl)

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
      id: payload.sub,
      organizationId: payload.org,
      role: payload.role
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
