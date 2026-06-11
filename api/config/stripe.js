//config/stripe.js
import Stripe from "stripe";
import { env } from "./env.js";

// Allow the server to start without a Stripe key; calls will fail gracefully.
export const stripe = env.stripeSecretKey
  ? new Stripe(env.stripeSecretKey, {
      apiVersion:       "2024-06-20",
      timeout:          10_000,   // 10 s — prevents hanging requests
      maxNetworkRetries: 2,       // auto-retry on network errors
    })
  : null;

