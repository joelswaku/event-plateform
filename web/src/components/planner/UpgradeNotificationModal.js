"use client";

import { X, Crown, Zap, TrendingUp } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

export default function UpgradeNotificationModal({ isOpen, onDismiss }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-md rounded-2xl border border-gray-200 dark:border-amber-700/40 bg-white dark:bg-slate-900 p-6 shadow-2xl"
        >
          {/* Close button */}
          <button
            onClick={onDismiss}
            className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 dark:text-gray-500 transition"
          >
            <X size={18} />
          </button>

          {/* Icon */}
          <div className="mb-4 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-linear-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-500/30">
              <Crown className="h-8 w-8 text-white" />
            </div>
          </div>

          {/* Title */}
          <h2 className="text-center text-xl font-black text-gray-900 dark:text-white mb-2">
            Upgrade to Pro for Full Planner Access
          </h2>

          {/* Description */}
          <p className="text-center text-sm text-gray-600 dark:text-slate-400 mb-6">
            You're currently testing our planner features. Upgrade to Pro to unlock unlimited planner projects, team members, and advanced AI features.
          </p>

          {/* Benefits */}
          <div className="space-y-3 mb-6">
            {[
              { icon: Zap, text: "Unlimited planner projects" },
              { icon: TrendingUp, text: "Advanced AI task generation" },
              { icon: Crown, text: "Unlimited team collaboration" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-950/30">
                  <Icon className="h-4 w-4 text-amber-600 dark:text-amber-500" />
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-slate-300">
                  {text}
                </span>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2">
            <Link
              href="/settings/billing?plan=pro"
              className="flex items-center justify-center gap-2 rounded-xl bg-linear-to-br from-amber-400 to-orange-500 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-amber-500/30 transition hover:shadow-xl hover:shadow-amber-500/40"
            >
              <Crown size={16} />
              Upgrade to Pro
            </Link>
            <button
              onClick={onDismiss}
              className="rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 px-4 py-2.5 text-sm font-semibold text-gray-700 dark:text-slate-300 transition hover:bg-gray-100 dark:hover:bg-slate-700"
            >
              Continue with Free Plan
            </button>
          </div>

          {/* Fine print */}
          <p className="mt-4 text-center text-xs text-gray-500 dark:text-slate-500">
            No payment required to continue using free features
          </p>
        </motion.div>
      </div>
      )}
    </AnimatePresence>
  );
}
