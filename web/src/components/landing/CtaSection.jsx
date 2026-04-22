"use client";

import Link from "next/link";
import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";

const PROOF_METRICS = [
  { value: "12,000+", label: "couples launched" },
  { value: "4.9★",   label: "average rating"   },
  { value: "< 10min", label: "to go live"       },
];

export default function CtaSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="py-24 bg-gray-900 relative overflow-hidden">
      {/* Radial glow */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[500px] bg-amber-500/10 rounded-full blur-3xl" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-400/5 rounded-full blur-2xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-rose-400/5 rounded-full blur-2xl" />
      </div>

      <div ref={ref} className="relative max-w-3xl mx-auto px-6 text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={inView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold mb-8"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Free to start — no credit card required
        </motion.div>

        {/* Headline */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.06 }}
          className="text-5xl md:text-6xl font-black text-white tracking-tight leading-tight"
        >
          Your love story
          <br />
          <span className="bg-linear-to-r from-amber-400 to-yellow-300 bg-clip-text text-transparent">
            deserves a beautiful home.
          </span>
        </motion.h2>

        {/* Sub */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.12 }}
          className="mt-6 text-gray-400 text-lg max-w-xl mx-auto leading-relaxed"
        >
          Join thousands of couples who share their wedding story with WedSite.
          Free to start, live in minutes.
        </motion.p>

        {/* Social proof metrics */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.18 }}
          className="mt-10 flex items-center justify-center gap-8 flex-wrap"
        >
          {PROOF_METRICS.map((m) => (
            <div key={m.label} className="text-center">
              <p className="text-2xl font-black text-white">{m.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{m.label}</p>
            </div>
          ))}
        </motion.div>

        {/* CTA buttons */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.24 }}
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link
            href="/register"
            className="group flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-white font-bold px-8 py-4 rounded-2xl transition-all shadow-2xl shadow-amber-500/30 text-base"
          >
            Create Your Wedding Site
            <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
          <Link
            href="/login"
            className="text-gray-400 hover:text-white text-sm font-medium transition-colors"
          >
            Already have an account? Sign in
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
