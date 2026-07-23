"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, Zap, Sparkles, Star, Crown, ArrowRight, Layout, Check } from "lucide-react";
import { Navbar, Footer } from "@/components/landing";
import { STYLE_TEMPLATES, FREE_STYLE } from "@/lib/styleTemplates";

// Filter categories
const FILTER_CATEGORIES = [
  { id: "all", label: "All Templates" },
  { id: "wedding", label: "Weddings", eventTypes: ["wedding", "engagement"] },
  { id: "conference", label: "Conferences", eventTypes: ["conference", "seminar", "workshop", "meeting"] },
  { id: "birthday", label: "Birthdays", eventTypes: ["birthday", "private_party"] },
  { id: "concert", label: "Concerts", eventTypes: ["concert", "live_show"] },
  { id: "festival", label: "Festivals", eventTypes: ["festival"] },
];

// Category badge colors
const CATEGORY_COLORS = {
  LIFE: "bg-pink-100 text-pink-700 border-pink-200",
  SOCIAL: "bg-amber-100 text-amber-700 border-amber-200",
  CORPORATE: "bg-blue-100 text-blue-700 border-blue-200",
  ENTERTAINMENT: "bg-purple-100 text-purple-700 border-purple-200",
  RELIGIOUS: "bg-teal-100 text-teal-700 border-teal-200",
};

// Style badge colors
const STYLE_COLORS = {
  CLASSIC: "bg-gray-100 text-gray-700",
  ELEGANT: "bg-rose-100 text-rose-700",
  MODERN: "bg-indigo-100 text-indigo-700",
  MINIMAL: "bg-slate-100 text-slate-700",
  LUXURY: "bg-amber-100 text-amber-700",
  FUN: "bg-orange-100 text-orange-700",
};

