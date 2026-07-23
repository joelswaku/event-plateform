"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  Sparkles,
  Target,
  Heart,
  Users,
  Shield,
  Zap,
  Clock,
  Globe,
  Award,
  TrendingUp,
  Star,
  ArrowRight,
} from "lucide-react";
import { Navbar, Footer } from "@/components/landing";

const VALUE_PROPS = [
  {
    Icon: Zap,
    title: "Lightning Fast Setup",
    desc: "Create and launch your event page in minutes, not hours. Our intuitive builder gets you up and running instantly.",
    accent: "amber",
  },
  {
    Icon: Shield,
    title: "Enterprise-Grade Security",
    desc: "Bank-level encryption and secure payment processing protect your data and your guests' information.",
    accent: "emerald",
  },
  {
    Icon: Users,
    title: "Exceptional Support",
    desc: "Our dedicated support team is here to help you succeed, with priority response times and expert guidance.",
    accent: "indigo",
  },
  {
    Icon: Globe,
    title: "Global Reach",
    desc: "Multi-language support, international payment processing, and worldwide event hosting capabilities.",
    accent: "sky",
  },
  {
    Icon: Clock,
    title: "24/7 Reliability",
    desc: "99.9% uptime guarantee ensures your event pages are always accessible when your guests need them.",
    accent: "violet",
  },
  {
    Icon: Award,
    title: "Industry Leading",
    desc: "Trusted by thousands of organizers worldwide, from small gatherings to large-scale conferences.",
    accent: "rose",
  },
];

const STATS = [
  { value: "12,000+", label: "Events Created", Icon: Sparkles },
  { value: "500,000+", label: "Happy Guests", Icon: Users },
  { value: "4.9★", label: "Average Rating", Icon: Star },
  { value: "98%", label: "Satisfaction Rate", Icon: Heart },
];

const TIMELINE = [
  {
    year: "2023",
    title: "The Beginning",
    desc: "Founded with a mission to simplify event management for everyone.",
  },
  {
    year: "2024",
    title: "Rapid Growth",
    desc: "Reached 5,000 events and launched our mobile app for on-the-go management.",
  },
  {
    year: "2025",
    title: "Going Global",
    desc: "Expanded to 50+ countries with multi-language support and international payments.",
  },
  {
    year: "2026",
    title: "Leading Innovation",
    desc: "Serving 12,000+ events with advanced analytics and AI-powered features.",
  },
];

const accentColors = {
  amber: {
    bg: "bg-amber-100",
    iconBg: "bg-amber-500",
    border: "border-amber-200",
    text: "text-amber-700",
  },
  emerald: {
    bg: "bg-emerald-100",
    iconBg: "bg-emerald-500",
    border: "border-emerald-200",
    text: "text-emerald-700",
  },
  indigo: {
    bg: "bg-indigo-100",
    iconBg: "bg-indigo-500",
    border: "border-indigo-200",
    text: "text-indigo-700",
  },
  sky: {
    bg: "bg-sky-100",
    iconBg: "bg-sky-500",
    border: "border-sky-200",
    text: "text-sky-700",
  },
  violet: {
    bg: "bg-violet-100",
    iconBg: "bg-violet-500",
    border: "border-violet-200",
    text: "text-violet-700",
  },
  rose: {
    bg: "bg-rose-100",
    iconBg: "bg-rose-500",
    border: "border-rose-200",
    text: "text-rose-700",
  },
};

