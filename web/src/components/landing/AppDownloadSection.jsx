"use client";

import { motion } from "framer-motion";
import { Apple, Play, Smartphone, Star, Download, CheckCircle, Zap, Shield } from "lucide-react";
import Image from "next/image";

export default function AppDownloadSection() {
  const fadeInUp = {
    initial: { opacity: 0, y: 40 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.6 }
  };

  const staggerContainer = {
    initial: {},
    whileInView: {
      transition: {
        staggerChildren: 0.1
      }
    },
    viewport: { once: true }
  };

  return (
    <section className="relative py-20 lg:py-32 overflow-hidden bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-violet-400/10 rounded-full blur-3xl" />

        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }}
        />
      </div>

      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

          {/* Left column - Content */}
          <motion.div
            variants={staggerContainer}
            initial="initial"
            whileInView="whileInView"
            viewport={{ once: true }}
          >
            {/* Badge */}
            <motion.div variants={fadeInUp} className="inline-flex mb-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm">
                <Smartphone className="w-4 h-4 text-white" />
                <span className="text-sm font-semibold text-white">
                  Available on iOS & Android
                </span>
              </div>
            </motion.div>

            {/* Heading */}
            <motion.h2
              variants={fadeInUp}
              className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-tight mb-6"
            >
              Manage Events
              <br />
              On the Go
            </motion.h2>

            {/* Description */}
            <motion.p
              variants={fadeInUp}
              className="text-lg text-indigo-100 mb-8 max-w-xl"
            >
              Download our mobile app and manage your events from anywhere. Check-in guests with QR scanner, track sales in real-time, and stay connected.
            </motion.p>

            {/* Features list */}
            <motion.div variants={fadeInUp} className="space-y-4 mb-10">
              {[
                { icon: Zap, text: "Lightning-fast QR code check-in" },
                { icon: Shield, text: "Offline mode for reliable access" },
                { icon: CheckCircle, text: "Real-time sync across all devices" }
              ].map((feature, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                    <feature.icon className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-white font-medium">{feature.text}</span>
                </div>
              ))}
            </motion.div>

            {/* App store buttons */}
            <motion.div
              variants={fadeInUp}
              className="flex flex-col sm:flex-row gap-4"
            >
              <a
                href="https://apps.apple.com"
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center justify-center gap-3 px-6 py-4 rounded-xl bg-white hover:bg-gray-50 transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
              >
                <Apple className="w-8 h-8 text-gray-900" />
                <div className="text-left">
                  <p className="text-xs text-gray-600">Download on the</p>
                  <p className="text-lg font-bold text-gray-900">App Store</p>
                </div>
              </a>

              <a
                href="https://play.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center justify-center gap-3 px-6 py-4 rounded-xl bg-white hover:bg-gray-50 transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
              >
                <Play className="w-8 h-8 text-gray-900 fill-gray-900" />
                <div className="text-left">
                  <p className="text-xs text-gray-600">Get it on</p>
                  <p className="text-lg font-bold text-gray-900">Google Play</p>
                </div>
              </a>
            </motion.div>

            {/* Stats */}
            <motion.div
              variants={fadeInUp}
              className="mt-10 flex items-center gap-8 flex-wrap"
            >
              <div>
                <div className="flex items-center gap-1 mb-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-white/80 text-sm">
                  <span className="font-bold text-white">4.9</span> · 12K+ ratings
                </p>
              </div>

              <div className="h-8 w-px bg-white/20" />

              <div>
                <p className="text-3xl font-black text-white mb-1">50K+</p>
                <p className="text-white/80 text-sm">Active users</p>
              </div>

              <div className="h-8 w-px bg-white/20" />

              <div>
                <p className="text-3xl font-black text-white mb-1">99.9%</p>
                <p className="text-white/80 text-sm">Uptime</p>
              </div>
            </motion.div>
          </motion.div>

          {/* Right column - Phone mockups */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, rotateY: 15 }}
            whileInView={{ opacity: 1, scale: 1, rotateY: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            <div className="relative max-w-lg mx-auto">
              {/* Main phone mockup */}
              <div className="relative z-10">
                <div className="relative bg-gray-900 rounded-[3rem] p-3 shadow-2xl border-8 border-gray-800">
                  {/* Notch */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-gray-900 rounded-b-3xl z-20" />

                  {/* Screen */}
                  <div className="relative bg-white rounded-[2.5rem] overflow-hidden aspect-[9/19]">
                    {/* Status bar */}
                    <div className="absolute top-0 left-0 right-0 px-8 pt-3 flex justify-between items-center text-xs font-semibold text-gray-900 z-10">
                      <span>9:41</span>
                      <div className="flex gap-1">
                        <div className="w-4 h-4" />
                        <div className="w-4 h-4" />
                        <div className="w-4 h-4" />
                      </div>
                    </div>

                    {/* App content */}
                    <div className="pt-12 pb-6 px-6 h-full flex flex-col">
                      {/* Header */}
                      <div className="mb-6">
                        <h3 className="text-2xl font-black text-gray-900 mb-1">Dashboard</h3>
                        <p className="text-sm text-gray-500">Manage your events</p>
                      </div>

                      {/* Stats cards */}
                      <div className="grid grid-cols-2 gap-3 mb-6">
                        {[
                          { label: "Guests", value: "142", color: "indigo" },
                          { label: "Revenue", value: "$2.4K", color: "green" }
                        ].map((stat, i) => (
                          <div key={i} className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-4">
                            <p className="text-xs text-gray-500 mb-1">{stat.label}</p>
                            <p className="text-2xl font-black text-gray-900">{stat.value}</p>
                          </div>
                        ))}
                      </div>

                      {/* Event list */}
                      <div className="flex-1 space-y-3">
                        {[1, 2].map((i) => (
                          <div key={i} className="bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl p-4 text-white">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm" />
                              <div className="flex-1">
                                <div className="h-2.5 bg-white/40 rounded w-24 mb-1.5" />
                                <div className="h-2 bg-white/30 rounded w-16" />
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <div className="flex-1 h-8 bg-white/20 rounded-lg" />
                              <div className="flex-1 h-8 bg-white/20 rounded-lg" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating elements */}
              <motion.div
                animate={{ y: [0, -15, 0], rotate: [0, 5, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -right-4 top-20 w-32 h-32 bg-white rounded-2xl shadow-2xl p-4 flex flex-col items-center justify-center"
              >
                <Download className="w-8 h-8 text-indigo-600 mb-2" />
                <p className="text-xs font-bold text-gray-900 text-center">Quick Setup</p>
                <p className="text-2xl font-black text-indigo-600">2 min</p>
              </motion.div>

              <motion.div
                animate={{ y: [0, 15, 0], rotate: [0, -5, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -left-4 bottom-32 w-28 h-28 bg-white rounded-2xl shadow-2xl p-3 flex flex-col items-center justify-center"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mb-2">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <p className="text-xs font-bold text-gray-900">Offline Mode</p>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
