// "use client";

// import SectionRendererPublic from "./SectionRendererPublic";

// export default function EventPublicRenderer({ event, builder }) {
//   const sections = builder?.sections || [];

//   return (
//     <div className="bg-white">

//       {/* FALLBACK (if no builder yet) */}
//       {sections.length === 0 && (
//         <div className="text-center py-20">
//           <h1 className="text-4xl font-bold">{event.title}</h1>
//           <p className="text-gray-500 mt-2">
//             No custom page yet
//           </p>
//         </div>
//       )}

//       {/* BUILDER RENDER */}
//       {sections.map((section) => (
//         <SectionRendererPublic
//           key={section.id}
//           section={section}
//         />
//       ))}
//     </div>
//   );
// }









"use client";

import { useEffect, useState } from "react";

export default function InvitationPage({ params }) {
  const { token } = params;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rsvpLoading, setRsvpLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);

  /* =========================
     FETCH INVITATION
  ========================= */
  useEffect(() => {
    async function fetchInvitation() {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/public/invitations/${token}`
        );

        const json = await res.json();

        setData(json.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchInvitation();
  }, [token]);

  /* =========================
     COUNTDOWN
  ========================= */
  useEffect(() => {
    if (!data?.event?.start_at) return;

    const interval = setInterval(() => {
      const eventTime = new Date(data.event.start_at).getTime();
      const now = new Date().getTime();
      const diff = eventTime - now;

      if (diff <= 0) {
        setTimeLeft("Started");
        clearInterval(interval);
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);

      setTimeLeft(`${days}d ${hours}h ${minutes}m`);
    }, 1000);

    return () => clearInterval(interval);
  }, [data]);

  /* =========================
     RSVP ACTION
  ========================= */
  const sendRsvp = async (status) => {
    try {
      setRsvpLoading(true);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/public/invitations/${token}/rsvp`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            rsvp_status: status,
          }),
        }
      );

      const json = await res.json();

      if (json.success) {
        setData((prev) => ({
          ...prev,
          invitation_status: "OPENED",
        }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRsvpLoading(false);
    }
  };

  if (loading) return <p className="p-10">Loading invitation...</p>;

  if (!data) return <p>Invitation not found</p>;

  const { guest, event } = data;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl shadow-xl max-w-xl w-full p-8 text-center">

        {/* TITLE */}
        <h1 className="text-3xl font-bold mb-2">
          {event.title}
        </h1>

        <p className="text-gray-500 mb-6">
          Hello <b>{guest.full_name}</b>, you&apos;re invited 🎉
        </p>

        {/* COUNTDOWN */}
        <div className="mb-6">
          <p className="text-sm text-gray-400">Event starts in</p>
          <p className="text-2xl font-semibold text-indigo-600">
            {timeLeft || "Loading..."}
          </p>
        </div>

        {/* EVENT INFO */}
        <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
          <p><b>📅 Date:</b> {event.start_at || "TBA"}</p>
          <p><b>📍 Location:</b> {event.location_name || "TBA"}</p>
        </div>

        {/* RSVP BUTTONS */}
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => sendRsvp("GOING")}
            disabled={rsvpLoading}
            className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-xl font-semibold transition"
          >
            {rsvpLoading ? "..." : "✅ Going"}
          </button>

          <button
            onClick={() => sendRsvp("DECLINED")}
            disabled={rsvpLoading}
            className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-xl font-semibold transition"
          >
            ❌ Decline
          </button>
        </div>

        {/* STATUS */}
        {data.invitation_status === "OPENED" && (
          <p className="mt-6 text-sm text-green-600">
            ✔ Your response has been recorded
          </p>
        )}

      </div>
    </div>
  );
}









