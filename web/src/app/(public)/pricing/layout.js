import { generateMetadata as genMeta, PAGE_METADATA, generateFAQSchema } from "@/lib/seo";
import Script from "next/script";

// SEO Metadata
export const metadata = genMeta(PAGE_METADATA.pricing);

// FAQ Schema for structured data
const faqSchema = generateFAQSchema([
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
]);

// Product Schema
const productSchema = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: "LiteEvent",
  description: "Professional event management platform for creating, managing, and hosting events",
  brand: {
    "@type": "Brand",
    name: "LiteEvent"
  },
  offers: [
    {
      "@type": "Offer",
      name: "Free Plan",
      price: "0",
      priceCurrency: "USD",
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        price: "0",
        priceCurrency: "USD",
        referenceQuantity: {
          "@type": "QuantityValue",
          value: "1",
          unitText: "month"
        }
      }
    },
    {
      "@type": "Offer",
      name: "Starter Plan",
      price: "19",
      priceCurrency: "USD",
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        price: "19",
        priceCurrency: "USD",
        referenceQuantity: {
          "@type": "QuantityValue",
          value: "1",
          unitText: "month"
        }
      }
    },
    {
      "@type": "Offer",
      name: "Pro Plan",
      price: "49",
      priceCurrency: "USD",
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        price: "49",
        priceCurrency: "USD",
        referenceQuantity: {
          "@type": "QuantityValue",
          value: "1",
          unitText: "month"
        }
      }
    }
  ]
};

export default function PricingLayout({ children }) {
  return (
    <>
      {/* JSON-LD Structured Data */}
      <Script
        id="faq-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <Script
        id="product-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      {children}
    </>
  );
}
