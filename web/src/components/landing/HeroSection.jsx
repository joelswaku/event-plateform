"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1], delay },
  }),
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: (delay = 0) => ({
    opacity: 1,
    scale: 1,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1], delay },
  }),
};

export default function HeroSection({ showcase, testimonials }) {
  return (
    <section className="relative min-h-screen flex items-center pt-16 overflow-hidden bg-white">
      {/* Ambient blobs */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <div className="absolute top-1/4 -right-40 w-[600px] h-[600px] rounded-full bg-amber-50 blur-3xl opacity-70" />
        <div className="absolute bottom-0 -left-40 w-[500px] h-[500px] rounded-full bg-rose-50 blur-3xl opacity-50" />
      </div>

      <div className="relative max-w-7xl mx-auto px-6 md:px-12 py-20 grid md:grid-cols-2 gap-12 items-center">
        {/* ── Left column ── */}
        <div>
          <motion.div
            variants={fadeUp}
            custom={0}
            initial="hidden"
            animate="visible"
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-100 text-amber-700 text-xs font-semibold mb-6"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            30 Premium Templates — Launch Today
          </motion.div>

          <motion.h1
            variants={fadeUp}
            custom={0.08}
            initial="hidden"
            animate="visible"
            className="text-5xl md:text-6xl font-black text-gray-900 leading-[1.05] tracking-tight"
          >
            Your wedding,
            <br />
            <span className="bg-linear-to-r from-amber-500 to-yellow-400 bg-clip-text text-transparent">
              beautifully online.
            </span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            custom={0.16}
            initial="hidden"
            animate="visible"
            className="mt-6 text-lg text-gray-500 leading-relaxed max-w-lg"
          >
            Create a stunning wedding website in minutes. Choose from 30
            handcrafted templates, collect RSVPs, and share one link with all
            your guests.
          </motion.p>

          <motion.div
            variants={fadeUp}
            custom={0.24}
            initial="hidden"
            animate="visible"
            className="mt-8 flex flex-col sm:flex-row gap-3"
          >
            <Link
              href="/register"
              className="flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 text-white font-bold px-7 py-3.5 rounded-2xl transition-all shadow-lg shadow-gray-900/10 text-sm"
            >
              Create Your Wedding Site →
            </Link>
            <a
              href="#templates"
              className="flex items-center justify-center gap-2 bg-amber-50 hover:bg-amber-100 text-amber-800 font-semibold px-7 py-3.5 rounded-2xl transition-colors text-sm border border-amber-100"
            >
              Browse Templates
            </a>
          </motion.div>

          {/* Social proof */}
          <motion.div
            variants={fadeUp}
            custom={0.32}
            initial="hidden"
            animate="visible"
            className="mt-10 flex items-center gap-4"
          >
            <div className="flex -space-x-2">
              {testimonials.map((t, i) => (
                <div
                  key={i}
                  className="w-9 h-9 rounded-full border-2 border-white overflow-hidden bg-gray-200 shadow-sm"
                >
                  <Image
                    src={t.avatar}
                    alt={t.name}
                    width={36}
                    height={36}
                    className="object-cover"
                    priority={i === 0}
                  />
                </div>
              ))}
            </div>
            <div>
              <div className="flex text-amber-400 text-sm" aria-label="5 stars">
                {"★★★★★"}
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                Loved by 12,000+ couples
              </p>
            </div>
          </motion.div>
        </div>

        {/* ── Right column — mosaic ── */}
        <div className="relative hidden md:grid grid-cols-2 gap-3 h-[540px]">
          {showcase.slice(0, 4).map((t, i) => (
            <motion.div
              key={t.id}
              variants={scaleIn}
              custom={0.1 + i * 0.1}
              initial="hidden"
              animate="visible"
              className={`relative rounded-2xl overflow-hidden shadow-xl group ${
                i === 0 ? "row-span-2" : ""
              }`}
            >
              <Image
                src={t.assets.cover_image}
                alt={t.name}
                fill
                sizes="(max-width: 768px) 100vw, 300px"
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                priority={i === 0}
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-3 left-3">
                <p className="text-white text-xs font-bold">{t.name}</p>
                <p
                  className={`text-[10px] mt-0.5 font-semibold ${
                    t.tier === "premium"
                      ? "text-amber-400"
                      : "text-white/70"
                  }`}
                >
                  {t.tier === "premium" ? "⭐ Premium" : "Free"}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
