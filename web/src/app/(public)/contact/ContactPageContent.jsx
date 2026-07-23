"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import {
  Mail,
  Clock,
  BookOpen,
  Send,
  CheckCircle2,
  MessageSquare,
  HelpCircle,
  ArrowRight,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { Navbar, Footer } from "@/components/landing";
import { api } from "@/lib/api";

const CONTACT_INFO = [
  {
    icon: Mail,
    title: "Email Support",
    description: "Get help from our support team",
    value: "support@liteevent.com",
    link: "mailto:support@liteevent.com",
  },
  {
    icon: Clock,
    title: "Response Time",
    description: "We typically respond within",
    value: "24 hours",
    highlight: true,
  },
  {
    icon: BookOpen,
    title: "Documentation",
    description: "Browse our help center",
    value: "Help Center",
    link: "/help",
  },
];


const FAQ_TOPICS = [
  { icon: HelpCircle, title: "Getting Started", description: "Learn the basics of LiteEvent", href: "/help/getting-started" },
  { icon: MessageSquare, title: "Event Management", description: "Tips for organizing events", href: "/help/event-management" },
  { icon: CheckCircle2, title: "Ticketing & RSVP", description: "Manage tickets and guests", href: "/help/ticketing" },
];

export default function ContactPageContent() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    setIsSubmitting(true);

    try {
      await api.post("/contact", data);

      toast.success(
        "Message sent successfully! We'll get back to you within 24 hours.",
        {
          duration: 5000,
          icon: "✉️",
        }
      );

      reset();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to send message. Please try again.",
        {
          duration: 4000,
        }
      );
    } finally {
      setIsSubmitting(false);
    }
  };

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
                We're Here to Help
              </span>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-gray-900 mb-6 tracking-tight">
              Get in Touch
            </h1>

            <p className="text-xl sm:text-2xl text-gray-600 max-w-3xl mx-auto mb-12">
              Have a question or need assistance? Our team is ready to help you create amazing events.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Contact Info Cards */}
      <section className="py-16 px-6 md:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-6 mb-20">
            {CONTACT_INFO.map((info, index) => {
              const Icon = info.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className={`p-6 rounded-2xl border-2 transition-all duration-300 ${
                    info.highlight
                      ? "bg-gradient-to-br from-indigo-50 to-violet-50 border-indigo-200 shadow-lg"
                      : "bg-white border-gray-200 hover:border-indigo-200 hover:shadow-lg"
                  }`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
                    info.highlight
                      ? "bg-gradient-to-br from-indigo-600 to-violet-600"
                      : "bg-gray-100"
                  }`}>
                    <Icon className={`w-6 h-6 ${
                      info.highlight ? "text-white" : "text-gray-700"
                    }`} />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    {info.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">
                    {info.description}
                  </p>
                  {info.link ? (
                    <Link
                      href={info.link}
                      className="text-base font-semibold text-indigo-600 hover:text-indigo-700 transition-colors flex items-center gap-1"
                    >
                      {info.value}
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  ) : (
                    <p className={`text-base font-semibold ${
                      info.highlight ? "text-indigo-600" : "text-gray-900"
                    }`}>
                      {info.value}
                    </p>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Contact Form & Info Grid */}
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="bg-white border-2 border-gray-200 rounded-3xl p-8 shadow-xl"
            >
              <div className="mb-8">
                <h2 className="text-3xl font-black text-gray-900 mb-3">
                  Send us a message
                </h2>
                <p className="text-gray-600">
                  Fill out the form below and we'll get back to you as soon as possible.
                </p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Name Field */}
                <div>
                  <label htmlFor="name" className="block text-sm font-semibold text-gray-900 mb-2">
                    Name *
                  </label>
                  <input
                    id="name"
                    type="text"
                    {...register("name", {
                      required: "Name is required",
                      minLength: {
                        value: 2,
                        message: "Name must be at least 2 characters",
                      },
                    })}
                    className={`w-full px-4 py-3 rounded-xl border-2 transition-all outline-none ${
                      errors.name
                        ? "border-red-500 focus:ring-2 focus:ring-red-500/20"
                        : "border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    }`}
                    placeholder="Your full name"
                  />
                  {errors.name && (
                    <p className="text-red-500 text-sm mt-1.5 flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-red-500"></span>
                      {errors.name.message}
                    </p>
                  )}
                </div>

                {/* Email Field */}
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-gray-900 mb-2">
                    Email *
                  </label>
                  <input
                    id="email"
                    type="email"
                    {...register("email", {
                      required: "Email is required",
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: "Please enter a valid email address",
                      },
                    })}
                    className={`w-full px-4 py-3 rounded-xl border-2 transition-all outline-none ${
                      errors.email
                        ? "border-red-500 focus:ring-2 focus:ring-red-500/20"
                        : "border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    }`}
                    placeholder="you@example.com"
                  />
                  {errors.email && (
                    <p className="text-red-500 text-sm mt-1.5 flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-red-500"></span>
                      {errors.email.message}
                    </p>
                  )}
                </div>

                {/* Subject Field */}
                <div>
                  <label htmlFor="subject" className="block text-sm font-semibold text-gray-900 mb-2">
                    Subject *
                  </label>
                  <input
                    id="subject"
                    type="text"
                    {...register("subject", {
                      required: "Subject is required",
                      minLength: {
                        value: 5,
                        message: "Subject must be at least 5 characters",
                      },
                    })}
                    className={`w-full px-4 py-3 rounded-xl border-2 transition-all outline-none ${
                      errors.subject
                        ? "border-red-500 focus:ring-2 focus:ring-red-500/20"
                        : "border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    }`}
                    placeholder="How can we help?"
                  />
                  {errors.subject && (
                    <p className="text-red-500 text-sm mt-1.5 flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-red-500"></span>
                      {errors.subject.message}
                    </p>
                  )}
                </div>

                {/* Message Field */}
                <div>
                  <label htmlFor="message" className="block text-sm font-semibold text-gray-900 mb-2">
                    Message *
                  </label>
                  <textarea
                    id="message"
                    rows={6}
                    {...register("message", {
                      required: "Message is required",
                      minLength: {
                        value: 20,
                        message: "Message must be at least 20 characters",
                      },
                    })}
                    className={`w-full px-4 py-3 rounded-xl border-2 transition-all outline-none resize-none ${
                      errors.message
                        ? "border-red-500 focus:ring-2 focus:ring-red-500/20"
                        : "border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    }`}
                    placeholder="Tell us more about your inquiry..."
                  />
                  {errors.message && (
                    <p className="text-red-500 text-sm mt-1.5 flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-red-500"></span>
                      {errors.message.message}
                    </p>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold text-base transition-all duration-300 shadow-lg shadow-indigo-500/20 hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isSubmitting ? (
                    <>
                      <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Send Message
                    </>
                  )}
                </button>
              </form>
            </motion.div>

            {/* Right Side Info */}
            <div className="space-y-8">
              {/* FAQ Quick Links */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="bg-white border-2 border-gray-200 rounded-3xl p-8 shadow-lg"
              >
                <h3 className="text-2xl font-black text-gray-900 mb-4">
                  Quick Help
                </h3>
                <p className="text-gray-600 mb-6">
                  Find answers to common questions in our help center.
                </p>
                <div className="space-y-3">
                  {FAQ_TOPICS.map((topic, index) => {
                    const Icon = topic.icon;
                    return (
                      <Link
                        key={index}
                        href={topic.href}
                        className="flex items-start gap-3 p-4 rounded-xl border border-gray-200 hover:border-indigo-200 hover:bg-indigo-50/50 transition-all duration-300 group"
                      >
                        <div className="w-10 h-10 rounded-lg bg-gray-100 group-hover:bg-indigo-100 flex items-center justify-center flex-shrink-0 transition-colors">
                          <Icon className="w-5 h-5 text-gray-600 group-hover:text-indigo-600 transition-colors" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-bold text-gray-900 mb-0.5">
                            {topic.title}
                          </h4>
                          <p className="text-xs text-gray-600">
                            {topic.description}
                          </p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all flex-shrink-0 mt-2" />
                      </Link>
                    );
                  })}
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 px-6 md:px-12 bg-gradient-to-br from-indigo-600 to-violet-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl sm:text-5xl font-black text-white mb-6">
            Ready to start planning?
          </h2>
          <p className="text-xl text-indigo-100 mb-10 max-w-2xl mx-auto">
            Create your first event for free and see how LiteEvent can transform your event management.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="px-8 py-4 bg-white text-indigo-600 rounded-xl font-bold text-lg hover:bg-gray-50 transition-colors shadow-xl hover:shadow-2xl hover:-translate-y-0.5 transform duration-300"
            >
              Get Started Free
            </Link>
            <Link
              href="/pricing"
              className="px-8 py-4 bg-transparent border-2 border-white text-white rounded-xl font-bold text-lg hover:bg-white/10 transition-colors"
            >
              View Pricing
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
