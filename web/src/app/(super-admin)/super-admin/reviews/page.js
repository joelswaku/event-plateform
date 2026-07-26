"use client";

import { useEffect, useState } from "react";
import { Star, Check, X, Trash2, Loader2, Filter } from "lucide-react";
import { api } from "@/lib/api";
import toast from "react-hot-toast";

function StarRating({ rating }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={14}
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

export default function ReviewsManagementPage() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending"); // pending, approved, rejected, all
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    fetchReviews();
  }, [filter]);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const params = filter !== "all" ? `?status=${filter}` : "";
      const res = await api.get(`/reviews/admin/all${params}`);
      if (res.data.success) {
        setReviews(res.data.data);
      }
    } catch (error) {
      toast.error("Failed to fetch reviews");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    setActionLoading(id);
    try {
      const res = await api.patch(`/reviews/${id}/approve`);
      if (res.data.success) {
        toast.success("Review approved");
        fetchReviews();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to approve review");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id) => {
    setActionLoading(id);
    try {
      const res = await api.patch(`/reviews/${id}/reject`);
      if (res.data.success) {
        toast.success("Review rejected");
        fetchReviews();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to reject review");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this review?")) return;

    setActionLoading(id);
    try {
      const res = await api.delete(`/reviews/${id}`);
      if (res.data.success) {
        toast.success("Review deleted");
        fetchReviews();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete review");
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
      approved: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
      rejected: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
    };

    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${styles[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Review Management</h1>
        <p className="text-white/60">Manage customer reviews and ratings</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setFilter("pending")}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === "pending"
              ? "bg-indigo-600 text-white"
              : "bg-white/5 text-white/70 hover:bg-white/10"
          }`}
        >
          Pending
        </button>
        <button
          onClick={() => setFilter("approved")}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === "approved"
              ? "bg-indigo-600 text-white"
              : "bg-white/5 text-white/70 hover:bg-white/10"
          }`}
        >
          Approved
        </button>
        <button
          onClick={() => setFilter("rejected")}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === "rejected"
              ? "bg-indigo-600 text-white"
              : "bg-white/5 text-white/70 hover:bg-white/10"
          }`}
        >
          Rejected
        </button>
        <button
          onClick={() => setFilter("all")}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === "all"
              ? "bg-indigo-600 text-white"
              : "bg-white/5 text-white/70 hover:bg-white/10"
          }`}
        >
          All
        </button>
      </div>

      {/* Reviews List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-20">
          <Filter className="h-12 w-12 text-white/20 mx-auto mb-3" />
          <p className="text-white/60">No reviews found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="rounded-2xl border border-white/10 bg-[#0d0d1a] p-6 shadow-sm"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-white">
                      {review.reviewer_name}
                    </h3>
                    {getStatusBadge(review.status)}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-white/60">
                    <span>{review.reviewer_email}</span>
                    <span>•</span>
                    <span>{new Date(review.created_at).toLocaleString()}</span>
                  </div>
                </div>
                <StarRating rating={review.rating} />
              </div>

              <p className="text-white/70 mb-4 leading-relaxed">
                {review.review_text}
              </p>

              {review.approved_by_name && (
                <p className="text-xs text-white/40 mb-4">
                  {review.status === "approved" ? "Approved" : "Rejected"} by {review.approved_by_name} on{" "}
                  {new Date(review.approved_at).toLocaleString()}
                </p>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                {review.status === "pending" && (
                  <>
                    <button
                      onClick={() => handleApprove(review.id)}
                      disabled={actionLoading === review.id}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
                    >
                      {actionLoading === review.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check size={16} />
                      )}
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(review.id)}
                      disabled={actionLoading === review.id}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
                    >
                      {actionLoading === review.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <X size={16} />
                      )}
                      Reject
                    </button>
                  </>
                )}
                <button
                  onClick={() => handleDelete(review.id)}
                  disabled={actionLoading === review.id}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 text-white/70 font-medium hover:bg-red-600 hover:text-white disabled:opacity-50 transition-colors ml-auto"
                >
                  {actionLoading === review.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 size={16} />
                  )}
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
