"use client";

import { useEffect, useState } from "react";
import { Star, Quote } from "lucide-react";
import { api } from "@/lib/api";

// Format relative time
function formatRelativeTime(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now - date;
  const diffInSeconds = Math.floor(diffInMs / 1000);
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);
  const diffInWeeks = Math.floor(diffInDays / 7);
  const diffInMonths = Math.floor(diffInDays / 30);
  const diffInYears = Math.floor(diffInDays / 365);

  if (diffInYears > 0) return `${diffInYears} year${diffInYears > 1 ? 's' : ''} ago`;
  if (diffInMonths > 0) return `${diffInMonths} month${diffInMonths > 1 ? 's' : ''} ago`;
  if (diffInWeeks > 0) return `${diffInWeeks} week${diffInWeeks > 1 ? 's' : ''} ago`;
  if (diffInDays > 0) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  if (diffInHours > 0) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  if (diffInMinutes > 0) return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
  return 'Just now';
}

function StarRating({ rating }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={16}
          className={`${
            star <= rating
              ? "fill-amber-400 text-amber-400"
              : "text-foreground/20"
          }`}
        />
      ))}
    </div>
  );
}

function ReviewCard({ review }) {
  const initials = review.reviewer_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="rounded-2xl border border-foreground/10 bg-card p-6 shadow-sm">
      <div className="flex items-start gap-4 mb-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-600 font-bold text-sm">
          {initials}
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-foreground">{review.reviewer_name}</h4>
          <div className="flex items-center gap-2 mt-1">
            <StarRating rating={review.rating} />
            <span className="text-xs text-foreground/40">
              {formatRelativeTime(review.created_at)}
            </span>
          </div>
        </div>
      </div>
      <div className="relative">
        <Quote className="absolute -top-2 -left-2 text-indigo-500/10" size={32} />
        <p className="text-foreground/70 leading-relaxed pl-6">
          {review.review_text}
        </p>
      </div>
    </div>
  );
}

export default function ReviewsSection() {
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const res = await api.get("/reviews/approved");
      if (res.data.success) {
        setReviews(res.data.data.reviews);
        setAverageRating(res.data.data.averageRating);
        setTotalReviews(res.data.data.totalReviews);
      }
    } catch (error) {
      console.error("Failed to fetch reviews:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-indigo-500/20 border-t-indigo-500" />
          </div>
        </div>
      </section>
    );
  }

  if (reviews.length === 0) {
    return null;
  }

  // SEO Schema for Reviews
  const reviewSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": "LiteEvent",
    "description": "Professional event management platform for creating unforgettable events",
    "brand": {
      "@type": "Brand",
      "name": "LiteEvent"
    },
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
        "ratingValue": review.rating,
        "bestRating": "5",
        "worstRating": "1"
      }
    }))
  };

  return (
    <>
      {/* SEO Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(reviewSchema) }}
      />

      <section id="reviews" className="py-20 bg-foreground/[0.02]">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Loved by Event Organizers
            </h2>
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="flex">
                <StarRating rating={Math.round(averageRating)} />
              </div>
              <span className="text-2xl font-bold text-foreground">
                {averageRating.toFixed(1)}
              </span>
              <span className="text-foreground/60">
                ({totalReviews} {totalReviews === 1 ? "review" : "reviews"})
              </span>
            </div>
            <p className="text-foreground/60 max-w-2xl mx-auto">
              See what our customers are saying about LiteEvent
            </p>
          </div>

          {/* Reviews Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {reviews.slice(0, 6).map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>

          {/* Show More Button */}
          {reviews.length > 6 && (
            <div className="text-center mt-8">
              <a
                href="/reviews"
                className="inline-block px-8 py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors"
              >
                See All {totalReviews} Reviews
              </a>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
