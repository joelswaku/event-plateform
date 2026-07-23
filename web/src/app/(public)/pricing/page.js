"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Check, X, Sparkles, Zap, ChevronDown } from "lucide-react";
import { Navbar, Footer } from "@/components/landing";

const PRICING_PLANS = [
  {
    id: "free",
    name: "Free",
    tagline: "Perfect to get started",
    monthlyPrice: 0,
    yearlyPrice: 0,
    features: [
      "1 event",
      "50 guests per event",
      "Basic event page",
      "RSVP management",
      "Email support",
    ],
    limitations: [
      "Limited customization",
      "LiteEvent branding",
      "No analytics",
    ]
  },
  {
    id: "starter",
    name: "Starter",
    tagline: "For growing events",
    monthlyPrice: 19,
    yearlyPrice: 15.2, // 20% off
    features: [
      "5 events",
      "200 guests per event",
      "All Free features",
      "Custom branding",
      "Ticketing (5% fee)",
      "QR check-in",
      "Analytics",
      "Priority support",
    ],
    limitations: []
  },
  {
    id: "pro",
    name: "Pro",
    tagline: "For professional organizers",
    popular: true,
    monthlyPrice: 49,
    yearlyPrice: 39.2, // 20% off
    features: [
      "Unlimited events",
      "Unlimited guests",
      "All Starter features",
      "Advanced analytics",
      "Team collaboration",
      "API access",
      "White-label",
      "Ticketing (2% fee)",
      "Dedicated support",
    ],
    limitations: []
  },
];

const FAQS = [
  {
    question: "Can I change plans later?",
    answer: "Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately, and we'll prorate any payments."
  },
  {
    question: "What payment methods do you accept?",
    answer: "We accept all major credit cards (Visa, Mastercard, American Express, Discover) and debit cards. All payments are processed securely through Stripe."
  },
  {
    question: "Is there a free trial?",
    answer: "The Free plan is available forever with no credit card required. Paid plans come with a 14-day money-back guarantee."
  },
  {
    question: "What happens to my data if I cancel?",
    answer: "Your data remains accessible in read-only mode for 30 days after cancellation. You can export all your data at any time before permanent deletion."
  },
  {
    question: "Do you offer discounts for nonprofits?",
    answer: "Yes! We offer 50% off all paid plans for registered nonprofit organizations. Contact our support team to verify your nonprofit status."
  },
  {
    question: "What's your refund policy?",
    answer: "We offer a 14-day money-back guarantee on all paid plans. If you're not satisfied, contact us within 14 days of your purchase for a full refund."
  },
  {
    question: "Can I pay annually?",
    answer: "Yes! Annual billing saves you 20% compared to monthly billing. You can switch to annual billing from your account settings."
  },
  {
    question: "What's included in 'dedicated support'?",
    answer: "Pro plan users get priority email support with response times under 4 hours, access to our live chat, and a dedicated account manager for businesses with 10+ events per month."
  }
];

const COMPARISON_FEATURES = [
  { category: "Events & Guests", features: [
    { name: "Active Events", free: "1", starter: "5", pro: "Unlimited" },
    { name: "Guests per Event", free: "50", starter: "200", pro: "Unlimited" },
    { name: "Event Templates", free: "Basic", starter: "All", pro: "All + Custom" },
  ]},
  { category: "Features", features: [
    { name: "RSVP Management", free: true, starter: true, pro: true },
    { name: "Custom Branding", free: false, starter: true, pro: true },
    { name: "White Label", free: false, starter: false, pro: true },
    { name: "QR Check-in", free: false, starter: true, pro: true },
    { name: "Mobile App Access", free: true, starter: true, pro: true },
    { name: "Basic Analytics", free: false, starter: true, pro: true },
    { name: "Advanced Analytics", free: false, starter: false, pro: true },
    { name: "Team Collaboration", free: false, starter: false, pro: true },
    { name: "API Access", free: false, starter: false, pro: true },
  ]},
  { category: "Ticketing", features: [
    { name: "Ticket Sales", free: false, starter: true, pro: true },
    { name: "Platform Fee", free: "—", starter: "5%", pro: "2%" },
    { name: "Custom Ticket Types", free: false, starter: true, pro: true },
  ]},
  { category: "Support", features: [
    { name: "Email Support", free: true, starter: true, pro: true },
    { name: "Priority Support", free: false, starter: true, pro: true },
    { name: "Dedicated Support", free: false, starter: false, pro: true },
    { name: "Onboarding Call", free: false, starter: false, pro: true },
  ]},
];

