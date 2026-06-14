"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Play, Sparkles, CheckCircle, Star, Zap, Calendar, Users, Ticket, Apple, Play as PlayIcon } from "lucide-react";
import { useState } from "react";

export default function HeroSection() {
  const [videoOpen, setVideoOpen] = useState(false);

  const fadeInUp = {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  };

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const float = {
    animate: {
      y: [0, -20, 0],
      transition: {
        duration: 6,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  return (
    <section className="relative min-h-[90vh] lg:min-h-screen flex items-center overflow-hidden bg-gradient-to-br from-gray-50 via-white to-indigo-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-indigo-950/30 pt-20">

      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Gradient blobs */}
        <motion.div
          className="absolute top-20 -left-20 w-72 h-72 bg-indigo-400/20 dark:bg-indigo-600/20 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            x: [0, 50, 0],
            y: [0, 30, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute top-40 right-20 w-96 h-96 bg-violet-400/20 dark:bg-violet-600/20 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.3, 1],
            x: [0, -30, 0],
            y: [0, 50, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute bottom-20 left-1/3 w-80 h-80 bg-pink-400/20 dark:bg-pink-600/20 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.1, 1],
            x: [0, 40, 0],
            y: [0, -40, 0],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />

        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.02] dark:opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(99,102,241,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.5) 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }}
        />
      </div>

      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

          {/* Left column - Text content */}
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="text-center lg:text-left"
          >
            {/* Badge */}
            <motion.div variants={fadeInUp} className="inline-flex mb-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-100 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800">
                <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">
                  #1 Event Management Platform
                </span>
              </div>
            </motion.div>

            {/* Headline */}
            <motion.h1
              variants={fadeInUp}
              className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black text-gray-900 dark:text-white leading-[1.1] mb-6"
            >
              Create{" "}
              <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-pink-600 bg-clip-text text-transparent">
                Unforgettable
              </span>
              <br />
              Events Effortlessly
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              variants={fadeInUp}
              className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto lg:mx-0"
            >
              Design stunning event pages, sell tickets, manage guests, and track everything — all from one beautiful platform.
            </motion.p>

            {/* Feature bullets */}
            <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-4 mb-8 justify-center lg:justify-start flex-wrap">
              {[
                "No credit card required",
                "Setup in 5 minutes",
                "500+ events created daily"
              ].map((feature, i) => (
                <div key={i} className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{feature}</span>
                </div>
              ))}
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              variants={fadeInUp}
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
            >
              <Link
                href="/register"
                className="group relative inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-base font-bold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 transition-all duration-300 hover:-translate-y-0.5"
              >
                Get Started Free
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>

              <button
                onClick={() => setVideoOpen(true)}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-base font-semibold text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600 shadow-sm hover:shadow transition-all duration-300"
              >
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-600">
                  <Play className="w-3 h-3 text-white fill-white ml-0.5" />
                </div>
                Watch Demo
              </button>
            </motion.div>

            {/* Mobile App Download Buttons */}
            <motion.div variants={fadeInUp} className="mt-8">
              <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3 text-center lg:text-left">
                Also available on mobile
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                <a
                  href="https://apps.apple.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-2.5 px-5 py-2.5 rounded-xl bg-gray-900 dark:bg-gray-800 hover:bg-gray-800 dark:hover:bg-gray-700 border border-gray-800 dark:border-gray-700 transition-all duration-300 shadow-sm hover:shadow"
                >
                  <Apple className="w-6 h-6 text-white" />
                  <div className="text-left">
                    <p className="text-[10px] text-gray-400 leading-none">Download on the</p>
                    <p className="text-sm font-bold text-white leading-tight">App Store</p>
                  </div>
                </a>

                <a
                  href="https://play.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-2.5 px-5 py-2.5 rounded-xl bg-gray-900 dark:bg-gray-800 hover:bg-gray-800 dark:hover:bg-gray-700 border border-gray-800 dark:border-gray-700 transition-all duration-300 shadow-sm hover:shadow"
                >
                  <PlayIcon className="w-6 h-6 text-white fill-white" />
                  <div className="text-left">
                    <p className="text-[10px] text-gray-400 leading-none">Get it on</p>
                    <p className="text-sm font-bold text-white leading-tight">Google Play</p>
                  </div>
                </a>
              </div>
            </motion.div>

            {/* Social proof */}
            <motion.div variants={fadeInUp} className="mt-8 flex items-center gap-6 justify-center lg:justify-start flex-wrap">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="w-10 h-10 rounded-full border-2 border-white dark:border-gray-900 bg-gradient-to-br from-indigo-400 to-violet-400 flex items-center justify-center text-white text-xs font-bold"
                  >
                    {String.fromCharCode(64 + i)}
                  </div>
                ))}
              </div>
              <div>
                <div className="flex items-center gap-1 mb-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-bold text-gray-900 dark:text-white">12,000+</span> organizers trust us
                </p>
              </div>
            </motion.div>
          </motion.div>

          {/* Right column - Visual showcase */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <div className="relative max-w-lg mx-auto">
              {/* Floating notification cards */}
              <motion.div
                variants={float}
                animate="animate"
                className="absolute -top-6 -right-4 sm:-right-8 w-56 sm:w-64 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-4 border border-gray-200 dark:border-gray-700 z-10"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate">New RSVP</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Sarah confirmed +2</p>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                    <span>Total confirmed</span>
                    <span className="font-semibold">142/200</span>
                  </div>
                  <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full w-[71%] bg-gradient-to-r from-green-400 to-emerald-500 rounded-full" />
                  </div>
                </div>
              </motion.div>

              {/* Main dashboard mockup - REALISTIC DASHBOARD */}
              <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700">
                {/* Header with Tabs */}
                <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">Summer Music Festival</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">June 15, 2026 • Live Event</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      <span className="text-xs font-medium text-green-600 dark:text-green-400">Live</span>
                    </div>
                  </div>
                  {/* Tabs */}
                  <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700 -mb-4">
                    <div className="px-3 py-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400">
                      Overview
                    </div>
                    <div className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400">
                      Guests
                    </div>
                    <div className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400">
                      Tickets
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                  {/* Stats Grid - More detailed */}
                  <div className="grid grid-cols-2 gap-3">
                    {/* Total Guests */}
                    <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-950/40 dark:to-indigo-900/40 rounded-xl p-4 border border-indigo-200 dark:border-indigo-800">
                      <div className="flex items-center justify-between mb-2">
                        <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center">
                          <Users className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-xs font-semibold text-green-600 dark:text-green-400">↑ 12%</span>
                      </div>
                      <p className="text-2xl font-black text-gray-900 dark:text-white">1,247</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Total Guests</p>
                      <div className="mt-2 h-1.5 bg-indigo-200 dark:bg-indigo-900 rounded-full overflow-hidden">
                        <div className="h-full w-[78%] bg-indigo-600 rounded-full" />
                      </div>
                    </div>

                    {/* Revenue */}
                    <div className="bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950/40 dark:to-emerald-900/40 rounded-xl p-4 border border-green-200 dark:border-green-800">
                      <div className="flex items-center justify-between mb-2">
                        <div className="w-10 h-10 rounded-lg bg-green-600 flex items-center justify-center">
                          <span className="text-white text-sm font-bold">$</span>
                        </div>
                        <span className="text-xs font-semibold text-green-600 dark:text-green-400">↑ 24%</span>
                      </div>
                      <p className="text-2xl font-black text-gray-900 dark:text-white">$18.4K</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Total Revenue</p>
                      <div className="mt-2 flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                        <Ticket className="w-3 h-3" />
                        <span>892 tickets sold</span>
                      </div>
                    </div>
                  </div>

                  {/* Ticket Sales Chart */}
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xs font-bold text-gray-900 dark:text-white">Ticket Sales (7 days)</h4>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-violet-600 rounded-full" />
                          <span className="text-[10px] text-gray-500 dark:text-gray-400">VIP</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-indigo-600 rounded-full" />
                          <span className="text-[10px] text-gray-500 dark:text-gray-400">General</span>
                        </div>
                      </div>
                    </div>
                    <div className="h-28 flex items-end justify-between gap-1.5">
                      {[
                        { gen: 45, vip: 20 },
                        { gen: 60, vip: 25 },
                        { gen: 50, vip: 22 },
                        { gen: 75, vip: 35 },
                        { gen: 65, vip: 30 },
                        { gen: 85, vip: 40 },
                        { gen: 70, vip: 35 }
                      ].map((day, i) => (
                        <div key={i} className="flex-1 flex flex-col justify-end gap-0.5">
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: `${day.vip}%` }}
                            transition={{ duration: 0.8, delay: 0.5 + i * 0.1 }}
                            className="bg-gradient-to-t from-violet-600 to-violet-400 rounded-t-sm"
                          />
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: `${day.gen}%` }}
                            transition={{ duration: 0.8, delay: 0.6 + i * 0.1 }}
                            className="bg-gradient-to-t from-indigo-600 to-indigo-400 rounded-t-sm"
                          />
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between mt-2 text-[9px] text-gray-400 dark:text-gray-500">
                      <span>Mon</span>
                      <span>Tue</span>
                      <span>Wed</span>
                      <span>Thu</span>
                      <span>Fri</span>
                      <span>Sat</span>
                      <span>Sun</span>
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-gray-900 dark:text-white">Recent Activity</h4>

                    {/* Activity Item 1 */}
                    <div className="flex items-center gap-3 p-2.5 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">Emma Wilson checked in</p>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400">VIP Ticket • 2 min ago</p>
                      </div>
                      <div className="w-6 h-6 rounded bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                        <Ticket className="w-3 h-3 text-green-600 dark:text-green-400" />
                      </div>
                    </div>

                    {/* Activity Item 2 */}
                    <div className="flex items-center gap-3 p-2.5 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center flex-shrink-0">
                        <Users className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">New ticket purchase</p>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400">General Admission × 2 • 5 min ago</p>
                      </div>
                      <div className="text-xs font-bold text-green-600 dark:text-green-400">+$48</div>
                    </div>

                    {/* Activity Item 3 */}
                    <div className="flex items-center gap-3 p-2.5 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center flex-shrink-0">
                        <Star className="w-4 h-4 text-white fill-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">New 5-star review</p>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400">Michael Chen • 12 min ago</p>
                      </div>
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <Star key={i} className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating stat card */}
              <motion.div
                animate={{
                  y: [0, 15, 0],
                }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="absolute -bottom-6 -left-4 sm:-left-8 w-48 sm:w-56 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-4 border border-gray-200 dark:border-gray-700 z-10"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Setup Time</p>
                    <p className="text-2xl font-black text-gray-900 dark:text-white">5 min</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Video Modal */}
      {videoOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4"
          onClick={() => setVideoOpen(false)}
        >
          <div className="relative w-full max-w-4xl aspect-video bg-gray-900 rounded-2xl overflow-hidden shadow-2xl">
            <button
              onClick={() => setVideoOpen(false)}
              className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-10"
            >
              ✕
            </button>
            <iframe
              className="w-full h-full"
              src="https://www.youtube.com/embed/dQw4w9WgXcQ"
              title="Product Demo"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )}
    </section>
  );
}
