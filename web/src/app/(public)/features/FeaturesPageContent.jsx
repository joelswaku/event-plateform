"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import {
  Palette,
  Ticket,
  CheckCircle,
  QrCode,
  Users,
  UserPlus,
  BarChart3,
  Smartphone,
  Mail,
  Paintbrush,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { Navbar, Footer } from "@/components/landing";
import Link from "next/link";

const FEATURES = [
  {
    Icon: Palette,
    title: "Event Page Builder",
    desc: "Create stunning event pages with our intuitive drag & drop builder. Customize layouts, colors, and sections in real-time without any coding knowledge.",
    accent: "violet",
    benefits: [
      "30+ professional templates",
      "Real-time preview",
      "Mobile-responsive design",
      "Custom branding support",
    ],
  },
  {
    Icon: Ticket,
    title: "Ticketing System",
    desc: "Sell tickets seamlessly with secure checkout and payment processing. Support multiple ticket types, early bird pricing, and promo codes.",
    accent: "emerald",
    benefits: [
      "Secure payment processing",
      "Multiple ticket tiers",
      "Promo code support",
      "Automatic confirmation emails",
    ],
  },
  {
    Icon: CheckCircle,
    title: "RSVP Management",
    desc: "Track guest confirmations effortlessly with our comprehensive RSVP system. Collect dietary preferences, plus-ones, and custom responses.",
    accent: "sky",
    benefits: [
      "Guest confirmation tracking",
      "Dietary preferences collection",
      "Plus-one management",
      "Automated reminders",
    ],
  },
  {
    Icon: QrCode,
    title: "QR Code Check-in",
    desc: "Speed up guest verification with QR code scanning. Check-in guests instantly using our mobile app with offline support.",
    accent: "rose",
    benefits: [
      "Instant guest verification",
      "Offline mode support",
      "Real-time attendance tracking",
      "Duplicate check-in prevention",
    ],
  },
  {
    Icon: Users,
    title: "Guest Management",
    desc: "Maintain a comprehensive attendee database with detailed guest profiles, RSVP history, and communication logs.",
    accent: "amber",
    benefits: [
      "Centralized guest database",
      "Import/export capabilities",
      "Guest grouping & segmentation",
      "Communication history",
    ],
  },
  {
    Icon: UserPlus,
    title: "Team Collaboration",
    desc: "Invite team members and co-organizers with customizable role-based permissions. Work together seamlessly on event planning.",
    accent: "indigo",
    benefits: [
      "Role-based access control",
      "Unlimited team members",
      "Activity logs & audit trails",
      "Real-time collaboration",
    ],
  },
  {
    Icon: BarChart3,
    title: "Event Analytics",
    desc: "Get real-time insights into ticket sales, RSVP rates, guest demographics, and engagement metrics to optimize your event.",
    accent: "violet",
    benefits: [
      "Real-time dashboards",
      "Sales & revenue tracking",
      "Guest demographic insights",
      "Export custom reports",
    ],
  },
  {
    Icon: Smartphone,
    title: "Mobile App",
    desc: "Manage events on the go with our native iOS & Android apps. Check-in guests, track sales, and respond to inquiries from anywhere.",
    accent: "emerald",
    benefits: [
      "Native iOS & Android apps",
      "Offline functionality",
      "Push notifications",
      "Mobile check-in scanner",
    ],
  },
  {
    Icon: Mail,
    title: "Email Notifications",
    desc: "Keep attendees informed with automated email notifications. Send confirmations, reminders, and updates with customizable templates.",
    accent: "sky",
    benefits: [
      "Automated email sequences",
      "Customizable templates",
      "Scheduled reminders",
      "Delivery analytics",
    ],
  },
  {
    Icon: Paintbrush,
    title: "Custom Branding",
    desc: "White-label your event pages with custom domains, logos, and brand colors. Remove LiteEvent branding on Pro plans.",
    accent: "rose",
    benefits: [
      "Custom domain support",
      "Logo & brand colors",
      "White-label options",
      "Custom CSS injection",
    ],
  },
];

const ACCENT = {
  amber: {
    bg: "bg-amber-50",
    icon: "text-amber-500",
    border: "hover:border-amber-200",
    shadow: "hover:shadow-amber-50",
  },
  violet: {
    bg: "bg-violet-50",
    icon: "text-violet-500",
    border: "hover:border-violet-200",
    shadow: "hover:shadow-violet-50",
  },
  rose: {
    bg: "bg-rose-50",
    icon: "text-rose-500",
    border: "hover:border-rose-200",
    shadow: "hover:shadow-rose-50",
  },
  sky: {
    bg: "bg-sky-50",
    icon: "text-sky-500",
    border: "hover:border-sky-200",
    shadow: "hover:shadow-sky-50",
  },
  emerald: {
    bg: "bg-emerald-50",
    icon: "text-emerald-500",
    border: "hover:border-emerald-200",
    shadow: "hover:shadow-emerald-50",
  },
  indigo: {
    bg: "bg-indigo-50",
    icon: "text-indigo-500",
    border: "hover:border-indigo-200",
    shadow: "hover:shadow-indigo-50",
  },
};

