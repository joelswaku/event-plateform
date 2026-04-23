"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  CalendarDays, MapPin, Users, CheckCircle2, XCircle,
  HelpCircle, Clock, Loader2, Lock, RotateCcw,
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL;

function formatDate(iso) {
  if (!iso) return "TBA";
  return new Date(iso).toLocaleString(undefined, {
    weekday: "long", year: "numeric", month: "long",
    day: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

function useCountdown(targetIso) {
  const [label, setLabel] = useState("");
  useEffect(() => {
    if (!targetIso) return;
    const tick = () => {
      const diff = new Date(targetIso) - Date.now();
      if (diff <= 0) { setLabel("Event has started"); return; }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      setLabel(d > 0 ? `${d}d ${h}h ${m}m` : `${h}h ${m}m`);
    };
    tick();
    const id = setInterval(tick, 60000);
    return () => clearInterval(id);
  }, [targetIso]);
  return label;
}

const STATUS_LABEL = { GOING: "Going", MAYBE: "Maybe", DECLINED: "Declined" };

export default function InvitationPage() {
  const { token } = useParams();

  const [state, setState]       = useState("loading"); // loading | error | ready | submitted
  const [data, setData]         = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  // RSVP form state — pre-filled from existing RSVP if present
  const [rsvpStatus, setRsvpStatus] = useState(null);
  const [plusOnes, setPlusOnes]     = useState(0);
  const [note, setNote]             = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const eventCountdown = useCountdown(data?.event?.start_at);

  /* ── Load invitation ── */
  useEffect(() => {
    async function load() {
      try {
        const res  = await fetch(`${API}/public/invitations/${token}`);
        const json = await res.json();
        if (!res.ok || !json.success) {
          setErrorMsg(json.message || "Invitation not found or has expired.");
          setState("error");
          return;
        }
        const d = json.data;
        setData(d);

        // Pre-fill from existing RSVP
        if (d.existing_rsvp) {
          setRsvpStatus(d.existing_rsvp.rsvp_status);
          setPlusOnes(d.existing_rsvp.plus_one_count ?? 0);
          setNote(d.existing_rsvp.note ?? "");
          setState("submitted");
        } else {
          setPlusOnes(d.guest?.plus_one_count ?? 0);
          setState("ready");
        }
      } catch {
        setErrorMsg("Could not load invitation. Please try again.");
        setState("error");
      }
    }
    load();
  }, [token]);

  /* ── Submit RSVP ── */
  const submitRsvp = async (status) => {
    if (submitting) return;
    setSubmitError("");
    setRsvpStatus(status);
    setSubmitting(true);
    try {
      const res  = await fetch(`${API}/public/invitations/${token}/rsvp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rsvp_status: status,
          plus_one_count: data?.guest?.plus_one_allowed ? plusOnes : 0,
          note: note.trim() || null,
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setState("submitted");
      } else {
        setSubmitError(json.message || "Failed to submit RSVP. Please try again.");
        setRsvpStatus(null);
      }
    } catch {
      setSubmitError("Network error. Please try again.");
      setRsvpStatus(null);
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Loading ── */
  if (state === "loading") {
    return (
      <div className="min-h-screen bg-linear-to-br from-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-gray-500">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          <p className="text-sm">Loading your invitation…</p>
        </div>
      </div>
    );
  }

  /* ── Error ── */
  if (state === "error") {
    return (
      <div className="min-h-screen bg-linear-to-br from-indigo-50 to-purple-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl shadow-xl max-w-md w-full p-10 text-center">
          <div className="mx-auto mb-4 w-14 h-14 rounded-full bg-red-100 flex items-center justify-center">
            <Lock className="w-7 h-7 text-red-500" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Invitation Not Found</h1>
          <p className="text-gray-500 text-sm">{errorMsg}</p>
        </div>
      </div>
    );
  }

  const { guest, event } = data;
  const isGoing    = rsvpStatus === "GOING";
  const isDeclined = rsvpStatus === "DECLINED";
  const maxPlusOnes = guest.plus_one_count ?? 0;

  /* ── Submitted ── */
  if (state === "submitted") {
    return (
      <div className="min-h-screen bg-linear-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center px-4 py-10">
        <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden">

          {/* Hero */}
          <div className="bg-linear-to-br from-indigo-600 to-purple-600 px-8 py-10 text-center text-white">
            <p className="text-indigo-200 text-xs font-semibold uppercase tracking-widest mb-2">Your RSVP</p>
            <h1 className="text-3xl font-black tracking-tight mb-1">{event.title}</h1>
          </div>

          <div className="px-8 py-8 space-y-6 text-center">
            <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center ${isGoing ? "bg-green-100" : isDeclined ? "bg-gray-100" : "bg-amber-100"}`}>
              {isGoing
                ? <CheckCircle2 className="w-9 h-9 text-green-500" />
                : isDeclined
                  ? <XCircle className="w-9 h-9 text-gray-400" />
                  : <HelpCircle className="w-9 h-9 text-amber-400" />}
            </div>

            <div>
              <p className="text-2xl font-black text-gray-900 mb-1">
                {isGoing ? "See you there! 🎉" : isDeclined ? "Sorry you can't make it" : "Maybe see you! 👋"}
              </p>
              <p className="text-gray-500 text-sm">
                {isGoing
                  ? "Your RSVP is confirmed. You'll receive an email confirmation."
                  : isDeclined
                    ? "Your response has been recorded. You can always reach out to the organizer."
                    : "We hope you can make it!"}
              </p>
            </div>

            <div className="bg-gray-50 rounded-2xl p-4 text-left text-sm text-gray-600 space-y-2">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-indigo-500 shrink-0" />
                <span>{formatDate(event.start_at)}</span>
              </div>
              {event.location_name && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-indigo-500 shrink-0" />
                  <span>{event.location_name}</span>
                </div>
              )}
            </div>

            <button
              onClick={() => setState("ready")}
              className="inline-flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
            >
              <RotateCcw className="w-4 h-4" />
              Change my RSVP
            </button>
          </div>

          <div className="px-8 pb-6 text-center text-xs text-gray-400">Powered by Eventos</div>
        </div>
      </div>
    );
  }

  /* ── RSVP Form ── */
  return (
    <div className="min-h-screen bg-linear-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center px-4 py-10">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden">

        {/* Hero */}
        <div className="bg-linear-to-br from-indigo-600 to-purple-600 px-8 py-10 text-center text-white">
          <p className="text-indigo-200 text-xs font-semibold uppercase tracking-widest mb-2">You&apos;re invited</p>
          <h1 className="text-3xl font-black tracking-tight mb-1">{event.title}</h1>
          {eventCountdown && (
            <div className="mt-3 inline-flex items-center gap-1.5 bg-white/20 rounded-full px-3 py-1 text-sm">
              <Clock className="w-3.5 h-3.5" />
              <span>{eventCountdown}</span>
            </div>
          )}
        </div>

        <div className="px-8 py-6 space-y-5">

          {/* Guest greeting */}
          <div>
            <p className="text-gray-500 text-sm">Hello,</p>
            <p className="text-xl font-bold text-gray-900">
              {guest.full_name}
              {guest.is_vip && <span className="ml-1 text-amber-500">⭐</span>}
            </p>
            {guest.email && <p className="text-xs text-gray-400 mt-0.5">{guest.email}</p>}
          </div>

          {/* Event details */}
          <div className="bg-gray-50 rounded-2xl p-4 space-y-2 text-sm text-gray-700">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-indigo-500 shrink-0" />
              <span>{formatDate(event.start_at)}</span>
            </div>
            {event.end_at && (
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-500 shrink-0" />
                <span>Until {formatDate(event.end_at)}</span>
              </div>
            )}
            {(event.location_name || event.location_address) && (
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                <span>
                  {event.location_name}
                  {event.location_address && (
                    <span className="block text-gray-400 text-xs">{event.location_address}</span>
                  )}
                </span>
              </div>
            )}
          </div>

          {/* Plus-ones */}
          {guest.plus_one_allowed && maxPlusOnes > 0 && (
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-indigo-500" />
                Companions (up to {maxPlusOnes})
              </label>
              <div className="flex items-center gap-3 mt-2">
                <button
                  onClick={() => setPlusOnes((n) => Math.max(0, n - 1))}
                  className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 text-lg font-bold"
                >−</button>
                <span className="w-8 text-center font-semibold text-gray-900">{plusOnes}</span>
                <button
                  onClick={() => setPlusOnes((n) => Math.min(maxPlusOnes, n + 1))}
                  className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 text-lg font-bold"
                >+</button>
              </div>
            </div>
          )}

          {/* Note */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">
              Message to organizer <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder="Dietary requirements, special needs…"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:border-indigo-400"
            />
          </div>

          {/* RSVP buttons */}
          <div className="space-y-3">
            <p className="text-sm font-semibold text-gray-700 text-center">Will you attend?</p>

            {/* Going / Decline — primary actions */}
            <div className="grid grid-cols-2 gap-3">
              <button
                disabled={submitting}
                onClick={() => submitRsvp("GOING")}
                className="flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-green-500 hover:bg-green-600 active:bg-green-700 text-white font-semibold text-sm transition disabled:opacity-60"
              >
                {submitting && rsvpStatus === "GOING"
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <CheckCircle2 className="w-5 h-5" />}
                Going
              </button>
              <button
                disabled={submitting}
                onClick={() => submitRsvp("DECLINED")}
                className="flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-700 font-semibold text-sm transition disabled:opacity-60"
              >
                {submitting && rsvpStatus === "DECLINED"
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <XCircle className="w-5 h-5" />}
                Decline
              </button>
            </div>

            {/* Maybe — secondary */}
            <button
              disabled={submitting}
              onClick={() => submitRsvp("MAYBE")}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-700 font-medium text-sm transition disabled:opacity-60"
            >
              {submitting && rsvpStatus === "MAYBE"
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <HelpCircle className="w-4 h-4" />}
              Not sure yet
            </button>

            {submitError && (
              <p className="text-xs text-red-500 text-center">{submitError}</p>
            )}
          </div>

        </div>

        <div className="px-8 pb-6 text-center text-xs text-gray-400">Powered by Eventos</div>
      </div>
    </div>
  );
}
