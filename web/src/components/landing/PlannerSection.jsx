"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Calendar, CheckSquare, Users, FileText, DollarSign, Clock, Sparkles, ArrowRight } from "lucide-react";

export default function PlannerSection() {
  const features = [
    {
      icon: CheckSquare,
      title: "Smart Task Management",
      description: "AI-powered task breakdown with deadlines and assignments",
      color: "indigo"
    },
    {
      icon: Calendar,
      title: "Timeline Planning",
      description: "Visual timeline with milestones and critical path tracking",
      color: "violet"
    },
    {
      icon: Users,
      title: "Team Collaboration",
      description: "Assign tasks, share updates, and track team progress",
      color: "pink"
    },
    {
      icon: DollarSign,
      title: "Budget Tracking",
      description: "Manage expenses, track payments, and stay on budget",
      color: "green"
    },
    {
      icon: FileText,
      title: "Vendor Management",
      description: "Store contracts, track vendors, and manage communications",
      color: "amber"
    },
    {
      icon: Clock,
      title: "Automated Reminders",
      description: "Never miss a deadline with smart notifications",
      color: "blue"
    }
  ];

  const colorClasses = {
    indigo: "from-indigo-400 to-indigo-600",
    violet: "from-violet-400 to-violet-600",
    pink: "from-pink-400 to-pink-600",
    green: "from-green-400 to-green-600",
    amber: "from-amber-400 to-amber-600",
    blue: "from-blue-400 to-blue-600"
  };

  return (
    <section className="py-20 lg:py-32 bg-white dark:bg-gray-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-100 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800 mb-6">
              <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">
                AI-Powered Event Planner
              </span>
            </div>

            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-gray-900 dark:text-white mb-6">
              Plan Like a{" "}
              <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-pink-600 bg-clip-text text-transparent">
                Professional
              </span>
            </h2>

            <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Our intelligent event planner helps you organize every detail, from initial planning to post-event follow-up. Stay organized, on budget, and on time.
            </p>
          </motion.div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 mb-12">
          {features.map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="group relative bg-gray-50 dark:bg-gray-800 rounded-2xl p-6 hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700"
            >
              {/* Icon */}
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorClasses[feature.color]} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon className="w-6 h-6 text-white" />
              </div>

              {/* Content */}
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center"
        >
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-base font-bold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 transition-all duration-300 hover:-translate-y-0.5"
          >
            Start Planning Your Event
            <ArrowRight className="w-5 h-5" />
          </Link>

          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            Free forever. No credit card required.
          </p>
        </motion.div>

        {/* Visual Feature Highlight */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-16 relative rounded-2xl overflow-hidden border-2 border-gray-200 dark:border-gray-700 shadow-2xl"
        >
          <div className="bg-gradient-to-br from-indigo-500 via-violet-500 to-pink-500 p-8 lg:p-12">
            <div className="bg-white dark:bg-gray-900 rounded-xl p-6 lg:p-8">
              <div className="grid md:grid-cols-3 gap-6">
                {/* Stat 1 */}
                <div className="text-center">
                  <div className="text-4xl font-black text-indigo-600 dark:text-indigo-400 mb-2">
                    85%
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Faster Planning
                  </div>
                </div>

                {/* Stat 2 */}
                <div className="text-center">
                  <div className="text-4xl font-black text-violet-600 dark:text-violet-400 mb-2">
                    100%
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    On Budget
                  </div>
                </div>

                {/* Stat 3 */}
                <div className="text-center">
                  <div className="text-4xl font-black text-pink-600 dark:text-pink-400 mb-2">
                    50+
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Task Templates
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
