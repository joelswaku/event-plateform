
import { createHash, randomBytes } from "crypto";

export function hashToken(token) {
  return createHash("sha256")
    .update(token)
    .digest("hex");
}

export function generateToken(size = 32) {
  return randomBytes(size).toString("hex");
}