function TemplatePreview({ template }) {
  const { design, assets } = template;
  const bgColor = design.colors.bg;
  const accentColor = design.colors.accent;
  const heroImage = assets.hero_image || assets.cover_image;

  return (
    <div
      className="relative w-full aspect-[9/16] rounded-2xl overflow-hidden shadow-lg border-4 border-gray-800"
      style={{ maxHeight: "420px" }}
    >
      {/* Phone Mockup Header */}
      <div className="absolute top-0 left-0 right-0 h-8 bg-gray-900 z-10 flex items-center justify-center">
        <div className="w-20 h-5 bg-gray-800 rounded-full"></div>
      </div>

      {/* Template Preview */}
      <div
        className="absolute inset-0 pt-8 overflow-hidden"
        style={{ backgroundColor: bgColor }}
      >
        {/* Hero Section */}
        <div
          className="relative h-48 flex items-center justify-center overflow-hidden"
          style={{
            background: heroImage
              ? `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.6)), url(${heroImage})`
              : `linear-gradient(135deg, ${accentColor}, ${accentColor}dd)`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="text-center px-4 z-10">
            <div className="text-xs font-bold text-white/80 mb-1">YOU'RE INVITED</div>
            <div className="text-2xl font-black text-white mb-2" style={{ fontFamily: design.fonts.heading }}>
              {template.name}
            </div>
            <div className="text-xs text-white/90">
              {template.description.split('.')[0]}
            </div>
          </div>
        </div>

        {/* Content Sections Preview */}
        <div className="p-4 space-y-3">
          {template.sections.slice(1, 4).map((section, idx) => (
            <div
              key={idx}
              className="rounded-lg p-3 border"
              style={{
                backgroundColor: `${bgColor}`,
                borderColor: `${accentColor}20`,
              }}
            >
              <div className="h-2 rounded-full mb-2" style={{ backgroundColor: accentColor, width: '60%' }}></div>
              <div className="h-1 rounded-full mb-1" style={{ backgroundColor: `${design.colors.text}20`, width: '100%' }}></div>
              <div className="h-1 rounded-full" style={{ backgroundColor: `${design.colors.text}20`, width: '80%' }}></div>
            </div>
          ))}
        </div>

        {/* Gradient Fade at Bottom */}
        <div
          className="absolute bottom-0 left-0 right-0 h-24"
          style={{
            background: `linear-gradient(to bottom, transparent, ${bgColor})`
          }}
        ></div>
      </div>
    </div>
  );
}

function TemplateCard({ template }) {
  const isFree = template.tier === "free";
  const categoryColor = CATEGORY_COLORS[template.category] || "bg-gray-100 text-gray-700 border-gray-200";
  const styleColor = STYLE_COLORS[template.style] || "bg-gray-100 text-gray-700";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className="group relative bg-white rounded-3xl shadow-lg border-2 border-gray-100 overflow-hidden hover:border-indigo-200 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
    >
      {/* Premium Badge */}
      {!isFree && (
        <div className="absolute top-4 right-4 z-20 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 shadow-lg flex items-center gap-1">
          <Crown className="w-3 h-3 text-white" />
          <span className="text-xs font-bold text-white uppercase tracking-wide">Premium</span>
        </div>
      )}

      {/* Template Preview */}
      <div className="p-6 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <TemplatePreview template={template} />
      </div>

      {/* Template Info */}
      <div className="p-6">
        {/* Badges */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${categoryColor}`}>
            {template.category}
          </span>
          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${styleColor}`}>
            {template.style}
          </span>
        </div>

        {/* Name */}
        <h3 className="text-xl font-black text-gray-900 mb-2">
          {template.name}
        </h3>

        {/* Description */}
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
          {template.description}
        </p>

        {/* Features */}
        <div className="flex items-center gap-3 mb-5 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <Layout className="w-3.5 h-3.5" />
            <span>{template.sections.length} sections</span>
          </div>
          {template.assets.gallery_images.length > 0 && (
            <div className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5" />
              <span>Gallery</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <Link
            href={`/preview/template/${template.id}`}
            className="flex-1 py-3 px-4 rounded-xl font-semibold text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors text-center flex items-center justify-center gap-2"
          >
            <Eye className="w-4 h-4" />
            Preview
          </Link>
          <Link
            href={isFree ? `/register?template=${template.id}` : `/register?template=${template.id}&upgrade=true`}
            className="flex-1 py-3 px-4 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 transition-all shadow-lg shadow-indigo-500/20 text-center flex items-center justify-center gap-2"
          >
            {isFree ? (
              <>
                <Check className="w-4 h-4" />
                Use Free
              </>
            ) : (
              <>
                <Crown className="w-4 h-4" />
                Use Template
              </>
            )}
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

export default function TemplatesPage() {
  const [activeFilter, setActiveFilter] = useState("all");

  // Filter templates based on active filter
  const filteredTemplates = activeFilter === "all"
    ? STYLE_TEMPLATES
    : STYLE_TEMPLATES.filter((template) => {
        const filterCategory = FILTER_CATEGORIES.find((f) => f.id === activeFilter);
        if (!filterCategory || !filterCategory.eventTypes) return false;
        return template.eventTypes.some((type) => filterCategory.eventTypes.includes(type));
      });

  // Split into free and premium
  const freeTemplates = filteredTemplates.filter((t) => t.tier === "free");
  const premiumTemplates = filteredTemplates.filter((t) => t.tier !== "free");

  return (
    <main className="min-h-screen bg-white">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-6 md:px-12 bg-gradient-to-br from-indigo-50 via-white to-violet-50">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-indigo-100 to-violet-100 border border-indigo-200 mb-6">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span className="text-sm font-semibold text-indigo-700">
                {STYLE_TEMPLATES.length}+ Professional Templates
              </span>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-gray-900 mb-6 tracking-tight">
              Beautiful Templates <br className="hidden sm:block" />
              <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                for Every Event
              </span>
            </h1>

            <p className="text-xl sm:text-2xl text-gray-600 max-w-3xl mx-auto mb-12">
              Choose from our curated collection of professionally designed templates.
              Customize colors, layouts, and sections to match your event perfectly.
            </p>

            {/* Filter Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3">
              {FILTER_CATEGORIES.map((filter) => (
                <motion.button
                  key={filter.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActiveFilter(filter.id)}
                  className={`px-6 py-3 rounded-full font-semibold text-sm transition-all duration-300 ${
                    activeFilter === filter.id
                      ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/30"
                      : "bg-white text-gray-700 border-2 border-gray-200 hover:border-indigo-300 hover:text-indigo-600"
                  }`}
                >
                  {filter.label}
                </motion.button>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Free Templates Section */}
      {freeTemplates.length > 0 && (
        <section className="py-16 px-6 md:px-12 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-3 mb-10">
              <div className="px-4 py-2 rounded-full bg-green-100 border border-green-200 flex items-center gap-2">
                <Check className="w-4 h-4 text-green-600" />
                <span className="text-sm font-bold text-green-700">FREE</span>
              </div>
              <h2 className="text-3xl font-black text-gray-900">
                Free Templates
              </h2>
              <div className="flex-1 h-px bg-gray-200"></div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <AnimatePresence mode="popLayout">
                {freeTemplates.map((template) => (
                  <TemplateCard key={template.id} template={template} />
                ))}
              </AnimatePresence>
            </div>
          </div>
        </section>
      )}

      {/* Premium Templates Section */}
      {premiumTemplates.length > 0 && (
        <section className="py-16 px-6 md:px-12 bg-gradient-to-br from-gray-50 to-white">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-3 mb-10">
              <div className="px-4 py-2 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 flex items-center gap-2 shadow-lg">
                <Crown className="w-4 h-4 text-white" />
                <span className="text-sm font-bold text-white">PREMIUM</span>
              </div>
              <h2 className="text-3xl font-black text-gray-900">
                Premium Templates
              </h2>
              <div className="flex-1 h-px bg-gray-200"></div>
            </div>

            <div className="bg-gradient-to-r from-indigo-50 to-violet-50 border-2 border-indigo-200 rounded-2xl p-6 mb-10">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center flex-shrink-0">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    Unlock Premium Templates
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Get access to all premium templates with advanced designs, more sections,
                    and exclusive features. Start from just $19/month.
                  </p>
                  <Link
                    href="/pricing"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold text-sm hover:from-indigo-700 hover:to-violet-700 transition-all shadow-lg shadow-indigo-500/20"
                  >
                    View Pricing
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <AnimatePresence mode="popLayout">
                {premiumTemplates.map((template) => (
                  <TemplateCard key={template.id} template={template} />
                ))}
              </AnimatePresence>
            </div>
          </div>
        </section>
      )}

      {/* No Results */}
      {filteredTemplates.length === 0 && (
        <section className="py-20 px-6 md:px-12">
          <div className="max-w-2xl mx-auto text-center">
            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-6">
              <Layout className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              No templates found
            </h3>
            <p className="text-gray-600 mb-6">
              Try selecting a different category to see more templates.
            </p>
            <button
              onClick={() => setActiveFilter("all")}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold hover:from-indigo-700 hover:to-violet-700 transition-all shadow-lg shadow-indigo-500/20"
            >
              View All Templates
            </button>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-20 px-6 md:px-12 bg-gradient-to-br from-indigo-600 to-violet-600">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl sm:text-5xl font-black text-white mb-6">
              Ready to create your event?
            </h2>
            <p className="text-xl text-indigo-100 mb-10 max-w-2xl mx-auto">
              Choose a template and customize it to match your event perfectly.
              Get started in minutes with our intuitive builder.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/register"
                className="px-8 py-4 bg-white text-indigo-600 rounded-xl font-bold text-lg hover:bg-gray-50 transition-colors shadow-xl hover:shadow-2xl hover:-translate-y-0.5 transform duration-300 inline-flex items-center gap-2"
              >
                <Sparkles className="w-5 h-5" />
                Get Started Free
              </Link>
              <Link
                href="/pricing"
                className="px-8 py-4 bg-transparent border-2 border-white text-white rounded-xl font-bold text-lg hover:bg-white/10 transition-colors inline-flex items-center gap-2"
              >
                <Crown className="w-5 h-5" />
                View Pricing
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
