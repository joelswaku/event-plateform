import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import Script from "next/script";
import ReviewsClient from "./ReviewsClient";

// Server-side data fetching
async function getReviews() {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.liteevent.com';
    const res = await fetch(`${apiUrl}/api/reviews/approved`, {
      cache: 'no-store', // Always fetch fresh data
    });

    if (!res.ok) {
      throw new Error('Failed to fetch reviews');
    }

    const data = await res.json();

    if (data.success) {
      return {
        reviews: data.data.reviews,
        averageRating: data.data.averageRating,
        totalReviews: data.data.totalReviews
      };
    }
  } catch (error) {
    console.error('Failed to fetch reviews:', error);
  }

  return {
    reviews: [],
    averageRating: 0,
    totalReviews: 0
  };
}

// Generate structured data for Google rich results
function generateStructuredData(reviews, averageRating, totalReviews) {
  if (totalReviews === 0) return null;

  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "LiteEvent",
    "url": "https://liteevent.com",
    "logo": "https://liteevent.com/logo.png",
    "description": "Event management software and online event ticketing platform. Best RSVP management software for weddings, conference registration, festival ticketing with QR code check-in. Sell event tickets online with our free event management software.",
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": averageRating.toFixed(1),
      "reviewCount": totalReviews,
      "bestRating": "5",
      "worstRating": "1"
    },
    "review": reviews.slice(0, 10).map(review => ({
      "@type": "Review",
      "author": {
        "@type": "Person",
        "name": review.reviewer_name
      },
      "datePublished": review.created_at,
      "reviewBody": review.review_text,
      "reviewRating": {
        "@type": "Rating",
        "ratingValue": review.rating.toString(),
        "bestRating": "5",
        "worstRating": "1"
      }
    }))
  };
}

export default async function ReviewsPage() {
  const { reviews, averageRating, totalReviews } = await getReviews();
  const structuredData = generateStructuredData(reviews, averageRating, totalReviews);

  return (
    <div className="min-h-screen bg-background py-20">
      {/* Structured Data for Google Rich Results */}
      {structuredData && (
        <Script
          id="review-structured-data"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData)
          }}
        />
      )}

      <div className="container mx-auto px-4 max-w-6xl">
        {/* Back button */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-foreground/60 hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft size={20} />
          Back to Home
        </Link>

        <ReviewsClient
          initialReviews={reviews}
          initialAverageRating={averageRating}
          initialTotalReviews={totalReviews}
        />
      </div>
    </div>
  );
}
