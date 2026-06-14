"use client";

import Link from "next/link";
import { useRef, useEffect, useState } from "react";
import { motion, useInView } from "framer-motion";
import { Check, Sparkles, Zap } from "lucide-react";
import { useSubscriptionStore } from "@/store/subscription.store";

const PLANS = {
  free: {
    name: "Free",
    tagline: "Perfect to get started",
    features: [
      "1 active event",
      "Up to 100 guests",
      "Basic templates",
      "RSVP management",
      "Email support",
    ]
  },
  starter: {
    name: "Starter",
    tagline: "For growing events",
    popular: true,
    features: [
      "5 active events",
      "Up to 500 guests per event",
      "All premium templates",
      "Custom branding",
      "Advanced analytics",
      "Priority support",
      "QR code check-in",
    ]
  },
  pro: {
    name: "Pro",
    tagline: "For professional organizers",
    features: [
      "Unlimited events",
      "Unlimited guests",
      "All features included",
      "Custom domain",
      "White-label option",
      "API access",
      "Dedicated support",
      "Early access to features",
    ]
  }
};

export default function PricingSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const { prices, fetchPrices } = useSubscriptionStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPrices = async () => {
      try {
        await fetchPrices();
      } catch (error) {
        console.error('Failed to fetch prices:', error);
      } finally {
        setLoading(false);
      }
    };
    loadPrices();
  }, [fetchPrices]);

  // Format price display
  const getPrice = (tier) => {
    if (tier === 'free') return { amount: 0, interval: 'forever' };
    if (loading) return { amount: '...', interval: 'month' };

    const priceData = prices?.[tier];
    if (!priceData) {
      // Fallback prices if API fails
      return tier === 'starter' ? { amount: 19, interval: 'month' } : { amount: 49, interval: 'month' };
    }

    return {
      amount: priceData.amount || 0,
      interval: priceData.interval || 'month'
    };
  };

  return (
    <section id="pricing" className="py-20 lg:py-32 bg-gradient-to-br from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-100 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800 mb-6">
            <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">
              Simple, Transparent Pricing
            </span>
          </div>

          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-gray-900 dark:text-white mb-6">
            Choose Your Plan
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Start free and upgrade as you grow. All plans include our core features.
          </p>
        </motion.div>

        {/* Pricing cards */}
        <div ref={ref} className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-7xl mx-auto">

          {Object.entries(PLANS).map(([tier, plan], index) => {
            const price = getPrice(tier);
            const delay = index * 0.1;

            return (
              <motion.div
                key={tier}
                initial={{ opacity: 0, y: 30 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay }}
                className={`relative rounded-2xl lg:rounded-3xl p-6 lg:p-8 ${
                  plan.popular
                    ? 'bg-gradient-to-br from-indigo-600 to-violet-600 border-2 border-indigo-500 shadow-2xl shadow-indigo-500/20 transform lg:scale-105'
                    : 'bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700'
                }`}
              >
                {/* Popular badge */}
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 shadow-lg">
                    <div className="flex items-center gap-1">
                      <Zap className="w-3 h-3 text-white fill-white" />
                      <span className="text-xs font-black text-white uppercase tracking-wide">Most Popular</span>
                    </div>
                  </div>
                )}

                {/* Header */}
                <div className="mb-6">
                  <h3 className={`text-sm font-bold uppercase tracking-widest mb-2 ${
                    plan.popular ? 'text-indigo-100' : 'text-gray-500 dark:text-gray-400'
                  }`}>
                    {plan.name}
                  </h3>
                  <p className={`text-sm mb-4 ${
                    plan.popular ? 'text-indigo-200' : 'text-gray-600 dark:text-gray-400'
                  }`}>
                    {plan.tagline}
                  </p>

                  {/* Price */}
                  <div className="flex items-baseline gap-2">
                    <span className={`text-5xl font-black ${
                      plan.popular ? 'text-white' : 'text-gray-900 dark:text-white'
                    }`}>
                      ${price.amount}
                    </span>
                    <span className={`text-sm ${
                      plan.popular ? 'text-indigo-200' : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      /{price.interval}
                    </span>
                  </div>
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        plan.popular
                          ? 'bg-white/20'
                          : 'bg-indigo-100 dark:bg-indigo-900/30'
                      }`}>
                        <Check className={`w-3 h-3 ${
                          plan.popular ? 'text-white' : 'text-indigo-600 dark:text-indigo-400'
                        }`} strokeWidth={3} />
                      </div>
                      <span className={`text-sm ${
                        plan.popular
                          ? 'text-white font-medium'
                          : 'text-gray-700 dark:text-gray-300'
                      }`}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <Link
                  href="/register"
                  className={`block w-full text-center py-3.5 rounded-xl font-bold text-sm transition-all duration-300 ${
                    plan.popular
                      ? 'bg-white text-indigo-600 hover:bg-gray-50 shadow-lg hover:shadow-xl hover:-translate-y-0.5'
                      : 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:from-indigo-700 hover:to-violet-700 shadow-lg shadow-indigo-500/20 hover:shadow-xl hover:-translate-y-0.5'
                  }`}
                >
                  {tier === 'free' ? 'Get Started Free' : `Start ${plan.name}`}
                </Link>
              </motion.div>
            );
          })}
        </div>

        {/* Bottom note */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center mt-12 text-sm text-gray-500 dark:text-gray-400"
        >
          All plans include a 14-day free trial. No credit card required.{' '}
          <Link href="/pricing" className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">
            View detailed comparison →
          </Link>
        </motion.p>
      </div>
    </section>
  );
}
