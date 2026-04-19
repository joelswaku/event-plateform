

"use client";

export default function SectionRenderer({ section }) {
  const type = section.section_type; // ✅ FIXED
  const config = section.config || {};

  switch (type) {
    // ================= HERO =================
    case "HERO":
      return (
        <section className="text-center py-20 bg-gray-100">
          <h1 className="text-4xl font-bold">
            {section.title || "Event Title"}
          </h1>
          <p className="mt-4 text-gray-600">
            {section.body || "Event subtitle"}
          </p>

          {config.show_cta && (
            <button className="mt-6 px-6 py-3 bg-black text-white rounded-xl">
              {config.cta_text || "Register"}
            </button>
          )}
        </section>
      );

    // ================= ABOUT =================
    case "ABOUT":
      return (
        <section className="py-16 px-6 max-w-3xl mx-auto">
          <h2 className="text-2xl font-semibold mb-4">
            {section.title || "About"}
          </h2>
          <p className="text-gray-600">
            {section.body || "Event description"}
          </p>
        </section>
      );

    // ================= SCHEDULE =================
    case "SCHEDULE":
      return (
        <section className="py-16 bg-gray-50">
          <h2 className="text-center text-2xl font-semibold mb-6">
            {section.title || "Schedule"}
          </h2>

          <div className="max-w-xl mx-auto space-y-4">
            {(config.items || []).map((item, i) => (
              <div key={i} className="flex justify-between">
                <span>{item.time}</span>
                <span>{item.title}</span>
              </div>
            ))}
          </div>
        </section>
      );

    // ================= GALLERY (🔥 FIXED) =================
    case "GALLERY": {
      const layout = config.layout || "grid";

      return (
        <section className="py-16">
          <h2 className="text-center text-2xl font-semibold mb-6">
            {section.title || "Gallery"}
          </h2>

          {layout === "carousel" ? (
            <div className="flex gap-4 overflow-x-auto px-6">
              {(config.images || []).map((img, i) => (
                <img
                  key={i}
                  src={img}
                  className="min-w-[250px] h-[180px] rounded-xl object-cover"
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 px-6">
              {(config.images || []).map((img, i) => (
                <img
                  key={i}
                  src={img}
                  className="rounded-xl object-cover"
                />
              ))}
            </div>
          )}
        </section>
      );
    }

    // ================= SPEAKERS =================
    case "SPEAKERS":
      return (
        <section className="py-16">
          <h2 className="text-center text-2xl font-semibold mb-6">
            {section.title || "Speakers"}
          </h2>

          <div className="grid md:grid-cols-3 gap-6 px-6">
            {(config.items || []).map((s, i) => (
              <div key={i} className="text-center">
                <div className="h-24 w-24 mx-auto rounded-full bg-gray-200" />
                <h4 className="mt-3 font-semibold">{s.name}</h4>
                <p className="text-sm text-gray-500">{s.role}</p>
              </div>
            ))}
          </div>
        </section>
      );

    // ================= VENUE =================
    case "VENUE":
      return (
        <section className="py-16 bg-gray-50 px-6">
          <h2 className="text-2xl font-semibold mb-4">
            {section.title || "Venue"}
          </h2>
          <p className="text-gray-600">
            {section.body || "Location details"}
          </p>

          {config.show_map && (
            <div className="mt-6 h-64 bg-gray-200 rounded-xl flex items-center justify-center">
              Map
            </div>
          )}
        </section>
      );

    // ================= COUNTDOWN =================
    case "COUNTDOWN":
      return (
        <section className="py-20 text-center bg-black text-white">
          <h2 className="text-3xl font-bold">
            {section.title || "Countdown"}
          </h2>
          <p className="mt-4">{section.body}</p>
        </section>
      );

    // ================= CTA =================
    case "CTA":
      return (
        <section className="py-20 text-center">
          <h2 className="text-2xl font-bold">
            {section.title || "Join us"}
          </h2>

          <button className="mt-6 px-6 py-3 bg-black text-white rounded-xl">
            {config.button_text || "Get Started"}
          </button>
        </section>
      );

    // ================= DEFAULT =================
    default:
      return (
        <div className="p-6 text-red-500">
          Unknown section: {type}
        </div>
      );
  }
}


// "use client";

// export default function SectionRenderer({ section }) {
//   const { type, config } = section;

//   switch (type) {
//     case "HERO":
//       return (
//         <section className="text-center py-20 bg-gray-100">
//           <h1 className="text-4xl font-bold">
//             {config?.title || "Event Title"}
//           </h1>
//           <p className="mt-4 text-gray-600">
//             {config?.subtitle}
//           </p>
//         </section>
//       );

//     case "ABOUT":
//       return (
//         <section className="py-16 px-6 max-w-3xl mx-auto">
//           <h2 className="text-2xl font-semibold mb-4">
//             {config?.title || "About"}
//           </h2>
//           <p className="text-gray-600">{config?.content}</p>
//         </section>
//       );

//     case "SCHEDULE":
//       return (
//         <section className="py-16 bg-gray-50">
//           <h2 className="text-center text-2xl font-semibold mb-6">
//             Schedule
//           </h2>

//           <div className="max-w-xl mx-auto space-y-4">
//             {config?.items?.map((item, i) => (
//               <div key={i} className="flex justify-between">
//                 <span>{item.time}</span>
//                 <span>{item.title}</span>
//               </div>
//             ))}
//           </div>
//         </section>
//       );

//     case "GALLERY":
//       return (
//         <section className="py-16">
//           <div className="grid grid-cols-2 md:grid-cols-3 gap-4 px-6">
//             {config?.images?.map((img, i) => (
//               <img
//                 key={i}
//                 src={img}
//                 className="rounded-xl object-cover"
//               />
//             ))}
//           </div>
//         </section>
//       );

//     case "CTA":
//       return (
//         <section className="py-20 text-center">
//           <h2 className="text-2xl font-bold">
//             {config?.text}
//           </h2>
//         </section>
//       );

//     default:
//       return null;
//   }
// }