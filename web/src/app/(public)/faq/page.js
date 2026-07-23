"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Script from "next/script";
import { motion } from "framer-motion";
import { Search, ChevronDown, HelpCircle, Mail, MessageCircle, Book } from "lucide-react";
import { Navbar, Footer } from "@/components/landing";

// FAQ Data organized by category
const FAQ_DATA = [
  {
    category: "Getting Started",
    icon: HelpCircle,
    questions: [
      {
        question: "How do I create my first event?",
        answer: "Creating your first event is easy! After signing up, click 'Create Event' from your dashboard. Choose a template, add your event details (name, date, location), customize the design, and publish. The entire process takes less than 10 minutes."
      },
      {
        question: "Do I need technical skills to use LiteEvent?",
        answer: "No technical skills required! LiteEvent is designed to be user-friendly. Our drag-and-drop editor, pre-built templates, and intuitive interface make it easy for anyone to create professional events without coding knowledge."
      },
      {
        question: "Can I try LiteEvent before committing to a paid plan?",
        answer: "Absolutely! Our Free plan is available forever with no credit card required. You can create 1 event with up to 50 guests to test all the basic features. Upgrade anytime as your needs grow."
      },
      {
        question: "How long does it take to set up an event?",
        answer: "Most users complete their first event setup in 5-15 minutes. Simply select a template, fill in your event details, upload images, customize colors, and publish. You can always edit and refine later."
      },
      {
        question: "What happens after I create an event?",
        answer: "Once published, your event gets a unique URL you can share with guests. You'll have access to a full dashboard to manage RSVPs, sell tickets, track analytics, send invitations, and check-in guests on event day."
      },
      {
        question: "Can I import guest lists from a spreadsheet?",
        answer: "Yes! You can import guests from CSV or Excel files. Simply prepare your spreadsheet with columns for name, email, and phone number, then use the bulk import feature in your event's guest management section."
      }
    ]
  },
  {
    category: "Events & Tickets",
    icon: Book,
    questions: [
      {
        question: "What types of events can I create?",
        answer: "LiteEvent supports all event types: weddings, conferences, birthdays, concerts, fundraisers, workshops, networking events, festivals, corporate events, and more. Choose from templates designed specifically for your event type."
      },
      {
        question: "Can I sell tickets through LiteEvent?",
        answer: "Yes! Our Starter and Pro plans include integrated ticketing. Create multiple ticket types (Early Bird, VIP, General Admission), set prices, add discounts, and accept payments securely through Stripe. We charge a small platform fee (5% for Starter, 2% for Pro)."
      },
      {
        question: "How do I set up different ticket types and pricing?",
        answer: "In your event settings, go to Ticketing and click 'Add Ticket Type'. Create multiple tiers (Free, Early Bird, VIP, etc.), set quantities, prices, descriptions, and sale periods. You can also create promo codes for discounts."
      },
      {
        question: "Can I offer early bird pricing or discounts?",
        answer: "Yes! Create time-limited ticket types for early bird pricing, or generate promo codes for percentage or fixed-amount discounts. Set validity periods and usage limits to control how discounts are applied."
      },
      {
        question: "Is there a limit to how many tickets I can sell?",
        answer: "Free plan: no ticketing. Starter plan: unlimited tickets with 5% fee. Pro plan: unlimited tickets with 2% fee. Set your own capacity limits per event or ticket type based on your venue constraints."
      },
      {
        question: "Can I create private or invite-only events?",
        answer: "Absolutely! Toggle your event to 'Private' mode, and it will only be accessible via direct link or invitation. You can also require a password or manually approve each RSVP before confirming guest access."
      },
      {
        question: "How do I customize my event page design?",
        answer: "Use our visual builder to customize colors, fonts, layouts, and sections. Add your logo, upload hero images, rearrange content blocks, and add custom text. Pro users can also inject custom CSS for complete control."
      }
    ]
  },
  {
    category: "Guest Management",
    icon: MessageCircle,
    questions: [
      {
        question: "How does RSVP tracking work?",
        answer: "When guests visit your event page, they can RSVP by filling out a form. You'll receive instant notifications and see real-time updates in your dashboard. Track who's attending, declined, or pending, and export guest lists anytime."
      },
      {
        question: "Can guests bring plus-ones?",
        answer: "Yes! Enable the 'Allow Plus-Ones' option in your RSVP settings. Guests can indicate how many people they're bringing. You can set a maximum limit per guest or require approval for plus-ones."
      },
      {
        question: "How do I check guests in at the event?",
        answer: "Use our mobile app or web scanner to scan guest QR codes at the entrance. Each ticket/RSVP includes a unique QR code. Scan to instantly mark guests as checked-in, view ticket details, and prevent duplicate entries."
      },
      {
        question: "Can I send mass emails to all guests?",
        answer: "Yes! Use the communication tools in your event dashboard to send announcements, reminders, or updates to all attendees, specific ticket types, or custom segments. Track open rates and engagement."
      },
      {
        question: "What if a guest needs to cancel or transfer their ticket?",
        answer: "Guests can cancel directly from their confirmation email if you enable self-service cancellations. For ticket transfers, you can manually reassign tickets in your dashboard, or enable guest-initiated transfers (Pro plan)."
      }
    ]
  },
  {
    category: "Billing & Plans",
    icon: Mail,
    questions: [
      {
        question: "How much does LiteEvent cost?",
        answer: "Free plan: $0 forever for 1 event and 50 guests. Starter plan: $19/month for 5 events and 200 guests per event. Pro plan: $49/month for unlimited events and guests. Annual billing saves 20%. No hidden fees."
      },
      {
        question: "What payment methods do you accept?",
        answer: "We accept all major credit cards (Visa, Mastercard, American Express, Discover) and debit cards. Payments are processed securely through Stripe. You can also pay via PayPal on annual plans."
      },
      {
        question: "Can I upgrade or downgrade my plan?",
        answer: "Yes, anytime! Upgrades take effect immediately. Downgrades take effect at the end of your current billing cycle. We'll prorate charges when upgrading mid-cycle, and you'll receive credit for unused time when downgrading."
      },
      {
        question: "What's your refund policy?",
        answer: "We offer a 14-day money-back guarantee on all paid plans. If you're not satisfied within 14 days of purchase, contact support for a full refund. Refunds are not available for annual plans after 14 days."
      },
      {
        question: "Do you offer discounts for nonprofits or educational institutions?",
        answer: "Yes! Registered nonprofits and educational institutions receive 50% off all paid plans. Contact support@liteevent.com with proof of nonprofit status (501(c)(3) letter) or .edu email for verification."
      },
      {
        question: "What happens if I exceed my plan limits?",
        answer: "If you reach your event or guest limit, you'll be prompted to upgrade. Your existing events remain active, but you won't be able to create new ones until you upgrade or delete old events. No surprise charges."
      }
    ]
  },
  {
    category: "Technical Support",
    icon: HelpCircle,
    questions: [
      {
        question: "Is there a mobile app?",
        answer: "Yes! Download the LiteEvent mobile app for iOS and Android. Manage events, check-in guests, scan tickets, view real-time analytics, and respond to RSVPs on the go. Available for all plan types."
      },
      {
        question: "What browsers are supported?",
        answer: "LiteEvent works on all modern browsers: Chrome, Firefox, Safari, Edge, and Opera. For the best experience, we recommend using the latest version of Chrome or Safari. Mobile browsers are fully supported."
      },
      {
        question: "Can I integrate LiteEvent with other tools?",
        answer: "Pro plan includes API access and integrations with popular tools like Zapier, Google Calendar, Mailchimp, Slack, Zoom, and Salesforce. Use webhooks to connect with your existing workflow and automate tasks."
      },
      {
        question: "What if I encounter a bug or technical issue?",
        answer: "Contact our support team via email (support@liteevent.com) or live chat. Free users get email support within 48 hours. Starter users get priority support within 12 hours. Pro users get dedicated support within 4 hours."
      },
      {
        question: "Do you offer onboarding or training?",
        answer: "Yes! All users have access to our help center, video tutorials, and documentation. Pro users receive a complimentary 30-minute onboarding call with a specialist to set up their first event and answer questions."
      }
    ]
  },
  {
    category: "Privacy & Security",
    icon: HelpCircle,
    questions: [
      {
        question: "How is my data protected?",
        answer: "We use bank-level encryption (SSL/TLS) to protect data in transit and at rest. All payment information is processed by PCI-compliant payment processors (Stripe). We never store credit card details on our servers."
      },
      {
        question: "Is LiteEvent GDPR compliant?",
        answer: "Yes! We are fully GDPR compliant. You own your data and can export or delete it anytime. We provide tools for guest consent management, data access requests, and right to be forgotten. See our Privacy Policy for details."
      },
      {
        question: "Can I export my event data?",
        answer: "Absolutely! Export guest lists, RSVP data, ticket sales, and analytics in CSV or JSON format anytime. Your data is portable and you can take it with you if you decide to leave LiteEvent."
      },
      {
        question: "What happens to my data if I cancel my account?",
        answer: "Your data remains accessible in read-only mode for 30 days after cancellation. During this time, you can export everything. After 30 days, your data is permanently deleted from our servers. We can provide a full data export upon request."
      }
    ]
  }
];

