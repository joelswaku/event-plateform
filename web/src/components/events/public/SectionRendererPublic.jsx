"use client";

import { PUBLIC_SECTION_COMPONENTS } from "./sectionRegistry";

export default function SectionRendererPublic({ section, event, timeLeft }) {
  const Component = PUBLIC_SECTION_COMPONENTS[section.section_type];

  if (!Component) {
    return (
      <div className="p-6 text-red-500">
        Unsupported section: {section.section_type}
      </div>
    );
  }

  return <Component section={section} event={event} timeLeft={timeLeft} />;
}


// "use client";

// import { useEffect, useMemo, useState } from "react";
// import SectionRendererPublic from "./SectionRendererPublic";

// export default function EventPublicRenderer({ event, builder }) {
//   const [timeLeft, setTimeLeft] = useState("");

//   const sections = useMemo(() => {
//     return (builder?.sections || [])
//       .filter((section) => section?.is_visible !== false)
//       .sort((a, b) => (a.position_order ?? 0) - (b.position_order ?? 0));
//   }, [builder?.sections]);

//   useEffect(() => {
//     if (!event?.starts_at_utc) {
//       setTimeLeft("");
//       return;
//     }

//     const updateCountdown = () => {
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
//     };

//     updateCountdown();
//     const interval = setInterval(updateCountdown, 1000);

//     return () => clearInterval(interval);
//   }, [event?.starts_at_utc]);

//   return (
//     <div className="min-h-screen bg-white">
//       {sections.length === 0 ? (
//         <div className="mx-auto max-w-4xl px-6 py-20 text-center">
//           <h1 className="text-4xl font-bold text-gray-900">
//             {event?.title || "Untitled Event"}
//           </h1>

//           <p className="mt-3 text-gray-500">
//             No page design has been published for this event yet.
//           </p>

//           {timeLeft && (
//             <div className="mt-6 text-xl font-semibold text-rose-500">
//               ⏳ {timeLeft}
//             </div>
//           )}
//         </div>
//       ) : (
//         sections.map((section) => (
//           <SectionRendererPublic
//             key={section.id}
//             section={section}
//             event={event}
//             timeLeft={timeLeft}
//           />
//         ))
//       )}
//     </div>
//   );
// }









// "use client";

// import { useEffect, useState } from "react";
// import SectionRendererPublic from "./SectionRendererPublic";

// export default function EventPublicRenderer({ event, builder }) {
//   const [timeLeft, setTimeLeft] = useState("");

//   const sections = builder?.sections || [];

//   /* =========================
//      COUNTDOWN (GLOBAL)
//   ========================= */
//   useEffect(() => {
//     if (!event?.starts_at_utc) return;

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
//     <div className="min-h-screen bg-white">

//       {/* ❗ NO BUILDER FALLBACK */}
//       {sections.length === 0 && (
//         <div className="text-center py-20">
//           <h1 className="text-4xl font-bold">{event.title}</h1>
//           <p className="text-gray-500 mt-2">
//             No page design yet
//           </p>

//           <div className="mt-6 text-xl text-rose-500">
//             ⏳ {timeLeft}
//           </div>
//         </div>
//       )}

//       {/* ✅ BUILDER RENDER */}
//       {sections.map((section) => (
//         <SectionRendererPublic
//           key={section.id}
//           section={section}
//           event={event}
//           timeLeft={timeLeft}
//         />
//       ))}
//     </div>
//   );
// }
