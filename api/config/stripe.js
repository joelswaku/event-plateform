//config/stripe.js
import Stripe from "stripe";
import { env } from "./env.js";

// Allow the server to start without a Stripe key; calls will fail gracefully.
export const stripe = env.stripeSecretKey
  ? new Stripe(env.stripeSecretKey, { apiVersion: "2024-06-20" })
  : null;

  console.log("Stripe key at runtime:", env.stripeSecretKey);