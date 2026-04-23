"use client";

import { useEffect, useState } from "react";
import {
  CheckCircle2, XCircle, HelpCircle, Loader2,
  ChevronUp, ChevronDown, Users, MessageSquare, User,
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL;

function initials(name = "") {
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

function formatDate(iso) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short", day: "numeric", year: "numeric",
  });
}

export default function RsvpPanel({ token }) {
  const [inv, setInv]           = useState(null);      // invitation data
  const [loadErr, setLoadErr]   = useState(false);

  const [expanded, setExpanded] = useState(false);
  const [rsvpStatus, setRsvp]   = useState(null);      // current selection
  const [plusOnes, setPlusOnes] = useState(0);
  const [note, setNote]         = useState("");
  const [guestName, setGuestName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted]   = useState(false);
  const [submitErr, setSubmitErr]   = useState("");

  /* ── Listen for CTA button trigger ── */
  useEffect(() => {
    const handler = () => setExpanded(true);
    window.addEventListener("open-rsvp-panel", handler);
    return () => window.removeEventListener("open-rsvp-panel", handler);
  }, []);

  /* ── Load invitation ── */
  useEffect(() => {
    if (!token) return;
    fetch(`${API}/public/invitations/${token}`)
      .then((r) => r.json())
      .then((json) => {
        if (!json.success) { setLoadErr(true); return; }
        const d = json.data;
        setInv(d);
        setGuestName(d.guest?.full_name ?? "");
        if (d.existing_rsvp) {
          setRsvp(d.existing_rsvp.rsvp_status);
          setPlusOnes(d.existing_rsvp.plus_one_count ?? 0);
          setNote(d.existing_rsvp.note ?? "");
          setSubmitted(true);
        } else {
          setPlusOnes(d.guest?.plus_one_count ?? 0);
          setExpanded(true); // open panel for first-time visitors
        }
      })
      .catch(() => setLoadErr(true));
  }, [token]);

  /* ── Submit RSVP ── */
  const submit = async (status) => {
    if (submitting) return;
    setSubmitErr("");
    setRsvp(status);
    setSubmitting(true);
    try {
      const res  = await fetch(`${API}/public/invitations/${token}/rsvp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rsvp_status: status,
          plus_one_count: inv?.guest?.plus_one_allowed ? plusOnes : 0,
          note: note.trim() || null,
          guest_name: guestName.trim() || null,
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setSubmitted(true);
        setExpanded(false);
      } else {
        setSubmitErr(json.message || "Failed to submit. Please try again.");
        setRsvp(null);
      }
    } catch {
      setSubmitErr("Network error. Please try again.");
      setRsvp(null);
    } finally {
      setSubmitting(false);
    }
  };

  // Don't render anything if no token or invalid token
  if (!token || loadErr || !inv) return null;

  const { guest, event } = inv;
  const maxPlusOnes = guest.plus_one_count ?? 0;
  const isGoing    = rsvpStatus === "GOING";
  const isDeclined = rsvpStatus === "DECLINED";

  /* ── Status badge shown when collapsed ── */
  const statusIcon = isGoing
    ? <CheckCircle2 className="w-4 h-4 text-green-500" />
    : isDeclined
      ? <XCircle className="w-4 h-4 text-gray-400" />
      : rsvpStatus === "MAYBE"
        ? <HelpCircle className="w-4 h-4 text-amber-400" />
        : null;

  const statusText = isGoing ? "Going" : isDeclined ? "Declined" : rsvpStatus === "MAYBE" ? "Maybe" : null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-50">
      {/* Backdrop blur strip */}
      <div
        className={`mx-auto max-w-lg w-full transition-all duration-400 ease-in-out`}
        style={{ filter: "drop-shadow(0 -4px 24px rgba(0,0,0,0.12))" }}
      >
        <div className="rounded-t-3xl bg-white border border-b-0 border-stone-200 overflow-hidden">

          {/* ── Collapsed handle / tab ── */}
          <button
            onClick={() => setExpanded((v) => !v)}
            className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-stone-50 transition"
          >
            <div className="flex items-center gap-3">
              {/* Avatar */}
              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-700 shrink-0">
                {initials(guestName || guest.full_name)}
              </div>
              <div className="text-left">
                <p className="text-xs text-stone-400 leading-none">Your invitation</p>
                <p className="text-sm font-semibold text-stone-900 leading-snug">{guestName || guest.full_name}</p>
              </div>
              {submitted && statusIcon && (
                <span className="flex items-center gap-1 text-xs font-medium text-stone-500 ml-1">
                  {statusIcon} {statusText}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-stone-400">
              {!submitted && (
                <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
                  RSVP required
                </span>
              )}
              {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </div>
          </button>

          {/* ── Expanded content ── */}
          {expanded && (
            <div className="px-5 pb-6 pt-1 space-y-4 border-t border-stone-100">

              {/* Event mini-info */}
              {(event.start_at || event.location_name) && (
                <div className="flex gap-4 text-xs text-stone-500">
                  {event.start_at && <span>📅 {formatDate(event.start_at)}</span>}
                  {event.location_name && <span>📍 {event.location_name}</span>}
                </div>
              )}

              {submitted ? (
                /* ── Already responded ── */
                <div className="space-y-3">
                  <div className={`flex items-center gap-2 px-4 py-3 rounded-2xl text-sm font-semibold ${
                    isGoing ? "bg-green-50 text-green-700" :
                    isDeclined ? "bg-gray-50 text-gray-600" :
                    "bg-amber-50 text-amber-700"
                  }`}>
                    {statusIcon}
                    <span>
                      {isGoing
                        ? `${guestName || guest.full_name} is going! See you there 🎉`
                        : isDeclined
                          ? "You declined this event"
                          : "You responded: Maybe"}
                    </span>
                  </div>
                  <button
                    onClick={() => { setSubmitted(false); setExpanded(true); }}
                    className="text-xs text-indigo-600 hover:text-indigo-700 font-medium underline underline-offset-2"
                  >
                    Change my response
                  </button>
                </div>
              ) : (
                /* ── RSVP form ── */
                <div className="space-y-4">
                  {/* Name confirmation */}
                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-medium text-stone-600 mb-1.5">
                      <User className="w-3.5 h-3.5" />
                      Your name
                    </label>
                    <input
                      type="text"
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      placeholder="Full name"
                      className="w-full text-sm border border-stone-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-indigo-400 placeholder:text-stone-300"
                    />
                  </div>

                  {/* Plus-ones */}
                  {guest.plus_one_allowed && maxPlusOnes > 0 && (
                    <div>
                      <label className="flex items-center gap-1.5 text-xs font-medium text-stone-600 mb-2">
                        <Users className="w-3.5 h-3.5" />
                        Companions (up to {maxPlusOnes})
                      </label>
                      <div className="flex items-center gap-3">
                        <button onClick={() => setPlusOnes((n) => Math.max(0, n - 1))}
                          className="w-8 h-8 rounded-xl border border-stone-200 flex items-center justify-center text-stone-600 hover:bg-stone-50 font-bold text-base">−</button>
                        <span className="w-6 text-center text-sm font-semibold text-stone-900">{plusOnes}</span>
                        <button onClick={() => setPlusOnes((n) => Math.min(maxPlusOnes, n + 1))}
                          className="w-8 h-8 rounded-xl border border-stone-200 flex items-center justify-center text-stone-600 hover:bg-stone-50 font-bold text-base">+</button>
                      </div>
                    </div>
                  )}

                  {/* Note */}
                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-medium text-stone-600 mb-1.5">
                      <MessageSquare className="w-3.5 h-3.5" />
                      Message <span className="text-stone-400 font-normal">(optional)</span>
                    </label>
                    <textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      rows={2}
                      placeholder="Dietary needs, special requests…"
                      className="w-full text-sm border border-stone-200 rounded-xl px-3 py-2 resize-none focus:outline-none focus:border-indigo-400 placeholder:text-stone-300"
                    />
                  </div>

                  {/* RSVP buttons */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      disabled={submitting}
                      onClick={() => submit("GOING")}
                      className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-green-500 hover:bg-green-600 text-white font-semibold text-sm transition disabled:opacity-60"
                    >
                      {submitting && rsvpStatus === "GOING"
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <CheckCircle2 className="w-4 h-4" />}
                      Going
                    </button>
                    <button
                      disabled={submitting}
                      onClick={() => submit("DECLINED")}
                      className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold text-sm transition disabled:opacity-60"
                    >
                      {submitting && rsvpStatus === "DECLINED"
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <XCircle className="w-4 h-4" />}
                      Decline
                    </button>
                  </div>

                  <button
                    disabled={submitting}
                    onClick={() => submit("MAYBE")}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-700 text-sm font-medium transition disabled:opacity-60"
                  >
                    {submitting && rsvpStatus === "MAYBE"
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      : <HelpCircle className="w-3.5 h-3.5" />}
                    Not sure yet
                  </button>

                  {submitErr && <p className="text-xs text-red-500 text-center">{submitErr}</p>}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
