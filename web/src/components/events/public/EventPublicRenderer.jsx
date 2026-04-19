
"use client";

import { useEffect, useState } from "react";
import SectionRendererPublic from "./SectionRendererPublic";

export default function EventPublicRenderer({ event, builder }) {
  const [timeLeft, setTimeLeft] = useState("");

  const sections = builder?.sections || [];

  /* =========================
     COUNTDOWN (GLOBAL)
  ========================= */
  useEffect(() => {
    if (!event?.starts_at_utc) return;

    const interval = setInterval(() => {
      const eventDate = new Date(event.starts_at_utc);
      const now = new Date();
      const diff = eventDate - now;

      if (diff <= 0) {
        setTimeLeft("🎉 Happening now!");
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);

      setTimeLeft(`${days}d ${hours}h ${minutes}m`);
    }, 1000);

    return () => clearInterval(interval);
  }, [event]);

  return (
    <div className="min-h-screen bg-white">

      {/* ❗ NO BUILDER FALLBACK */}
      {sections.length === 0 && (
        <div className="text-center py-20">
          <h1 className="text-4xl font-bold">{event.title}</h1>
          <p className="text-gray-500 mt-2">
            No page design yet
          </p>

          <div className="mt-6 text-xl text-rose-500">
            ⏳ {timeLeft}
          </div>
        </div>
      )}

      {/* ✅ BUILDER RENDER */}
      {sections.map((section) => (
        <SectionRendererPublic
          key={section.id}
          section={section}
          event={event}
          timeLeft={timeLeft}
        />
      ))}
    </div>
  );
}
















// "use client";

// import { useEffect, useState } from "react";

// export default function EventPublicRenderer({ event }) {
//   const [timeLeft, setTimeLeft] = useState("");

//   useEffect(() => {
//     const interval = setInterval(() => {
//       const eventDate = new Date(event.starts_at_utc);
//       const now = new Date();
//       const diff = eventDate - now;

//       if (diff <= 0) {
//         setTimeLeft("🎉 Happening now!");
//         return;
//       }

//       const days = Math.floor(diff / (1000 * 60 * 60 * 24));
//       const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
//       const minutes = Math.floor((diff / (1000 * 60)) % 60);

//       setTimeLeft(`${days}d ${hours}h ${minutes}m`);
//     }, 1000);

//     return () => clearInterval(interval);
//   }, [event]);

//   return (
//     <div className="min-h-screen bg-gradient-to-b from-rose-50 via-white to-gray-50 text-gray-800">

//       {/* HERO */}
//       <section
//         className="relative h-[80vh] flex items-center justify-center text-center text-white"
//         style={{
//           backgroundImage: `url(${event.cover_image_url || "https://images.unsplash.com/photo-1520854221256-17451cc331bf"})`,
//           backgroundSize: "cover",
//           backgroundPosition: "center",
//         }}
//       >
//         <div className="absolute inset-0 bg-black/50" />

//         <div className="relative z-10 px-6">
//           <h1 className="text-5xl font-bold mb-4">
//             💍 {event.title}
//           </h1>

//           <p className="mb-6">
//             {event.description || "You are invited"}
//           </p>

//           <div className="text-2xl text-rose-300 animate-pulse">
//             ⏳ {timeLeft}
//           </div>
//         </div>
//       </section>

//       {/* DETAILS */}
//       <section className="max-w-5xl mx-auto px-6 py-16 text-center">
//         <h2 className="text-3xl font-semibold mb-6">Event Details</h2>

//         <div className="grid md:grid-cols-3 gap-6">
//           <div className="bg-white p-6 rounded-2xl shadow">
//             <p className="text-gray-500">📅 Date</p>
//             <p>{new Date(event.starts_at_utc).toLocaleString()}</p>
//           </div>

//           <div className="bg-white p-6 rounded-2xl shadow">
//             <p className="text-gray-500">📍 Location</p>
//             <p>{event.city}</p>
//           </div>

//           <div className="bg-white p-6 rounded-2xl shadow">
//             <p className="text-gray-500">🌍 Country</p>
//             <p>{event.country}</p>
//           </div>
//         </div>
//       </section>

//       {/* RSVP */}
//       <section className="text-center py-16 bg-rose-50">
//         <h2 className="text-3xl mb-4">Will you attend?</h2>

//         <div className="flex justify-center gap-4">
//           <button className="px-6 py-3 bg-green-500 text-white rounded-xl">
//             ✅ Going
//           </button>

//           <button className="px-6 py-3 bg-red-500 text-white rounded-xl">
//             ❌ Decline
//           </button>
//         </div>
//       </section>

//     </div>
//   );
// }

