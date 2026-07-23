import { Suspense } from "react";
import dynamic from "next/dynamic";
import Script from "next/script";
import { Navbar, HeroSection, FeaturesGrid, CtaSection } from "@/components/landing";
import { FREE_TEMPLATES, PREMIUM_TEMPLATES } from "@/lib/styleTemplates";
import { generateMetadata as genMeta, PAGE_METADATA } from "@/lib/seo";

/* ─── SEO Metadata ──────────────────────────────────────────── */
export const metadata = genMeta(PAGE_METADATA.home);

/* ─── lazy-load sections ───────────────────────────────────── */
const StatsBar           = dynamic(() => import("@/components/landing/StatsBar"), { ssr: true });
const TemplatesSection   = dynamic(() => import("@/components/landing/TemplatesSection"), { ssr: true });
const AppDownloadSection = dynamic(() => import("@/components/landing/AppDownloadSection"), { ssr: true });
const PlannerSection     = dynamic(() => import("@/components/landing/PlannerSection"), { ssr: true });
const HowItWorks         = dynamic(() => import("@/components/landing/HowItWorks"), { ssr: true });
const PricingSection     = dynamic(() => import("@/components/landing/PricingSection"), { ssr: true });
const TestimonialsSection = dynamic(() => import("@/components/landing/TestimonialsSection"), { ssr: true });
const Footer             = dynamic(() => import("@/components/landing/Footer"), { ssr: true });

/* ─── static data ──────────────────────────────────────────── */
const TESTIMONIALS = [
  {
    name: "Emma Johnson",
    role: "Event Organizer",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&q=80",
    text: "LiteEvent made organizing our conference incredibly easy. The mobile app is a game-changer!",
    rating: 5,
  },
  {
    name: "Michael Chen",
    role: "Wedding Planner",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&q=80",
    text: "Best event management platform I've used. The templates are beautiful and the RSVP system is flawless.",
    rating: 5,
  },
  {
    name: "Sarah Williams",
    role: "Festival Director",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&q=80",
    text: "From ticket sales to check-ins, everything just works. Our attendees love the mobile experience.",
    rating: 5,
  },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Choose a Template",
    desc: "Browse our collection of professionally designed templates and pick the perfect one for your event."
  },
  {
    step: "02",
    title: "Customize & Publish",
    desc: "Add your event details, photos, and branding. Publish your event page in minutes."
  },
  {
    step: "03",
    title: "Manage Everything",
    desc: "Track RSVPs, sell tickets, and check-in guests — all from your dashboard or mobile app."
  },
];

/* ─── skeleton ──────────────────────────────────────────────── */
function SectionSkeleton({ height = "h-64" }) {
  return <div className={`w-full ${height} bg-gray-50 dark:bg-gray-900 animate-pulse`} />;
}

/* ─── Structured Data (JSON-LD) ────────────────────────────── */
const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "LiteEvent",
  url: "https://liteevent.com",
  logo: "https://liteevent.com/lite.png",
  description: "Professional event management platform for creating, managing, and hosting events with ticketing, RSVP, and beautiful templates.",
  sameAs: [
    // Add your social media links here
    // "https://twitter.com/liteevent",
    // "https://facebook.com/liteevent",
    // "https://instagram.com/liteevent",
  ],
  contactPoint: {
    "@type": "ContactPoint",
    email: "support@liteevent.com",
    contactType: "Customer Support",
  },
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "LiteEvent",
  url: "https://liteevent.com",
  description: "Professional event management platform",
  potentialAction: {
    "@type": "SearchAction",
    target: "https://liteevent.com/search?q={search_term_string}",
    "query-input": "required name=search_term_string",
  },
};

const softwareSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "LiteEvent",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web, iOS, Android",
  offers: {
    "@type": "AggregateOffer",
    lowPrice: "0",
    highPrice: "49",
    priceCurrency: "USD",
    priceSpecification: [
      {
        "@type": "UnitPriceSpecification",
        price: "0",
        priceCurrency: "USD",
        name: "Free Plan",
      },
      {
        "@type": "UnitPriceSpecification",
        price: "19",
        priceCurrency: "USD",
        name: "Starter Plan",
      },
      {
        "@type": "UnitPriceSpecification",
        price: "49",
        priceCurrency: "USD",
        name: "Pro Plan",
      },
    ],
  },
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.9",
    ratingCount: "500",
  },
};

/* ─── page ──────────────────────────────────────────────────── */
export default function LandingPage() {
  return (
    <>
      {/* JSON-LD Structured Data */}
      <Script
        id="organization-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <Script
        id="website-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <Script
        id="software-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }}
      />

      <main className="min-h-screen">
        <Navbar />

      {/* Hero: above the fold — no lazy load */}
      <HeroSection />

      {/* StatsBar with real data from API */}
      <Suspense fallback={<SectionSkeleton height="h-32" />}>
        <StatsBar />
      </Suspense>

      {/* Templates - Real templates from database */}
      <Suspense fallback={<SectionSkeleton height="h-[600px]" />}>
        <TemplatesSection freeTemplates={FREE_TEMPLATES} premiumTemplates={PREMIUM_TEMPLATES} />
      </Suspense>

      {/* Features */}
      <Suspense fallback={<SectionSkeleton height="h-[480px]" />}>
        <FeaturesGrid />
      </Suspense>

      {/* Planner Section - NEW */}
      <Suspense fallback={<SectionSkeleton height="h-[600px]" />}>
        <PlannerSection />
      </Suspense>

      {/* How it works */}
      <Suspense fallback={<SectionSkeleton height="h-80" />}>
        <HowItWorks steps={HOW_IT_WORKS} />
      </Suspense>

      {/* App Download Section */}
      <Suspense fallback={<SectionSkeleton height="h-[600px]" />}>
        <AppDownloadSection />
      </Suspense>

      {/* Testimonials */}
      <Suspense fallback={<SectionSkeleton height="h-80" />}>
        <TestimonialsSection testimonials={TESTIMONIALS} />
      </Suspense>

      {/* Pricing with real API data */}
      <Suspense fallback={<SectionSkeleton height="h-[560px]" />}>
        <PricingSection />
      </Suspense>

      {/* CTA */}
      <CtaSection />

      <Suspense fallback={<SectionSkeleton height="h-24" />}>
        <Footer />
      </Suspense>
    </main>
    </>
  );
}
