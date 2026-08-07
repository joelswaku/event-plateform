import axios from "axios";
import crypto from "crypto";
import * as authService from "../../services/auth.service.js";

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
    path: "/",
    ...(isProduction ? { domain: ".liteevent.com" } : {}),
  };
}

function clearOAuthCookies(res) {
  const cookieOptions = oauthCookieOptions();
  res.clearCookie("google_redirect_to", cookieOptions);
  res.clearCookie("google_oauth_state", cookieOptions);
}

function stateMatches(expectedState, receivedState) {
  if (
    typeof expectedState !== "string" ||
    typeof receivedState !== "string"
  ) {
    return false;
  }

  const expected = Buffer.from(expectedState);
  const received = Buffer.from(receivedState);
  return (
    expected.length === received.length &&
    crypto.timingSafeEqual(expected, received)
  );
}

/**
 * Handles Google OAuth callback
 * Google redirects here with an authorization code
 */
export async function googleCallback(req, res) {
  const { code, error, state } = req.query;

  // For development, use localhost instead of IP address
  const frontendUrl = process.env.NODE_ENV === "production"
    ? process.env.FRONTEND_URL
    : "http://localhost:3000";

  // Handle user cancellation
  if (error) {
    clearOAuthCookies(res);
    return res.redirect(`${frontendUrl}/login?error=google_cancelled`);
  }

  if (!code || !stateMatches(req.cookies?.google_oauth_state, state)) {
    clearOAuthCookies(res);
    return res.redirect(`${frontendUrl}/login?error=google_failed`);
  }

  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = `${frontendUrl}/api/auth/google/callback`;

    // Exchange authorization code for tokens
    const tokenResponse = await axios.post("https://oauth2.googleapis.com/token", {
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    });

    const { id_token } = tokenResponse.data;

    if (!id_token) {
      throw new Error("No ID token received from Google");
    }

    // Log the user in using the ID token
    const result = await authService.googleLogin({
      idToken: id_token,
      accessToken: null,
      ip: req.ip,
      userAgent: req.headers["user-agent"],
      deviceName: null,
      isMobile: false, // Web browser
      res,
    });

    // Get redirect destination from cookie
    const redirectTo = isSafeInternalPath(req.cookies?.google_redirect_to)
      ? req.cookies.google_redirect_to
      : "/dashboard";

    // Clear short-lived OAuth state and destination cookies using the same
    // shared domain that was used when sign-in began.
    clearOAuthCookies(res);

    // Redirect to auth-success page which will fetch user and redirect to final destination
    res.redirect(`${frontendUrl}/auth-success?redirect_to=${encodeURIComponent(redirectTo)}`);

  } catch (error) {
    console.error("Google callback error:", error);
    clearOAuthCookies(res);
    res.redirect(`${frontendUrl}/login?error=google_failed`);
  }
}
