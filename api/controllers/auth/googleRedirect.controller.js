import crypto from "crypto";

function isSafeInternalPath(value) {
  return (
    typeof value === "string" &&
    value.startsWith("/") &&
    !value.startsWith("//") &&
    !value.includes("\\")
  );
}

function oauthCookieOptions() {
  const isProduction = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    maxAge: 5 * 60 * 1000,
    path: "/",
    ...(isProduction ? { domain: ".liteevent.com" } : {}),
  };
}

/**
 * Initiates Google OAuth redirect flow
 * This endpoint redirects the user to Google's OAuth consent screen
 */
export function googleRedirect(req, res) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  // For development, use localhost instead of IP address
  const frontendUrl = process.env.NODE_ENV === "production"
    ? process.env.FRONTEND_URL
    : "http://localhost:3000";
  const redirectUri = `${frontendUrl}/api/auth/google/callback`;
  const redirectTo = isSafeInternalPath(req.query.redirect_to)
    ? req.query.redirect_to
    : "/dashboard";

  if (!clientId) {
    return res.status(500).json({
      success: false,
      message: "Google OAuth not configured",
    });
  }

  // State binds this callback to the browser that initiated sign-in. The
  // shared production domain lets the callback return through liteevent.com
  // while the login request begins at api.liteevent.com.
  const state = crypto.randomBytes(32).toString("hex");
  const cookieOptions = oauthCookieOptions();
  res.cookie("google_redirect_to", redirectTo, cookieOptions);
  res.cookie("google_oauth_state", state, cookieOptions);

  // Build Google OAuth URL
  const googleAuthUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  googleAuthUrl.searchParams.append("client_id", clientId);
  googleAuthUrl.searchParams.append("redirect_uri", redirectUri);
  googleAuthUrl.searchParams.append("response_type", "code");
  googleAuthUrl.searchParams.append("scope", "openid email profile");
  googleAuthUrl.searchParams.append("access_type", "online");
  googleAuthUrl.searchParams.append("prompt", "select_account");
  googleAuthUrl.searchParams.append("state", state);

  // Redirect to Google
  res.redirect(googleAuthUrl.toString());
}