export default function PricingPage() {
  const [billingInterval, setBillingInterval] = useState("monthly");
  const [openFaqIndex, setOpenFaqIndex] = useState(null);

  const isYearly = billingInterval === "yearly";

  return (
    <main className="min-h-screen bg-white">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-6 md:px-12 bg-gradient-to-br from-gray-50 via-white to-indigo-50">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-100 border border-indigo-200 mb-6">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span className="text-sm font-semibold text-indigo-700">
                Simple, Transparent Pricing
              </span>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-gray-900 mb-6 tracking-tight">
              Choose Your Plan
            </h1>

            <p className="text-xl sm:text-2xl text-gray-600 max-w-3xl mx-auto mb-12">
              Start free and scale as you grow. All plans include our core event management features with no hidden fees.
            </p>

            {/* Billing Toggle */}
            <div className="inline-flex items-center gap-3 p-1.5 bg-gray-100 rounded-full">
              <button
                onClick={() => setBillingInterval("monthly")}
                className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${
                  !isYearly
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingInterval("yearly")}
                className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 flex items-center gap-2 ${
                  isYearly
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Yearly
                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                  Save 20%
                </span>
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-16 px-6 md:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 lg:gap-10">
            {PRICING_PLANS.map((plan, index) => {
              const price = isYearly ? plan.yearlyPrice : plan.monthlyPrice;
              const yearlyTotal = plan.yearlyPrice * 12;
              const monthlyTotal = plan.monthlyPrice * 12;
              const savings = monthlyTotal - yearlyTotal;

              return (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className={`relative rounded-3xl p-8 ${
                    plan.popular
                      ? "bg-gradient-to-br from-indigo-600 to-violet-600 border-2 border-indigo-500 shadow-2xl shadow-indigo-500/20 transform lg:scale-105"
                      : "bg-white border-2 border-gray-200 shadow-lg"
                  }`}
                >
                  {/* Popular Badge */}
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 shadow-lg">
                      <div className="flex items-center gap-1">
                        <Zap className="w-3 h-3 text-white fill-white" />
                        <span className="text-xs font-black text-white uppercase tracking-wide">
                          Popular
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Plan Header */}
                  <div className="mb-8">
                    <h3
                      className={`text-sm font-bold uppercase tracking-widest mb-2 ${
                        plan.popular ? "text-indigo-100" : "text-gray-500"
                      }`}
                    >
                      {plan.name}
                    </h3>
                    <p
                      className={`text-sm mb-6 ${
                        plan.popular ? "text-indigo-200" : "text-gray-600"
                      }`}
                    >
                      {plan.tagline}
                    </p>

                    {/* Price */}
                    <div className="flex items-baseline gap-2 mb-2">
                      <span
                        className={`text-6xl font-black ${
                          plan.popular ? "text-white" : "text-gray-900"
                        }`}
                      >
                        ${price}
                      </span>
                      <span
                        className={`text-lg ${
                          plan.popular ? "text-indigo-200" : "text-gray-500"
                        }`}
                      >
                        /month
                      </span>
                    </div>

                    {/* Savings Badge */}
                    {isYearly && plan.id !== "free" && (
                      <p
                        className={`text-sm font-semibold ${
                          plan.popular ? "text-indigo-200" : "text-green-600"
                        }`}
                      >
                        Save ${savings.toFixed(0)}/year with annual billing
                      </p>
                    )}

                    {plan.id === "free" && (
                      <p className="text-sm text-gray-500">Free forever</p>
                    )}
                  </div>

                  {/* CTA Button */}
                  <Link
                    href="/register"
                    className={`block w-full text-center py-4 rounded-xl font-bold text-base transition-all duration-300 mb-8 ${
                      plan.popular
                        ? "bg-white text-indigo-600 hover:bg-gray-50 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                        : "bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:from-indigo-700 hover:to-violet-700 shadow-lg shadow-indigo-500/20 hover:shadow-xl hover:-translate-y-0.5"
                    }`}
                  >
                    {plan.id === "free" ? "Get Started Free" : `Start ${plan.name}`}
                  </Link>

                  {/* Features */}
                  <ul className="space-y-4">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                            plan.popular
                              ? "bg-white/20"
                              : "bg-indigo-100"
                          }`}
                        >
                          <Check
                            className={`w-3 h-3 ${
                              plan.popular ? "text-white" : "text-indigo-600"
                            }`}
                            strokeWidth={3}
                          />
                        </div>
                        <span
                          className={`text-sm ${
                            plan.popular
                              ? "text-white font-medium"
                              : "text-gray-700"
                          }`}
                        >
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              );
            })}
          </div>

          {/* Bottom Note */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-center mt-12 text-base text-gray-600"
          >
            All paid plans include a 14-day money-back guarantee. No credit card required for Free plan.
          </motion.p>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-20 px-6 md:px-12 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-black text-gray-900 mb-4">
              Compare Plans
            </h2>
            <p className="text-xl text-gray-600">
              See exactly what's included in each plan
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-4 gap-4 p-6 bg-gray-50 border-b border-gray-200">
              <div className="col-span-1">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
                  Features
                </h3>
              </div>
              <div className="text-center">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
                  Free
                </h3>
              </div>
              <div className="text-center">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
                  Starter
                </h3>
              </div>
              <div className="text-center">
                <h3 className="text-sm font-bold text-indigo-600 uppercase tracking-wide">
                  Pro
                </h3>
              </div>
            </div>

            {/* Table Body */}
            {COMPARISON_FEATURES.map((section, sectionIndex) => (
              <div key={sectionIndex} className="border-b border-gray-200 last:border-0">
                {/* Category Header */}
                <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
                  <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                    {section.category}
                  </h4>
                </div>

                {/* Features */}
                {section.features.map((feature, featureIndex) => (
                  <div
                    key={featureIndex}
                    className="grid grid-cols-4 gap-4 p-6 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors"
                  >
                    <div className="col-span-1">
                      <p className="text-sm font-medium text-gray-900">
                        {feature.name}
                      </p>
                    </div>

                    {["free", "starter", "pro"].map((plan) => (
                      <div key={plan} className="text-center flex items-center justify-center">
                        {typeof feature[plan] === "boolean" ? (
                          feature[plan] ? (
                            <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                              <Check className="w-4 h-4 text-green-600" strokeWidth={3} />
                            </div>
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
                              <X className="w-4 h-4 text-gray-400" strokeWidth={2} />
                            </div>
                          )
                        ) : (
                          <span className={`text-sm font-semibold ${
                            plan === "pro" ? "text-indigo-600" : "text-gray-700"
                          }`}>
                            {feature[plan]}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-6 md:px-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-black text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-gray-600">
              Everything you need to know about our pricing
            </p>
          </div>

          <div className="space-y-4">
            {FAQS.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                className="bg-white border-2 border-gray-200 rounded-2xl overflow-hidden hover:border-indigo-200 transition-colors"
              >
                <button
                  onClick={() => setOpenFaqIndex(openFaqIndex === index ? null : index)}
                  className="w-full px-6 py-5 flex items-center justify-between text-left"
                >
                  <h3 className="text-lg font-bold text-gray-900 pr-4">
                    {faq.question}
                  </h3>
                  <ChevronDown
                    className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform duration-300 ${
                      openFaqIndex === index ? "rotate-180" : ""
                    }`}
                  />
                </button>

                <div
                  className={`overflow-hidden transition-all duration-300 ${
                    openFaqIndex === index ? "max-h-96" : "max-h-0"
                  }`}
                >
                  <div className="px-6 pb-5 text-gray-600 leading-relaxed">
                    {faq.answer}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Still have questions CTA */}
          <div className="mt-16 text-center">
            <p className="text-gray-600 mb-4">
              Still have questions?
            </p>
            <Link
              href="mailto:support@liteevent.com"
              className="inline-flex items-center gap-2 text-indigo-600 font-semibold hover:text-indigo-700 transition-colors"
            >
              Contact our support team
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 px-6 md:px-12 bg-gradient-to-br from-indigo-600 to-violet-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl sm:text-5xl font-black text-white mb-6">
            Ready to create amazing events?
          </h2>
          <p className="text-xl text-indigo-100 mb-10 max-w-2xl mx-auto">
            Join thousands of event organizers who trust LiteEvent to power their events.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="px-8 py-4 bg-white text-indigo-600 rounded-xl font-bold text-lg hover:bg-gray-50 transition-colors shadow-xl hover:shadow-2xl hover:-translate-y-0.5 transform duration-300"
            >
              Get Started Free
            </Link>
            <Link
              href="/#features"
              className="px-8 py-4 bg-transparent border-2 border-white text-white rounded-xl font-bold text-lg hover:bg-white/10 transition-colors"
            >
              View Features
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
