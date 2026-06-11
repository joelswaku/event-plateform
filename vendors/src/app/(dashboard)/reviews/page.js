"use client";
import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import { Star, Share2, Send, Link as LinkIcon, Loader2, RefreshCw } from "lucide-react";
import { api } from "@/lib/api";
import { useVendorStore } from "@/store/vendor.store";
import useT from "@/hooks/useT";

function StarRating({ rating, size = 14 }) {
  return (
    <span style={{ display: "inline-flex", gap: "2px" }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} size={size} fill={i <= rating ? "#f59e0b" : "none"} color={i <= rating ? "#f59e0b" : "rgba(255,255,255,0.2)"} />
      ))}
    </span>
  );
}

function fmtDate(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export default function ReviewsPage() {
  const T = useT();
  const vendor = useVendorStore((s) => s.vendor);

  const [reviews, setReviews]         = useState([]);
  const [loading, setLoading]         = useState(true);
  const [replyingTo, setReplyingTo]   = useState(null);
  const [replyText, setReplyText]     = useState("");
  const [submitting, setSubmitting]   = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  const fetchReviews = useCallback(async () => {
    try {
      const res = await api.get("/vendors/me/reviews");
      setReviews(res.data.data || []);
    } catch {
      toast.error("Failed to load reviews");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchReviews(); }, [fetchReviews]);

  // Derived stats
  const totalReviews = reviews.length;
  const avgRating = totalReviews > 0
    ? (reviews.reduce((s, r) => s + r.rating, 0) / totalReviews).toFixed(1)
    : "—";
  const breakdown = reviews.reduce((acc, r) => {
    acc[r.rating] = (acc[r.rating] || 0) + 1;
    return acc;
  }, {});

  const handleSubmitReply = async (reviewId) => {
    if (!replyText.trim()) return;
    setSubmitting(true);
    try {
      const res = await api.patch(`/vendors/me/reviews/${reviewId}/reply`, { reply: replyText });
      const updated = res.data.data;
      setReviews((prev) => prev.map((r) => r.id === updated.id ? updated : r));
      setReplyingTo(null);
      setReplyText("");
      toast.success("Reply posted!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to post reply");
    } finally {
      setSubmitting(false);
    }
  };

  const handleShare = () => {
    const url = vendor?.slug
      ? `${typeof window !== "undefined" ? window.location.origin : ""}/vendor/${vendor.slug}`
      : window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      setShareCopied(true);
      toast.success("Review link copied!");
      setTimeout(() => setShareCopied(false), 2500);
    });
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "28px", flexWrap: "wrap", gap: "14px" }}>
        <div>
          <h1 style={{ fontSize: "26px", fontWeight: 900, letterSpacing: "-0.5px", marginBottom: "4px", color: T.text }}>Reviews</h1>
          <p style={{ fontSize: "14px", color: T.textMuted, fontWeight: 500 }}>
            {loading ? "Loading…" : `${totalReviews} review${totalReviews !== 1 ? "s" : ""} from real events`}
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={fetchReviews} style={{ padding: "10px 16px", borderRadius: "10px", fontSize: "13px", fontWeight: 700, border: `1px solid ${T.borderSub}`, background: T.inputBg, color: T.textSub, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
            <RefreshCw size={13} /> Refresh
          </button>
          <button onClick={handleShare} style={{ padding: "10px 18px", borderRadius: "10px", fontSize: "13px", fontWeight: 700, border: `1px solid ${T.border}`, background: T.inputBg, color: shareCopied ? "#10b981" : T.text, cursor: "pointer", display: "flex", alignItems: "center", gap: "7px", transition: "color 0.2s" }}>
            {shareCopied ? <><LinkIcon size={14} /> Copied!</> : <><Share2 size={14} /> Share Review Link</>}
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "300px" }}>
          <Loader2 size={28} color="#6366f1" style={{ animation: "spin 1s linear infinite" }} />
        </div>
      ) : totalReviews === 0 ? (
        <div style={{ background: T.cardBgSolid, border: `1px solid ${T.border}`, borderRadius: "20px", padding: "80px 24px", textAlign: "center" }}>
          <div style={{ fontSize: "52px", marginBottom: "16px" }}>⭐</div>
          <h2 style={{ fontSize: "20px", fontWeight: 800, marginBottom: "8px", color: T.text }}>No reviews yet</h2>
          <p style={{ fontSize: "14px", color: T.textMuted, fontWeight: 500, maxWidth: "360px", margin: "0 auto" }}>
            After you complete events, organizers can leave reviews on your profile. Share your profile link to get started.
          </p>
        </div>
      ) : (
        <>
          {/* Rating overview card */}
          <div style={{ background: T.cardBgSolid, border: `1px solid ${T.border}`, borderRadius: "20px", padding: "30px 32px", display: "grid", gridTemplateColumns: "auto 1px 1fr", gap: "36px", alignItems: "center", marginBottom: "24px" }} className="rating-overview">
            {/* Big number */}
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "68px", fontWeight: 900, letterSpacing: "-3px", lineHeight: 1, marginBottom: "8px", color: T.text }}>{avgRating}</div>
              <StarRating rating={Math.round(parseFloat(avgRating))} size={20} />
              <div style={{ fontSize: "13px", color: T.textMuted, fontWeight: 600, marginTop: "8px" }}>{totalReviews} reviews</div>
            </div>

            {/* Divider */}
            <div style={{ height: "100px", background: T.border }} />

            {/* Breakdown */}
            <div>
              {[5, 4, 3, 2, 1].map((star) => {
                const count = breakdown[star] || 0;
                const pct = (count / totalReviews) * 100;
                return (
                  <div key={star} style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px", width: "44px", flexShrink: 0 }}>
                      <span style={{ fontSize: "13px", fontWeight: 700, color: T.textSub }}>{star}</span>
                      <Star size={11} fill="#f59e0b" color="#f59e0b" />
                    </div>
                    <div style={{ flex: 1, height: "8px", background: T.border, borderRadius: "4px", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: "linear-gradient(90deg, #f59e0b, #fbbf24)", borderRadius: "4px", transition: "width 0.6s ease" }} />
                    </div>
                    <span style={{ fontSize: "12px", fontWeight: 600, color: T.textMuted, width: "28px", textAlign: "right" }}>{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Reviews list */}
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {reviews.map((rev) => {
              const color = rev.reviewer_color || "#6366f1";
              const initial = rev.reviewer_initial || (rev.reviewer_name?.[0]?.toUpperCase()) || "?";
              return (
                <div key={rev.id} style={{ background: T.cardBgSolid, border: `1px solid ${T.border}`, borderRadius: "18px", padding: "20px 22px" }}>
                  {/* Review header */}
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "13px", marginBottom: "12px" }}>
                    <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: `linear-gradient(135deg, ${color}, ${color}90)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", fontWeight: 900, color: "#fff", flexShrink: 0 }}>
                      {initial}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", marginBottom: "4px" }}>
                        <span style={{ fontSize: "15px", fontWeight: 800, color: T.text }}>{rev.reviewer_name}</span>
                        <StarRating rating={rev.rating} size={13} />
                        {rev.event_type && (
                          <span style={{ padding: "1px 8px", borderRadius: "100px", fontSize: "10px", fontWeight: 700, background: T.borderSub, color: T.textMuted, border: `1px solid ${T.border}` }}>{rev.event_type}</span>
                        )}
                        {rev.is_verified && (
                          <span style={{ padding: "1px 8px", borderRadius: "100px", fontSize: "10px", fontWeight: 700, background: "rgba(16,185,129,0.12)", color: "#10b981", border: "1px solid rgba(16,185,129,0.2)" }}>✓ Verified</span>
                        )}
                      </div>
                      <span style={{ fontSize: "12px", color: T.textMuted, fontWeight: 600 }}>{fmtDate(rev.created_at)}</span>
                    </div>
                  </div>

                  {/* Body */}
                  {rev.title && <p style={{ fontSize: "15px", fontWeight: 800, marginBottom: "6px", color: T.text }}>{rev.title}</p>}
                  <p style={{ fontSize: "14px", lineHeight: 1.7, color: T.textSub, fontWeight: 500, marginBottom: "14px" }}>{rev.body}</p>

                  {/* Vendor reply */}
                  {rev.reply && (
                    <div style={{ padding: "14px 16px", borderRadius: "12px", background: "rgba(99,102,241,0.07)", border: "1px solid rgba(99,102,241,0.15)", borderLeft: "3px solid #6366f1", marginBottom: "12px" }}>
                      <div style={{ fontSize: "11px", fontWeight: 800, color: "#6366f1", marginBottom: "5px" }}>Your response</div>
                      <p style={{ fontSize: "13px", lineHeight: 1.65, color: T.textSub, fontWeight: 500 }}>{rev.reply}</p>
                    </div>
                  )}

                  {/* Reply button / form */}
                  {!rev.reply && replyingTo !== rev.id && (
                    <button onClick={() => { setReplyingTo(rev.id); setReplyText(""); }}
                      style={{ padding: "8px 16px", borderRadius: "8px", fontSize: "13px", fontWeight: 700, color: T.textSub, border: `1px solid ${T.borderSub}`, background: "none", cursor: "pointer" }}>
                      Reply to review
                    </button>
                  )}

                  {replyingTo === rev.id && (
                    <div style={{ marginTop: "8px" }}>
                      <textarea value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="Write a professional, helpful response…" rows={3} autoFocus
                        style={{ width: "100%", padding: "12px 14px", resize: "vertical", background: T.cardBgSolid, border: `1px solid ${T.inputBorder}`, borderRadius: "10px", fontSize: "14px", fontWeight: 600, color: T.text, outline: "none", marginBottom: "10px" }}
                      />
                      <div style={{ display: "flex", gap: "10px" }}>
                        <button onClick={() => { setReplyingTo(null); setReplyText(""); }}
                          style={{ padding: "9px 16px", borderRadius: "8px", fontSize: "13px", fontWeight: 700, border: `1px solid ${T.borderSub}`, background: "none", color: T.textSub, cursor: "pointer" }}>
                          Cancel
                        </button>
                        <button onClick={() => handleSubmitReply(rev.id)} disabled={!replyText.trim() || submitting}
                          style={{ padding: "9px 18px", borderRadius: "8px", fontSize: "13px", fontWeight: 700, background: replyText.trim() ? "linear-gradient(135deg, #6366f1, #a78bfa)" : T.inputBg, color: replyText.trim() ? "#fff" : T.textMuted, border: "none", cursor: replyText.trim() ? "pointer" : "not-allowed", display: "flex", alignItems: "center", gap: "6px" }}>
                          {submitting ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> : <Send size={13} />}
                          Post Reply
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 700px) {
          .rating-overview { grid-template-columns: 1fr !important; }
          .rating-overview > div:nth-child(2) { display: none !important; }
        }
      `}</style>
    </div>
  );
}