export default function AboutPageContent() {
  return (
    <main className="min-h-screen bg-white">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 md:px-12 bg-gradient-to-br from-gray-50 via-white to-indigo-50">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-100 border border-indigo-200 mb-6">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span className="text-sm font-semibold text-indigo-700">
                About LiteEvent
              </span>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-gray-900 mb-6 tracking-tight">
              Making Event Management
              <br />
              <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                Simple & Powerful
              </span>
            </h1>

            <p className="text-xl sm:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              We believe every event deserves professional tools that are easy to use.
              From intimate gatherings to large-scale conferences, LiteEvent empowers
              organizers to create unforgettable experiences.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-6 md:px-12 bg-white border-y border-gray-200">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
            {STATS.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-indigo-100 mb-4">
                  <stat.Icon className="w-6 h-6 text-indigo-600" />
                </div>
                <div className="text-4xl sm:text-5xl font-black text-gray-900 mb-2">
                  {stat.value}
                </div>
                <div className="text-sm sm:text-base text-gray-600 font-medium">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 px-6 md:px-12 bg-gradient-to-br from-indigo-50 to-white">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 mb-6">
              <Target className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-4xl sm:text-5xl font-black text-gray-900 mb-6">
              Our Mission
            </h2>
            <p className="text-xl text-gray-700 leading-relaxed max-w-3xl mx-auto">
              To democratize professional event management by providing powerful,
              intuitive tools that anyone can use. We are committed to helping
              organizers of all sizes create memorable experiences without the complexity
              and cost of traditional event platforms.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid md:grid-cols-3 gap-8 mt-16"
          >
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-indigo-100 mb-4">
                <Heart className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">User First</h3>
              <p className="text-gray-600">
                Every feature is designed with our users in mind, prioritizing
                simplicity and effectiveness.
              </p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-violet-100 mb-4">
                <TrendingUp className="w-6 h-6 text-violet-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Continuous Innovation
              </h3>
              <p className="text-gray-600">
                We constantly evolve our platform with new features and improvements
                based on user feedback.
              </p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-sky-100 mb-4">
                <Shield className="w-6 h-6 text-sky-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Trust & Security</h3>
              <p className="text-gray-600">
                Your data and your guests' information are protected with
                enterprise-grade security.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Our Story Section */}
      <section className="py-20 px-6 md:px-12 bg-white">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl sm:text-5xl font-black text-gray-900 mb-6">
              Our Story
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              From a simple idea to empowering thousands of event organizers worldwide
            </p>
          </motion.div>

          <div className="space-y-12">
            {TIMELINE.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="flex flex-col md:flex-row gap-8 items-start"
              >
                <div className="flex-shrink-0">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-lg">
                    <span className="text-2xl font-black text-white">
                      {item.year}
                    </span>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">
                    {item.title}
                  </h3>
                  <p className="text-lg text-gray-600 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-20 px-6 md:px-12 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl sm:text-5xl font-black text-gray-900 mb-6">
              Why Choose LiteEvent
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              The features and benefits that make us the preferred choice for
              event organizers
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {VALUE_PROPS.map((prop, index) => {
              const colors = accentColors[prop.accent];
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className={`bg-white rounded-2xl p-8 border-2 ${colors.border} hover:shadow-xl transition-all duration-300 hover:-translate-y-1`}
                >
                  <div
                    className={`inline-flex items-center justify-center w-14 h-14 rounded-xl ${colors.iconBg} mb-6`}
                  >
                    <prop.Icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    {prop.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">{prop.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 px-6 md:px-12 bg-white">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl sm:text-5xl font-black text-gray-900 mb-6">
              Join Our Team
            </h2>
            <p className="text-xl text-gray-600 mb-10 max-w-3xl mx-auto">
              We are a passionate team of event enthusiasts, designers, and
              engineers working together to transform how events are managed.
              Want to be part of the journey?
            </p>

            <div className="inline-flex flex-col sm:flex-row items-center gap-4 bg-gradient-to-br from-indigo-50 to-violet-50 border-2 border-indigo-200 rounded-2xl p-8 sm:p-10">
              <div className="flex-1 text-left">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  We are Hiring!
                </h3>
                <p className="text-gray-600">
                  Explore open positions and help us build the future of event management.
                </p>
              </div>
              <Link
                href="mailto:careers@liteevent.com"
                className="flex-shrink-0 px-8 py-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl font-bold text-lg hover:from-indigo-700 hover:to-violet-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5 inline-flex items-center gap-2"
              >
                View Careers
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 px-6 md:px-12 bg-gradient-to-br from-indigo-600 to-violet-600">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl sm:text-5xl font-black text-white mb-6">
              Ready to Create Your Event?
            </h2>
            <p className="text-xl text-indigo-100 mb-10 max-w-2xl mx-auto">
              Join thousands of organizers who trust LiteEvent to power their events.
              Start for free, no credit card required.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/register"
                className="px-8 py-4 bg-white text-indigo-600 rounded-xl font-bold text-lg hover:bg-gray-50 transition-colors shadow-xl hover:shadow-2xl hover:-translate-y-0.5 transform duration-300"
              >
                Get Started Free
              </Link>
              <Link
                href="/features"
                className="px-8 py-4 bg-transparent border-2 border-white text-white rounded-xl font-bold text-lg hover:bg-white/10 transition-colors"
              >
                Explore Features
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
