"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { CalendarDays, CheckCircle2, Clock3, Loader2, MapPin, ShieldCheck, Ticket, XCircle } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

function formatDate(value) {
  if (!value) return "Date to be announced";
  return new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function GuestQrPassPage() {
  const { token } = useParams();
  const [state, setState] = useState("loading");
  const [pass, setPass] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) return;

    let active = true;
    fetch(`${API}/public/guest-passes/${encodeURIComponent(token)}`)
      .then(async (response) => ({ response, body: await response.json() }))
      .then(({ response, body }) => {
        if (!active) return;
        if (!response.ok || !body.success) {
          setMessage(body.message || "This QR pass is unavailable.");
          setState("error");
          return;
        }
        setPass(body.data);
        setState("ready");
      })
      .catch(() => {
        if (!active) return;
        setMessage("We could not load this QR pass. Please check your connection and try again.");
        setState("error");
      });

    return () => { active = false; };
  }, [token]);

  if (state === "loading") {
    return (
      <main className="min-h-screen bg-[#06142b] grid place-items-center px-6 text-center text-white">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-9 w-9 animate-spin text-[#0b94fd]" />
          <p className="text-sm font-medium text-white/70">Loading your event pass…</p>
        </div>
      </main>
    );
  }

  if (state === "error") {
    return (
      <main className="min-h-screen bg-[#06142b] grid place-items-center px-5 text-center">
        <section className="w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.06] p-8 text-white shadow-2xl">
          <XCircle className="mx-auto h-12 w-12 text-red-400" />
          <h1 className="mt-5 text-2xl font-black">QR pass unavailable</h1>
          <p className="mt-2 text-sm leading-6 text-white/65">{message}</p>
        </section>
      </main>
    );
  }

  const unavailable = pass.unavailable;
  const statusText = pass.qr_status === "USED" ? "This pass has already been used." :
    pass.qr_status === "REVOKED" ? "This pass has been revoked by the organizer." :
      pass.qr_status === "EXPIRED" ? "This pass has expired." : null;

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#0b94fd33,transparent_36%),#06142b] px-4 py-8 text-white sm:px-6">
      <section className="mx-auto w-full max-w-md overflow-hidden rounded-[30px] border border-white/10 bg-[#0a1d3a]/90 shadow-2xl backdrop-blur">
        <header className="border-b border-white/10 bg-[#012354] px-6 py-7 text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[#0b94fd]/20 text-[#72c4ff]">
            <Ticket className="h-6 w-6" />
          </div>
          <p className="mt-4 text-[11px] font-black uppercase tracking-[0.22em] text-[#72c4ff]">LiteEvent entry pass</p>
          <h1 className="mt-2 text-2xl font-black tracking-tight">{pass.event_title}</h1>
          <p className="mt-1 text-sm text-white/60">For {pass.guest_name}</p>
        </header>

        <div className="space-y-5 px-6 py-6">
          {unavailable ? (
            <div className="rounded-2xl border border-amber-300/25 bg-amber-400/10 p-5 text-center">
              <Clock3 className="mx-auto h-8 w-8 text-amber-300" />
              <p className="mt-3 font-bold text-amber-100">{statusText}</p>
              <p className="mt-1 text-sm leading-5 text-amber-100/70">Please contact the event organizer if you need help.</p>
            </div>
          ) : (
            <>
              <div className="rounded-3xl bg-white p-4 shadow-inner">
                <img
                  src={`${API}/public/guest-passes/${encodeURIComponent(token)}/qr`}
                  alt="Your event entry QR code"
                  className="mx-auto aspect-square w-full max-w-[300px]"
                />
              </div>
              <div className="flex items-center justify-center gap-2 text-sm font-semibold text-emerald-300">
                <CheckCircle2 className="h-4 w-4" />
                Show this QR code at check-in
              </div>
            </>
          )}

          <div className="space-y-3 rounded-2xl border border-white/10 bg-black/15 p-4 text-sm text-white/75">
            <div className="flex items-start gap-3"><CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-[#72c4ff]" /><span>{formatDate(pass.starts_at)}</span></div>
            {(pass.venue_name || pass.location) && <div className="flex items-start gap-3"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#72c4ff]" /><span>{[pass.venue_name, pass.location].filter(Boolean).join(" · ")}</span></div>}
          </div>
        </div>

        <footer className="flex items-center justify-center gap-2 border-t border-white/10 px-6 py-4 text-xs text-white/45"><ShieldCheck className="h-3.5 w-3.5" /> Secure event check-in</footer>
      </section>
    </main>
  );
}
