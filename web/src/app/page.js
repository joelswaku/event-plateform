import { Suspense } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { FREE_TEMPLATES, PREMIUM_TEMPLATES, WEDDING_TEMPLATES } from "@/lib/weddingTemplates";
import { Navbar, HeroSection, FeaturesGrid, CtaSection } from "@/components/landing";

/* ─── lazy-load every below-fold section ───────────────────────────────────── */
const StatsBar          = dynamic(() => import("@/components/landing/StatsBar"),          { ssr: true });
const TemplatesSection  = dynamic(() => import("@/components/landing/TemplatesSection"),  { ssr: true });
const HowItWorks        = dynamic(() => import("@/components/landing/HowItWorks"),        { ssr: true });
const PricingSection    = dynamic(() => import("@/components/landing/PricingSection"),    { ssr: true });
const TestimonialsSection = dynamic(() => import("@/components/landing/TestimonialsSection"), { ssr: true });
const Footer            = dynamic(() => import("@/components/landing/Footer"),            { ssr: true });

/* ─── static data (server-side only — no bundle cost) ──────────────────────── */
const STATS = [
  { value: "12,000+", label: "Weddings Created" },
  { value: "30",      label: "Premium Templates" },
  { value: "4.9★",   label: "Average Rating"    },
  { value: "99%",     label: "Uptime SLA"        },
];

const TESTIMONIALS = [
  {
    name: "Emma & Lucas",
    location: "London, UK",
    avatar: "https://images.unsplash.com/photo-1520854221256-17451cc331bf?w=80&q=80&auto=format&fit=crop&facepad=2",
    text: "We chose the Royal Vintage template and every single guest told us it was the most beautiful wedding page they'd ever seen. Set up in under an hour!",
    template: "Royal Vintage",
  },
  {
    name: "Sofia & Marco",
    location: "Bali, Indonesia",
    avatar: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=80&q=80&auto=format&fit=crop",
    text: "Tropical Destination was perfect for our beach wedding. The RSVP tool alone saved us days of back-and-forth emails.",
    template: "Tropical Destination",
  },
  {
    name: "Aisha & James",
    location: "New York, USA",
    avatar: "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=80&q=80&auto=format&fit=crop",
    text: "Elegant Black Tie matched our vision exactly. The builder is so intuitive we were live within 45 minutes. Absolutely worth premium.",
    template: "Elegant Black Tie",
  },
];

const HOW_IT_WORKS = [
  { step: "01", title: "Pick a Template",      desc: "Browse 30 handcrafted designs and preview in one click." },
  { step: "02", title: "Personalise",           desc: "Add your story, photos, venue details, and countdown timer." },
  { step: "03", title: "Share & Collect RSVPs", desc: "Send one beautiful link — no app downloads required for guests." },
];

const SHOWCASE = WEDDING_TEMPLATES.slice(0, 8);

/* ─── shared skeleton ───────────────────────────────────────────────────────── */
function SectionSkeleton({ height = "h-64" }) {
  return <div className={`w-full ${height} bg-gray-50 animate-pulse`} />;
}

/* ─── page ──────────────────────────────────────────────────────────────────── */
export default function LandingPage() {
  return (
    <main className="min-h-screen">
      <Navbar />

      {/* Hero: above the fold — no lazy load */}
      <HeroSection showcase={SHOWCASE} testimonials={TESTIMONIALS} />

      {/* StatsBar: just below fold */}
      <Suspense fallback={<SectionSkeleton height="h-32" />}>
        <StatsBar stats={STATS} />
      </Suspense>

      {/* Templates: heavy section — lazy */}
      <Suspense fallback={<SectionSkeleton height="h-[600px]" />}>
        <TemplatesSection
          freeTemplates={FREE_TEMPLATES}
          premiumTemplates={PREMIUM_TEMPLATES}
        />
      </Suspense>

      {/* Features: client-side animations — lazy */}
      <Suspense fallback={<SectionSkeleton height="h-[480px]" />}>
        <FeaturesGrid />
      </Suspense>

      {/* How it works */}
      <Suspense fallback={<SectionSkeleton height="h-80" />}>
        <HowItWorks steps={HOW_IT_WORKS} />
      </Suspense>

      {/* Pricing */}
      <Suspense fallback={<SectionSkeleton height="h-[560px]" />}>
        <PricingSection />
      </Suspense>

      {/* Testimonials */}
      <Suspense fallback={<SectionSkeleton height="h-80" />}>
        <TestimonialsSection testimonials={TESTIMONIALS} />
      </Suspense>

      {/* CTA: above-fold weight is fine, but keep consistent */}
      <CtaSection />

      <Suspense fallback={<SectionSkeleton height="h-24" />}>
        <Footer />
      </Suspense>
    </main>
  );
}
