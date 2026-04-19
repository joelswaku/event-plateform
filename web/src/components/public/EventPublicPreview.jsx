"use client";

function SectionRenderer({ section }) {
  const config = section.config || {};

  switch (section.section_type) {
    case "HERO":
      return (
        <section className="text-center py-24 bg-black text-white">
          <h1 className="text-4xl font-bold">
            {config.title || section.title || "Event Title"}
          </h1>
          <p className="mt-4 opacity-70">
            {config.subtitle || ""}
          </p>
        </section>
      );

    case "ABOUT":
      return (
        <section className="py-20 max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-2xl font-semibold mb-4">
            {config.title || "About"}
          </h2>
          <p className="text-gray-600">
            {config.content}
          </p>
        </section>
      );

    case "SCHEDULE":
      return (
        <section className="py-20 bg-gray-50">
          <h2 className="text-center text-2xl font-semibold mb-8">
            Schedule
          </h2>

          <div className="max-w-xl mx-auto space-y-4">
            {config.items?.map((item, i) => (
              <div key={i} className="flex justify-between border-b pb-2">
                <span>{item.time}</span>
                <span>{item.title}</span>
              </div>
            ))}
          </div>
        </section>
      );

    case "GALLERY":
      return (
        <section className="py-20 px-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {config.images?.map((img, i) => (
              <img
                key={i}
                src={img}
                className="rounded-xl object-cover"
              />
            ))}
          </div>
        </section>
      );

    case "CTA":
      return (
        <section className="py-20 text-center">
          <h2 className="text-2xl font-bold">
            {config.text || "Join us!"}
          </h2>
        </section>
      );

    default:
      return null;
  }
}

export default function EventPublicPreview({ sections = [] }) {
  if (!sections.length) {
    return (
      <div className="text-center py-20 text-gray-400">
        No content
      </div>
    );
  }

  return (
    <div>
      {sections.map((section) => (
        <SectionRenderer key={section.id} section={section} />
      ))}
    </div>
  );
}