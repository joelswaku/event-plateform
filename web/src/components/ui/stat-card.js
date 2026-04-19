"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  href,
}) {
  const router = useRouter();

  return (
    <motion.div
      onClick={() => href && router.push(href)}
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.97 }}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`rounded-3xl border border-[#e5e7eb] bg-white p-5 transition
        ${href ? "cursor-pointer hover:shadow-md hover:-translate-y-1" : ""}
      `}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <h3 className="mt-1 text-2xl font-semibold">{value}</h3>
          {subtitle && (
            <p className="mt-1 text-xs text-gray-400">{subtitle}</p>
          )}
        </div>

        {Icon && (
          <div className="rounded-2xl bg-gray-100 p-2">
            <Icon className="h-5 w-5 text-gray-600" />
          </div>
        )}
      </div>
    </motion.div>
  );
}