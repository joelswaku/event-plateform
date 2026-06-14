"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export default function StatsBar() {
  const [stats, setStats] = useState({
    totalEvents: "12,000+",
    totalGuests: "500K+",
    totalTickets: "500K+",
    rating: "4.9★",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/platform-stats`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.stats) {
            // Format numbers for display
            const formatNumber = (num) => {
              if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M+`;
              if (num >= 1000) return `${(num / 1000).toFixed(1)}K+`;
              return `${num}+`;
            };

            setStats({
              totalEvents: formatNumber(data.stats.totalEvents),
              totalGuests: formatNumber(data.stats.totalGuests),
              totalTickets: formatNumber(data.stats.totalTickets),
              rating: `${data.stats.avgRating}★`,
            });
          }
        }
      } catch (error) {
        console.error('Failed to fetch platform stats:', error);
        // Keep fallback stats
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statsData = [
    { value: stats.totalEvents, label: "Events Created" },
    { value: stats.totalGuests, label: "Happy Guests" },
    { value: stats.totalTickets, label: "Tickets Sold" },
    { value: stats.rating, label: "Avg Rating" },
  ];

  return (
    <section className="py-16 bg-gray-900 dark:bg-gray-950">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12">
          {statsData.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="text-center"
            >
              <div className={`text-3xl sm:text-4xl lg:text-5xl font-black bg-gradient-to-r from-indigo-400 via-violet-400 to-pink-400 bg-clip-text text-transparent mb-2 ${loading ? 'animate-pulse' : ''}`}>
                {stat.value}
              </div>
              <div className="text-sm sm:text-base text-gray-400">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
