import { OAuth2Client } from "google-auth-library";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export async function verifyGoogleToken(idToken) {
  const ticket = await client.verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID,
  });
  const payload = ticket.getPayload();
  return {
    googleId: payload.sub,
    email:    payload.email,
    name:     payload.name,
    picture:  payload.picture,
  };
}

export async function verifyGoogleAccessToken(accessToken) {
  const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error("Invalid Google access token");
  const payload = await res.json();
  return {
    googleId: payload.sub,
    email:    payload.email,
    name:     payload.name,
    picture:  payload.picture,
  };
}