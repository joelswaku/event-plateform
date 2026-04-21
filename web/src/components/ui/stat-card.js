"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

const COLOR = {
  indigo: {
    icon: "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400",
    hover: "group-hover:bg-indigo-100 dark:group-hover:bg-indigo-950/80",
    accent: "bg-indigo-500",
    trend: "text-indigo-600 dark:text-indigo-400",
  },
  emerald: {
    icon: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400",
    hover: "group-hover:bg-emerald-100 dark:group-hover:bg-emerald-950/80",
    accent: "bg-emerald-500",
    trend: "text-emerald-600 dark:text-emerald-400",
  },
  violet: {
    icon: "bg-violet-50 text-violet-600 dark:bg-violet-950/50 dark:text-violet-400",
    hover: "group-hover:bg-violet-100 dark:group-hover:bg-violet-950/80",
    accent: "bg-violet-500",
    trend: "text-violet-600 dark:text-violet-400",
  },
  amber: {
    icon: "bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400",
    hover: "group-hover:bg-amber-100 dark:group-hover:bg-amber-950/80",
    accent: "bg-amber-500",
    trend: "text-amber-600 dark:text-amber-400",
  },
};

export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  href,
  trend,
  color = "indigo",
}) {
  const router = useRouter();
  const c = COLOR[color] ?? COLOR.indigo;

  return (
    <motion.div
      onClick={() => href && router.push(href)}
      whileHover={href ? { y: -2 } : {}}
      whileTap={href ? { scale: 0.98 } : {}}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`group relative overflow-hidden rounded-2xl border border-gray-200 bg-white transition dark:border-gray-800 dark:bg-gray-900 ${
        href
          ? "cursor-pointer hover:border-gray-300 hover:shadow-md dark:hover:border-gray-700"
          : ""
      }`}
    >
      {/* Top accent bar */}
      <div className={`absolute inset-x-0 top-0 h-0.5 ${c.accent} opacity-70`} />

      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
              {title}
            </p>
            <p className="mt-2 text-3xl font-bold tabular-nums tracking-tight text-gray-900 dark:text-gray-50">
              {value ?? 0}
            </p>
            {subtitle && (
              <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">{subtitle}</p>
            )}
            {trend !== undefined && (
              <p className={`mt-1.5 text-xs font-semibold ${
                trend >= 0
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-red-500 dark:text-red-400"
              }`}>
                {trend >= 0 ? "▲" : "▼"} {Math.abs(trend)}% this week
              </p>
            )}
          </div>

          {Icon && (
            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition ${c.icon} ${c.hover}`}>
              <Icon className="h-5 w-5" />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