export default function FAQPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [openItems, setOpenItems] = useState({});

  // Flatten all questions for search
  const allQuestions = useMemo(() => {
    return FAQ_DATA.flatMap((category) =>
      category.questions.map((q) => ({
        ...q,
        category: category.category,
      }))
    );
  }, []);

  // Filter questions based on search query
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return FAQ_DATA;

    const query = searchQuery.toLowerCase();

    return FAQ_DATA.map((category) => ({
      ...category,
      questions: category.questions.filter(
        (q) =>
          q.question.toLowerCase().includes(query) ||
          q.answer.toLowerCase().includes(query)
      ),
    })).filter((category) => category.questions.length > 0);
  }, [searchQuery]);

  // Toggle accordion item
  const toggleItem = (categoryIndex, questionIndex) => {
    const key = `${categoryIndex}-${questionIndex}`;
    setOpenItems((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Check if item is open
  const isOpen = (categoryIndex, questionIndex) => {
    const key = `${categoryIndex}-${questionIndex}`;
    return openItems[key] || false;
  };

  // Generate FAQ Schema for SEO
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: allQuestions.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  const totalQuestions = allQuestions.length;

  return (
    <>
      {/* JSON-LD FAQ Schema */}
      <Script
        id="faq-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <main className="min-h-screen bg-white">
        <Navbar />

        {/* Hero Section */}
        <section className="pt-32 pb-16 px-6 md:px-12 bg-gradient-to-br from-indigo-50 via-white to-violet-50">
          <div className="max-w-5xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-100 border border-indigo-200 mb-6">
                <HelpCircle className="w-4 h-4 text-indigo-600" />
                <span className="text-sm font-semibold text-indigo-700">
                  Help Center
                </span>
              </div>

              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-gray-900 mb-6 tracking-tight">
                Frequently Asked Questions
              </h1>

              <p className="text-xl sm:text-2xl text-gray-600 max-w-3xl mx-auto mb-12">
                Everything you need to know about LiteEvent. Can't find what you're looking for?{" "}
                <Link
                  href="mailto:support@liteevent.com"
                  className="text-indigo-600 hover:text-indigo-700 font-semibold underline"
                >
                  Contact our support team
                </Link>
              </p>

              {/* Search Bar */}
              <div className="max-w-2xl mx-auto relative">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search for answers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-14 pr-6 py-5 text-lg rounded-2xl border-2 border-gray-200 focus:border-indigo-500 focus:outline-none transition-colors bg-white shadow-lg"
                />
              </div>

              {searchQuery && (
                <p className="mt-4 text-sm text-gray-600">
                  Found {filteredData.reduce((acc, cat) => acc + cat.questions.length, 0)} results
                  {searchQuery && ` for "${searchQuery}"`}
                </p>
              )}
            </motion.div>
          </div>
        </section>

        {/* FAQ Categories */}
        <section className="py-20 px-6 md:px-12">
          <div className="max-w-5xl mx-auto">
            {filteredData.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-16"
              >
                <HelpCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  No results found
                </h3>
                <p className="text-gray-600 mb-6">
                  Try a different search term or browse all questions below
                </p>
                <button
                  onClick={() => setSearchQuery("")}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
                >
                  Clear Search
                </button>
              </motion.div>
            ) : (
              <div className="space-y-16">
                {filteredData.map((category, categoryIndex) => {
                  const Icon = category.icon;

                  return (
                    <motion.div
                      key={category.category}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: categoryIndex * 0.1 }}
                    >
                      {/* Category Header */}
                      <div className="flex items-center gap-3 mb-8">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h2 className="text-3xl font-black text-gray-900">
                            {category.category}
                          </h2>
                          <p className="text-sm text-gray-600">
                            {category.questions.length} question{category.questions.length !== 1 ? "s" : ""}
                          </p>
                        </div>
                      </div>

                      {/* Questions */}
                      <div className="space-y-4">
                        {category.questions.map((faq, questionIndex) => {
                          const itemIsOpen = isOpen(categoryIndex, questionIndex);

                          return (
                            <motion.div
                              key={questionIndex}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.3, delay: questionIndex * 0.05 }}
                              className="bg-white border-2 border-gray-200 rounded-2xl overflow-hidden hover:border-indigo-200 transition-all hover:shadow-lg"
                            >
                              <button
                                onClick={() => toggleItem(categoryIndex, questionIndex)}
                                className="w-full px-6 py-5 flex items-center justify-between text-left group"
                              >
                                <h3 className="text-lg font-bold text-gray-900 pr-4 group-hover:text-indigo-600 transition-colors">
                                  {faq.question}
                                </h3>
                                <ChevronDown
                                  className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform duration-300 group-hover:text-indigo-600 ${
                                    itemIsOpen ? "rotate-180" : ""
                                  }`}
                                />
                              </button>

                              <div
                                className={`overflow-hidden transition-all duration-300 ${
                                  itemIsOpen ? "max-h-96" : "max-h-0"
                                }`}
                              >
                                <div className="px-6 pb-5 text-gray-700 leading-relaxed">
                                  {faq.answer}
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* Quick Stats */}
        {!searchQuery && (
          <section className="py-16 px-6 md:px-12 bg-gradient-to-br from-gray-50 to-indigo-50">
            <div className="max-w-5xl mx-auto">
              <div className="grid sm:grid-cols-3 gap-8 text-center">
                <div>
                  <div className="text-5xl font-black text-indigo-600 mb-2">
                    {totalQuestions}+
                  </div>
                  <p className="text-gray-600 font-semibold">Questions Answered</p>
                </div>
                <div>
                  <div className="text-5xl font-black text-indigo-600 mb-2">
                    6
                  </div>
                  <p className="text-gray-600 font-semibold">Categories</p>
                </div>
                <div>
                  <div className="text-5xl font-black text-indigo-600 mb-2">
                    24/7
                  </div>
                  <p className="text-gray-600 font-semibold">Support Available</p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Still Have Questions CTA */}
        <section className="py-20 px-6 md:px-12 bg-white">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="bg-gradient-to-br from-indigo-600 to-violet-600 rounded-3xl p-12 text-center text-white shadow-2xl"
            >
              <h2 className="text-4xl sm:text-5xl font-black mb-4">
                Still have questions?
              </h2>
              <p className="text-xl text-indigo-100 mb-8 max-w-2xl mx-auto">
                Can't find the answer you're looking for? Our friendly support team is here to help.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="mailto:support@liteevent.com"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-white text-indigo-600 rounded-xl font-bold text-lg hover:bg-gray-50 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-0.5 transform duration-300"
                >
                  <Mail className="w-5 h-5" />
                  Email Support
                </Link>
                <Link
                  href="/team"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-transparent border-2 border-white text-white rounded-xl font-bold text-lg hover:bg-white/10 transition-colors"
                >
                  <MessageCircle className="w-5 h-5" />
                  Live Chat
                </Link>
              </div>

              <div className="mt-8 pt-8 border-t border-indigo-400">
                <p className="text-indigo-100 mb-4">
                  Or explore more resources
                </p>
                <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
                  <Link
                    href="/features"
                    className="text-white hover:text-indigo-100 font-semibold underline"
                  >
                    Features
                  </Link>
                  <Link
                    href="/pricing"
                    className="text-white hover:text-indigo-100 font-semibold underline"
                  >
                    Pricing
                  </Link>
                  <Link
                    href="/about"
                    className="text-white hover:text-indigo-100 font-semibold underline"
                  >
                    About Us
                  </Link>
                  <Link
                    href="/privacy-policy"
                    className="text-white hover:text-indigo-100 font-semibold underline"
                  >
                    Privacy Policy
                  </Link>
                  <Link
                    href="/terms"
                    className="text-white hover:text-indigo-100 font-semibold underline"
                  >
                    Terms of Service
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        <Footer />
      </main>
    </>
  );
}
