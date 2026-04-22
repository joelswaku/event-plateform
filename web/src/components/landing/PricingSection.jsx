"use client";

import Link from "next/link";
import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Check } from "lucide-react";

const FREE_FEATURES = [
  "15 free templates",
  "Core sections (Hero, Gallery, RSVP)",
  "Public event URL",
  "Basic customisation",
  "Unlimited guests",
];

const PREMIUM_FEATURES = [
  "Everything in Free",
  "All 30 templates (15 premium)",
  "Custom domain support",
  "RSVP management & analytics",
  "Advanced gallery & animations",
  "Priority support",
  "Unlimited page edits",
];

export default function PricingSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="pricing" className="py-24 bg-white">
      <div className="max-w-4xl mx-auto px-6 md:px-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-14"
        >
          <span className="text-amber-600 text-sm font-bold uppercase tracking-widest">
            Pricing
          </span>
          <h2 className="mt-2 text-4xl md:text-5xl font-black text-gray-900 tracking-tight">
            Simple, honest pricing
          </h2>
          <p className="mt-4 text-gray-500 text-lg">
            Start free. Upgrade when you&apos;re ready.
          </p>
        </motion.div>

        <div ref={ref} className="grid md:grid-cols-2 gap-6">
          {/* Free */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.08 }}
            className="border-2 border-gray-100 rounded-3xl p-8"
          >
            <div className="mb-6">
              <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                Free
              </p>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-5xl font-black text-gray-900">$0</span>
                <span className="text-gray-400">/forever</span>
              </div>
            </div>
            <ul className="space-y-3 mb-8">
              {FREE_FEATURES.map((f) => (
                <li key={f} className="flex items-center gap-3 text-sm text-gray-600">
                  <span className="w-4 h-4 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                    <Check className="w-2.5 h-2.5 text-gray-600" strokeWidth={3} />
                  </span>
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href="/register"
              className="block w-full text-center py-3 rounded-2xl border-2 border-gray-200 text-gray-700 font-bold text-sm hover:border-gray-900 hover:text-gray-900 transition-colors"
            >
              Get Started Free
            </Link>
          </motion.div>

          {/* Premium */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.14 }}
            className="relative border-2 border-amber-400 rounded-3xl p-8 bg-linear-to-b from-amber-50/50 to-white overflow-hidden"
          >
            <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-amber-500 text-white text-xs font-bold">
              Most Popular
            </div>

            <div className="mb-6">
              <p className="text-sm font-semibold text-amber-700 uppercase tracking-wide">
                Premium
              </p>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-5xl font-black text-gray-900">$12</span>
                <span className="text-gray-400">/month</span>
              </div>
            </div>
            <ul className="space-y-3 mb-8">
              {PREMIUM_FEATURES.map((f) => (
                <li key={f} className="flex items-center gap-3 text-sm text-gray-700">
                  <span className="w-4 h-4 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                    <Check className="w-2.5 h-2.5 text-amber-600" strokeWidth={3} />
                  </span>
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href="/register"
              className="block w-full text-center py-3 rounded-2xl bg-linear-to-r from-amber-500 to-yellow-400 text-white font-bold text-sm hover:from-amber-600 hover:to-yellow-500 transition-all shadow-lg shadow-amber-200"
            >
              Start Premium →
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
