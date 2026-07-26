"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import toast from "react-hot-toast";
import { api } from "@/lib/api";

export default function ReviewForm({ user, onSuccess }) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      toast.error("Please login to submit a review");
      return;
    }

    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }

    if (!reviewText.trim()) {
      toast.error("Please write a review");
      return;
    }

    if (reviewText.trim().length < 10) {
      toast.error("Review must be at least 10 characters");
      return;
    }

    setSubmitting(true);

    try {
      const res = await api.post("/reviews", {
        rating,
        review_text: reviewText.trim()
      });

      if (res.data.success) {
        toast.success(res.data.message || "Review submitted!");
        setRating(0);
        setReviewText("");
        onSuccess?.();
      }
    } catch (error) {
      const message = error.response?.data?.message || "Failed to submit review";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="rounded-2xl border border-foreground/10 bg-foreground/5 p-8 text-center">
        <p className="text-foreground/60">Please <a href="/login" className="text-indigo-500 hover:underline">login</a> to submit a review</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-foreground/10 bg-card p-6 shadow-sm">
      <h3 className="text-lg font-bold text-foreground mb-4">Write a Review</h3>

      {/* Star Rating */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-foreground/70 mb-2">
          Your Rating
        </label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              className="transition-transform hover:scale-110"
            >
              <Star
                size={32}
                className={`${
                  star <= (hoverRating || rating)
                    ? "fill-amber-400 text-amber-400"
                    : "text-foreground/20"
                } transition-colors`}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Review Text */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-foreground/70 mb-2">
          Your Review
        </label>
        <textarea
          value={reviewText}
          onChange={(e) => setReviewText(e.target.value)}
          placeholder="Share your experience with LiteEvent..."
          className="w-full px-4 py-3 rounded-xl border border-foreground/10 bg-foreground/5 text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          rows={4}
          maxLength={500}
        />
        <p className="text-xs text-foreground/40 mt-1">
          {reviewText.length}/500 characters
        </p>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={submitting || rating === 0 || !reviewText.trim()}
        className="w-full py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {submitting ? "Submitting..." : "Submit Review"}
      </button>

      <p className="text-xs text-foreground/40 mt-3 text-center">
        Your review will be visible after admin approval
      </p>
    </form>
  );
}
