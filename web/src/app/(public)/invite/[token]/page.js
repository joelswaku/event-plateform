"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { CalendarDays, Shield, Loader2, Lock, CheckCircle2, XCircle } from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { useTeamStore } from "@/store/team.store";

function formatDate(iso) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
}

export default function TeamInvitePage() {
  const { token }  = useParams();
  const router     = useRouter();
  const { isAuthenticated, isHydrated } = useAuthStore();
  const { getInviteInfo, acceptInvite } = useTeamStore();

  const [phase,     setPhase]     = useState("loading"); // loading | info | accepting | done | error | expired
  const [invite,    setInvite]    = useState(null);
  const [errorMsg,  setErrorMsg]  = useState("");

  /* ── 1. Load invite info ── */
  useEffect(() => {
    if (!token) return;
    (async () => {
      const res = await getInviteInfo(token);
      if (!res.success) {
        setErrorMsg(res.error || "Invitation not found or has expired.");
        setPhase("error");
        return;
      }
      const d = res.data?.data ?? res.data;
      if (d?.status && d.status !== "pending") {
        setPhase(d.status === "accepted" ? "done" : "expired");
        setInvite(d);
        return;
      }
      setInvite(d);
      setPhase("info");
    })();
  }, [token]);

  /* ── 2. Auto-accept when the user is logged in ── */
  useEffect(() => {
    if (phase !== "info" || !isHydrated) return;
    if (!isAuthenticated) return;

    (async () => {
      setPhase("accepting");
      const res = await acceptInvite(token);
      if (res.success) {
        router.replace(`/events/${res.eventId}`);
      } else {
        setErrorMsg(res.error || "Could not accept the invitation.");
        setPhase("error");
      }
    })();
  }, [phase, isHydrated, isAuthenticated]);

  const encodedRedirect = encodeURIComponent(`/invite/${token}`);

  /* ── Loading ── */
  if (phase === "loading" || phase === "accepting") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-gray-500">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          <p className="text-sm">{phase === "accepting" ? "Joining team…" : "Loading invitation…"}</p>
        </div>
      </div>
    );
  }

  /* ── Error ── */
  if (phase === "error") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl shadow-xl max-w-md w-full p-10 text-center">
          <div className="mx-auto mb-4 w-14 h-14 rounded-full bg-red-100 flex items-center justify-center">
            <Lock className="w-7 h-7 text-red-500" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Invitation Problem</h1>
          <p className="text-gray-500 text-sm">{errorMsg}</p>
        </div>
      </div>
    );
  }

  /* ── Already accepted ── */
  if (phase === "done") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl shadow-xl max-w-md w-full p-10 text-center">
          <div className="mx-auto mb-4 w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle2 className="w-7 h-7 text-green-500" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Already Accepted</h1>
          <p className="text-gray-500 text-sm mb-6">
            This invitation has already been accepted. You are part of the team.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center px-6 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-500 transition-colors"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  /* ── Expired / cancelled ── */
  if (phase === "expired") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl shadow-xl max-w-md w-full p-10 text-center">
          <div className="mx-auto mb-4 w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center">
            <XCircle className="w-7 h-7 text-gray-400" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Invitation Expired</h1>
          <p className="text-gray-500 text-sm">
            This invitation has expired or been cancelled. Ask the event owner to send a new one.
          </p>
        </div>
      </div>
    );
  }

  /* ── info: show invite card + sign-in/sign-up CTAs ── */
  const eventTitle   = invite?.eventTitle  ?? invite?.event_title  ?? "an event";
  const inviterName  = invite?.inviterName ?? invite?.inviter_name ?? "Someone";
  const invitedEmail = invite?.email ?? "";
  const startAt      = invite?.eventStartAt ?? invite?.event_start_at;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center px-4 py-10">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden">

        {/* Header */}
        <div className="bg-gradient-to-br from-indigo-600 to-purple-600 px-8 py-10 text-center text-white">
          <div className="mx-auto mb-3 w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <p className="text-indigo-200 text-xs font-semibold uppercase tracking-widest mb-2">Team Invitation</p>
          <h1 className="text-2xl font-black tracking-tight">{eventTitle}</h1>
        </div>

        <div className="px-8 py-8 space-y-6">

          {/* Invite summary */}
          <div className="bg-gray-50 rounded-2xl p-4 space-y-2 text-sm text-gray-700">
            <p>
              <span className="font-semibold text-gray-900">{inviterName}</span>
              {" "}invited you to help manage{" "}
              <span className="font-semibold text-gray-900">{eventTitle}</span>{" "}
              as an <span className="font-semibold text-indigo-600">Admin</span>.
            </p>
            {invitedEmail && (
              <p className="text-gray-400 text-xs">Sent to {invitedEmail}</p>
            )}
            {startAt && (
              <div className="flex items-center gap-2 pt-1">
                <CalendarDays className="w-4 h-4 text-indigo-400 shrink-0" />
                <span className="text-gray-500">{formatDate(startAt)}</span>
              </div>
            )}
          </div>

          {/* What admins can do */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">As an admin you can</p>
            <ul className="space-y-1.5 text-sm text-gray-700">
              {["Manage guests & invitations", "Create and edit tickets", "Scan tickets at the door", "View event analytics"].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* CTAs */}
          <div className="space-y-3 pt-2">
            <Link
              href={`/login?redirect=${encodedRedirect}`}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-colors"
            >
              Sign in to accept
            </Link>
            <Link
              href={`/register?invite=${token}`}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-semibold transition-colors"
            >
              Create a new account
            </Link>
          </div>

        </div>

        <div className="px-8 pb-6 text-center text-xs text-gray-400">Powered by LiteEvent</div>
      </div>
    </div>
  );
}
