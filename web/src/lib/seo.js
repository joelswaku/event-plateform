/**
 * SEO Metadata Utilities for LiteEvent
 * Provides consistent metadata across all pages
 */

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://liteevent.com';
const SITE_NAME = 'LiteEvent';
const DEFAULT_OG_IMAGE = `${BASE_URL}/og-image.png`;

/**
 * Generate complete metadata for a page
 */
export function generateMetadata({
  title,
  description,
  keywords = [],
  image = DEFAULT_OG_IMAGE,
  url,
  type = 'website',
  noIndex = false,
}) {
  const fullTitle = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;
  const canonicalUrl = url ? `${BASE_URL}${url}` : BASE_URL;

  return {
    title: fullTitle,
    description,
    keywords: keywords.join(', '),
    authors: [{ name: SITE_NAME }],
    creator: SITE_NAME,
    publisher: SITE_NAME,
    robots: noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true },
    openGraph: {
      type,
      locale: 'en_US',
      url: canonicalUrl,
      siteName: SITE_NAME,
      title: fullTitle,
      description,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: fullTitle,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [image],
    },
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

/**
 * Generate JSON-LD structured data for Organization
 */
export function generateOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: BASE_URL,
    logo: `${BASE_URL}/lite.png`,
    description: 'Professional event management platform for creating, managing, and hosting events.',
    sameAs: [
      // Add social media URLs here when available
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      email: 'support@liteevent.com',
      contactType: 'Customer Support',
    },
  };
}

/**
 * Generate JSON-LD structured data for WebSite
 */
export function generateWebsiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: BASE_URL,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${BASE_URL}/search?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };
}

/**
 * Generate JSON-LD structured data for BreadcrumbList
 */
export function generateBreadcrumbSchema(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url ? `${BASE_URL}${item.url}` : undefined,
    })),
  };
}

/**
 * Generate JSON-LD structured data for Event
 */
export function generateEventSchema({
  name,
  description,
  startDate,
  endDate,
  location,
  image,
  url,
  offers,
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name,
    description,
    startDate,
    endDate,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    location: {
      '@type': 'Place',
      name: location.name,
      address: location.address,
    },
    image: image || DEFAULT_OG_IMAGE,
    url: url ? `${BASE_URL}${url}` : undefined,
    offers: offers
      ? {
          '@type': 'Offer',
          url: url ? `${BASE_URL}${url}` : undefined,
          price: offers.price,
          priceCurrency: offers.currency || 'USD',
          availability: 'https://schema.org/InStock',
        }
      : undefined,
  };
}

/**
 * Generate JSON-LD structured data for FAQPage
 */
export function generateFAQSchema(faqs) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

/**
 * Page-specific metadata presets
 */
export const PAGE_METADATA = {
  home: {
    title: 'LiteEvent - Professional Event Management Platform',
    description:
      'Create, manage, and host unforgettable events with LiteEvent. Professional event management platform featuring ticketing, RSVP, beautiful templates, mobile app, and more.',
    keywords: [
      'event management software',
      'event planning platform',
      'event ticketing',
      'RSVP system',
      'event organizer tools',
      'wedding planning',
      'conference management',
    ],
    url: '/',
  },

  features: {
    title: 'Features - Event Management Tools',
    description:
      'Discover powerful event management features: ticketing, RSVP tracking, QR check-in, guest management, analytics, mobile app, and beautiful templates.',
    keywords: [
      'event management features',
      'ticketing system',
      'RSVP tracking',
      'QR code check-in',
      'guest management',
      'event analytics',
    ],
    url: '/features',
  },

  pricing: {
    title: 'Pricing - Plans & Features',
    description:
      'Affordable event management pricing. Free plan with 1 event. Starter plan at $19/mo for 5 events. Pro plan at $49/mo for unlimited events. Cancel anytime.',
    keywords: [
      'event management pricing',
      'ticketing platform cost',
      'affordable event software',
      'event platform plans',
    ],
    url: '/pricing',
  },

  templates: {
    title: 'Beautiful Event Templates',
    description:
      'Browse professional event templates for weddings, conferences, concerts, birthdays, and more. Customize colors, layouts, and sections to match your brand.',
    keywords: [
      'event templates',
      'event page templates',
      'wedding templates',
      'conference templates',
      'event design',
    ],
    url: '/templates',
  },

  login: {
    title: 'Login to Your Account',
    description: 'Sign in to your LiteEvent account to manage your events, track RSVPs, sell tickets, and check-in guests.',
    keywords: ['login', 'sign in', 'event dashboard'],
    url: '/login',
    noIndex: true, // Don't index auth pages
  },

  signup: {
    title: 'Create Your Free Account',
    description: 'Sign up for LiteEvent and create your first event free. No credit card required. Get started in minutes.',
    keywords: ['signup', 'register', 'create account', 'free event platform'],
    url: '/signup',
  },

  about: {
    title: 'About Us - Our Mission & Story',
    description:
      'Learn about LiteEvent\'s mission to simplify event management. Trusted by 12,000+ events and 500,000+ guests worldwide with a 4.9-star rating.',
    keywords: [
      'about liteevent',
      'event management company',
      'our story',
      'event platform mission',
      'event software company',
      'who we are',
    ],
    url: '/about',
  },

  contact: {
    title: 'Contact Us - Get Help & Support',
    description:
      'Need help with LiteEvent? Contact our support team for assistance with event management, ticketing, RSVP, and more. We respond within 24 hours.',
    keywords: [
      'contact',
      'support',
      'help',
      'customer service',
      'get in touch',
      'contact support',
      'email support',
    ],
    url: '/contact',
  },

  faq: {
    title: 'FAQ - Frequently Asked Questions',
    description:
      'Find answers to common questions about LiteEvent event management platform. Learn about features, pricing, ticketing, RSVP, guest management, billing, and technical support.',
    keywords: [
      'faq',
      'frequently asked questions',
      'event management help',
      'liteevent questions',
      'help center',
      'event platform support',
      'how to use liteevent',
      'event ticketing questions',
      'rsvp help',
    ],
    url: '/faq',
  },
};
