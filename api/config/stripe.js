//config/stripe.js
import Stripe from "stripe";
import { env } from "./env.js";

if (!env.stripeSecretKey) {
  throw new Error("STRIPE_SECRET_KEY is missing in environment variables");
}

export const stripe = new Stripe(env.stripeSecretKey, {
  apiVersion: "2024-06-20",
});
