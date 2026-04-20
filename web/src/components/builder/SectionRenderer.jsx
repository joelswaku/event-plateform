

"use client";

export default function SectionRenderer({ section }) {
  const type = section.section_type; // ✅ FIXED
  const config = section.config || {};

  switch (type) {
    // ================= HERO =================
    case "HERO": {
      const overlayOpacity = (config.overlay_opacity ?? 40) / 100;
      return (
        <section
          className="relative text-center py-20"
          style={
            config.background_image
              ? {
                  backgroundImage: `url(${config.background_image})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }
              : { background: "#f3f4f6" }
          }
        >
          {config.background_image && (
            <div
              className="absolute inset-0"
              style={{ background: `rgba(0,0,0,${overlayOpacity})` }}
            />
          )}
          <div className="relative z-10" style={{ textAlign: config.headline_align ?? "center" }}>
            <h1 className="text-4xl font-bold" style={config.background_image ? { color: "#fff" } : {}}>
              {section.title || "Event Title"}
            </h1>
            <p className="mt-4" style={config.background_image ? { color: "rgba(255,255,255,0.8)" } : { color: "#4b5563" }}>
              {section.body || "Event subtitle"}
            </p>
            {config.cta_text && (
              <button className="mt-6 px-6 py-3 bg-black text-white rounded-xl">
                {config.cta_text}
              </button>
            )}
          </div>
        </section>
      );
    }

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

    case "GALLERY": {
      const layout = config.layout || "grid";
      const images = Array.isArray(config.images) ? config.images : [];

      return (
        <section className="py-16">
          <h2 className="text-center text-2xl font-semibold mb-6">
            {section.title || "Gallery"}
          </h2>

          {images.length === 0 ? (
            <p className="text-center text-gray-400 py-12">
              Upload images to display gallery
            </p>
          ) : layout === "carousel" ? (
            <div className="flex gap-4 overflow-x-auto px-6 pb-2">
              {images.map((img, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={i}
                  src={img}
                  alt={`Gallery image ${i + 1}`}
                  className="min-w-[250px] h-50 rounded-xl object-cover shrink-0 transition-transform hover:scale-105"
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 px-6">
              {images.map((img, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={i}
                  src={img}
                  alt={`Gallery image ${i + 1}`}
                  className="h-48 w-full rounded-xl object-cover transition-transform hover:scale-105 hover:shadow-lg"
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

    // ================= COUPLE =================
    case "COUPLE": {
      const personSlot = (image, name, fallback) => (
        <div className="flex flex-col items-center">
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={image}
              alt={name || fallback}
              className="w-40 h-40 rounded-full object-cover shadow-lg"
            />
          ) : (
            <div className="w-40 h-40 rounded-full bg-gray-200" />
          )}
          <p className="mt-4 font-semibold text-lg">{name || fallback}</p>
        </div>
      );

      return (
        <section className="py-16 text-center">
          <h2 className="text-3xl font-bold mb-10">
            {section.title || "Meet the Couple"}
          </h2>
          <div className="flex flex-col md:flex-row justify-center gap-12">
            {personSlot(config.bride_image, config.bride_name, "Bride")}
            <div className="flex items-center justify-center text-3xl text-gray-300 font-light">♥</div>
            {personSlot(config.groom_image, config.groom_name, "Groom")}
          </div>
          {section.body && (
            <p className="mt-8 text-gray-500 max-w-md mx-auto">{section.body}</p>
          )}
        </section>
      );
    }

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