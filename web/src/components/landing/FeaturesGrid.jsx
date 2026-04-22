"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import {
  Palette,
  MousePointerClick,
  Mail,
  Globe,
  Smartphone,
  Zap,
} from "lucide-react";

const FEATURES = [
  {
    Icon: Palette,
    title: "30 Stunning Templates",
    desc: "From minimalist modern to opulent vintage — every couple finds their aesthetic.",
    accent: "amber",
  },
  {
    Icon: MousePointerClick,
    title: "Drag & Drop Builder",
    desc: "Rearrange sections, upload photos, and edit every word in real time.",
    accent: "violet",
  },
  {
    Icon: Mail,
    title: "Built-in RSVP",
    desc: "Collect RSVPs, manage guest lists, and send reminders — all in one place.",
    accent: "rose",
  },
  {
    Icon: Globe,
    title: "Custom Domain",
    desc: "Publish on yourname.com or your own domain for a truly personal touch.",
    accent: "sky",
  },
  {
    Icon: Smartphone,
    title: "Mobile-Perfect",
    desc: "Every template is pixel-perfect on phones — where guests will open the link.",
    accent: "emerald",
  },
  {
    Icon: Zap,
    title: "Instant Publish",
    desc: "One click and your page is live. Share the link with guests in seconds.",
    accent: "amber",
  },
];

const ACCENT = {
  amber:   { bg: "bg-amber-50",   icon: "text-amber-500",   border: "hover:border-amber-200",   shadow: "hover:shadow-amber-50"   },
  violet:  { bg: "bg-violet-50",  icon: "text-violet-500",  border: "hover:border-violet-200",  shadow: "hover:shadow-violet-50"  },
  rose:    { bg: "bg-rose-50",    icon: "text-rose-500",    border: "hover:border-rose-200",    shadow: "hover:shadow-rose-50"    },
  sky:     { bg: "bg-sky-50",     icon: "text-sky-500",     border: "hover:border-sky-200",     shadow: "hover:shadow-sky-50"     },
  emerald: { bg: "bg-emerald-50", icon: "text-emerald-500", border: "hover:border-emerald-200", shadow: "hover:shadow-emerald-50" },
};

function FeatureCard({ feature, index }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const { Icon, title, desc, accent } = feature;
  const colors = ACCENT[accent];

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: (index % 3) * 0.08 }}
      className={`p-6 rounded-2xl border border-gray-100 ${colors.border} hover:shadow-lg ${colors.shadow} transition-all duration-300 group`}
    >
      <div
        className={`w-12 h-12 rounded-2xl ${colors.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200`}
      >
        <Icon className={`w-5 h-5 ${colors.icon}`} strokeWidth={2} />
      </div>
      <h3 className="font-bold text-gray-900 mb-2 text-[15px]">{title}</h3>
      <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
    </motion.div>
  );
}

export default function FeaturesGrid() {
  const headerRef = useRef(null);
  const headerInView = useInView(headerRef, { once: true, margin: "-80px" });

  return (
    <section id="features" className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-6 md:px-12">
        {/* Header */}
        <motion.div
          ref={headerRef}
          initial={{ opacity: 0, y: 20 }}
          animate={headerInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-14"
        >
          <span className="text-amber-600 text-sm font-bold uppercase tracking-widest">
            Features
          </span>
          <h2 className="mt-2 text-4xl md:text-5xl font-black text-gray-900 tracking-tight">
            Everything you need,
            <br />
            nothing you don&apos;t.
          </h2>
          <p className="mt-4 text-gray-500 max-w-xl mx-auto text-lg">
            Every tool couples need to create, share, and manage a beautiful
            wedding website — without the complexity.
          </p>
        </motion.div>

        {/* Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f, i) => (
            <FeatureCard key={f.title} feature={f} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