function FeatureCard({ feature, index }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const { Icon, title, desc, accent, benefits } = feature;
  const colors = ACCENT[accent];

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{
        duration: 0.55,
        ease: [0.22, 1, 0.36, 1],
        delay: (index % 2) * 0.08,
      }}
      className={`p-8 rounded-2xl border border-gray-100 ${colors.border} hover:shadow-xl ${colors.shadow} transition-all duration-300 group bg-white`}
    >
      <div
        className={`w-14 h-14 rounded-2xl ${colors.bg} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-200`}
      >
        <Icon className={`w-6 h-6 ${colors.icon}`} strokeWidth={2} />
      </div>
      <h3 className="font-bold text-gray-900 mb-3 text-xl">{title}</h3>
      <p className="text-gray-600 text-[15px] leading-relaxed mb-5">{desc}</p>
      <ul className="space-y-2">
        {benefits.map((benefit, idx) => (
          <li
            key={idx}
            className="flex items-start gap-2 text-sm text-gray-500"
          >
            <CheckCircle className={`w-4 h-4 ${colors.icon} mt-0.5 shrink-0`} />
            <span>{benefit}</span>
          </li>
        ))}
      </ul>
    </motion.div>
  );
}

function HeroSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  return (
    <section className="pt-32 pb-16 bg-linear-to-b from-gray-50 to-white">
      <div ref={ref} className="max-w-6xl mx-auto px-6 md:px-12 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-violet-50 border border-violet-200 text-violet-600 text-sm font-semibold mb-6">
            Platform Features
          </span>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-gray-900 tracking-tight leading-tight mb-6">
            Powerful Features for
            <br />
            <span className="bg-linear-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
              Modern Event Management
            </span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Everything you need to create, manage, and host unforgettable events.
            From beautiful event pages to advanced analytics, we&apos;ve got you covered.
          </p>
        </motion.div>
      </div>
    </section>
  );
}

function CtaSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="py-24 bg-gray-900 relative overflow-hidden">
      {/* Radial glow */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-225 h-125 bg-violet-500/10 rounded-full blur-3xl" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-violet-400/5 rounded-full blur-2xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-400/5 rounded-full blur-2xl" />
      </div>

      <div ref={ref} className="relative max-w-3xl mx-auto px-6 text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={inView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-semibold mb-8"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Free to start — no credit card required
        </motion.div>

        {/* Headline */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{
            duration: 0.6,
            ease: [0.22, 1, 0.36, 1],
            delay: 0.06,
          }}
          className="text-5xl md:text-6xl font-black text-white tracking-tight leading-tight"
        >
          Ready to create your
          <br />
          <span className="bg-linear-to-r from-violet-400 to-indigo-300 bg-clip-text text-transparent">
            next amazing event?
          </span>
        </motion.h2>

        {/* Sub */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{
            duration: 0.6,
            ease: [0.22, 1, 0.36, 1],
            delay: 0.12,
          }}
          className="mt-6 text-gray-400 text-lg max-w-xl mx-auto leading-relaxed"
        >
          Join thousands of event organizers who trust LiteEvent to power their
          events. Get started in minutes.
        </motion.p>

        {/* CTA buttons */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{
            duration: 0.6,
            ease: [0.22, 1, 0.36, 1],
            delay: 0.18,
          }}
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link
            href="/register"
            className="group flex items-center gap-2 bg-linear-to-r from-violet-500 to-indigo-600 hover:from-violet-400 hover:to-indigo-500 text-white font-bold px-8 py-4 rounded-2xl transition-all shadow-2xl shadow-violet-500/30 text-base"
          >
            Get Started Free
            <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
          <Link
            href="/#pricing"
            className="text-gray-400 hover:text-white text-sm font-medium transition-colors"
          >
            View Pricing Plans
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

export default function FeaturesPageContent() {
  return (
    <main className="min-h-screen bg-white">
      <Navbar />
      <HeroSection />

      {/* Features Grid */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="grid md:grid-cols-2 gap-8">
            {FEATURES.map((feature, index) => (
              <FeatureCard key={feature.title} feature={feature} index={index} />
            ))}
          </div>
        </div>
      </section>

      <CtaSection />
      <Footer />
    </main>
  );
}
