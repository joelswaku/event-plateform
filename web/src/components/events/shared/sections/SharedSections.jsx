"use client";

// ─── Story ───────────────────────────────────────────────────────────────────
export function StorySection({ section, isEditor = false, onEdit }) {
  return (
    <section
      className={`relative bg-[#faf9f7] py-20 px-6 ${
        isEditor ? "cursor-pointer ring-inset hover:ring-2 hover:ring-indigo-400/60" : ""
      }`}
      onClick={isEditor ? onEdit : undefined}
    >
      <div className="mx-auto grid max-w-6xl gap-12 md:grid-cols-2 md:items-center">
        <div className="aspect-[4/5] w-full rounded-3xl bg-gradient-to-br from-rose-100 via-pink-100 to-amber-50 shadow-inner" />
        <div>
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.3em] text-rose-400">Our Story</p>
          <h2 className="text-4xl font-black text-gray-900 leading-tight mb-6">
            {section.title || "Our Story"}
          </h2>
          <p className="text-gray-600 text-lg leading-relaxed">{section.body || ""}</p>
        </div>
      </div>
      {isEditor && <EditorBadge label="STORY" />}
    </section>
  );
}

// ─── Couple ──────────────────────────────────────────────────────────────────
function CouplePerson({ image, name, fallbackGradient, fallbackName }) {
  return (
    <div className="rounded-3xl border border-gray-100 p-8 shadow-sm flex flex-col items-center">
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={image}
          alt={name || fallbackName}
          className="h-36 w-36 rounded-full object-cover shadow-md"
        />
      ) : (
        <div className={`h-36 w-36 rounded-full ${fallbackGradient}`} />
      )}
      <h3 className="mt-5 text-xl font-bold text-gray-900">{name || fallbackName}</h3>
    </div>
  );
}

export function CoupleSection({ section, isEditor = false, onEdit }) {
  const config = section.config || {};

  return (
    <section
      className={`bg-white py-20 px-6 text-center ${
        isEditor ? "cursor-pointer ring-inset hover:ring-2 hover:ring-indigo-400/60" : ""
      }`}
      onClick={isEditor ? onEdit : undefined}
    >
      <div className="mx-auto max-w-4xl">
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.3em] text-gray-400">The Couple</p>
        <h2 className="text-4xl font-black text-gray-900 mb-4">{section.title || "Meet the Couple"}</h2>
        {section.body && <p className="text-gray-500 mb-12">{section.body}</p>}

        <div className="grid gap-8 md:grid-cols-2">
          <CouplePerson
            image={config.bride_image}
            name={config.bride_name}
            fallbackGradient="bg-gradient-to-br from-pink-200 to-rose-300"
            fallbackName="Partner One"
          />
          <CouplePerson
            image={config.groom_image}
            name={config.groom_name}
            fallbackGradient="bg-gradient-to-br from-blue-200 to-indigo-300"
            fallbackName="Partner Two"
          />
        </div>
      </div>
      {isEditor && <EditorBadge label="COUPLE" />}
    </section>
  );
}

// ─── Countdown ───────────────────────────────────────────────────────────────
export function CountdownSection({ section, timeLeft, isEditor = false, onEdit }) {
  const parts = timeLeft ? timeLeft.split(" ") : ["0d", "0h", "0m"];

  return (
    <section
      className={`bg-gray-950 py-20 px-6 text-white text-center ${
        isEditor ? "cursor-pointer ring-inset hover:ring-2 hover:ring-indigo-400/60" : ""
      }`}
      onClick={isEditor ? onEdit : undefined}
    >
      <div className="mx-auto max-w-4xl">
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.3em] text-white/40">Countdown</p>
        <h2 className="text-4xl font-black mb-4">{section.title}</h2>
        <p className="text-white/60 mb-10">{section.body}</p>

        <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
          {parts.map((item, i) => {
            const num = item.replace(/\D/g, "");
            const unit = item.replace(/\d/g, "").toUpperCase() === "D" ? "Days" : item.replace(/\d/g, "").toUpperCase() === "H" ? "Hours" : "Minutes";
            return (
              <div key={i} className="rounded-2xl border border-white/10 bg-white/5 p-6">
                <div className="text-4xl font-black">{num || "0"}</div>
                <div className="mt-1 text-[11px] uppercase tracking-widest text-white/40">{unit}</div>
              </div>
            );
          })}
        </div>
      </div>
      {isEditor && <EditorBadge label="COUNTDOWN" />}
    </section>
  );
}

// ─── Venue ────────────────────────────────────────────────────────────────────
export function VenueSection({ section, isEditor = false, onEdit }) {
  return (
    <section
      className={`bg-slate-50 py-20 px-6 ${
        isEditor ? "cursor-pointer ring-inset hover:ring-2 hover:ring-indigo-400/60" : ""
      }`}
      onClick={isEditor ? onEdit : undefined}
    >
      <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-2 md:items-stretch">
        <div>
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.3em] text-gray-400">Venue</p>
          <h2 className="text-4xl font-black text-gray-900 mb-4">{section.title}</h2>
          <p className="text-gray-600 leading-relaxed mb-6">{section.body}</p>
          <div className="space-y-2 text-sm text-gray-500">
            <div>📍 {section.config?.address || "Address TBA"}</div>
            {section.config?.show_parking && <div>🚗 Parking available on-site</div>}
            <div>🕒 Doors open 1 hour before start</div>
          </div>
        </div>
        <div className="flex min-h-[280px] items-center justify-center rounded-3xl border border-gray-200 bg-gradient-to-br from-gray-200 to-gray-100 text-gray-400 text-sm">
          {section.config?.show_map ? "Map Preview" : "📍 Location"}
        </div>
      </div>
      {isEditor && <EditorBadge label="VENUE" />}
    </section>
  );
}

// ─── Registry ─────────────────────────────────────────────────────────────────
export function RegistrySection({ section, isEditor = false, onEdit }) {
  const items = section.config?.items || [
    { name: "Amazon", url: "#" },
    { name: "Target", url: "#" },
    { name: "Gift Fund", url: "#" },
  ];

  return (
    <section
      className={`bg-white py-20 px-6 text-center ${
        isEditor ? "cursor-pointer ring-inset hover:ring-2 hover:ring-indigo-400/60" : ""
      }`}
      onClick={isEditor ? onEdit : undefined}
    >
      <div className="mx-auto max-w-4xl">
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.3em] text-gray-400">Registry</p>
        <h2 className="text-4xl font-black text-gray-900 mb-3">{section.title}</h2>
        <p className="text-gray-500 mb-10">{section.body}</p>
        <div className="grid gap-4 md:grid-cols-3">
          {items.map((item, i) => (
            <a
              key={i}
              href={item.url || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-2xl border border-gray-200 p-6 shadow-sm transition hover:shadow-md hover:-translate-y-1"
            >
              <h4 className="font-bold text-gray-900">{item.name}</h4>
              <p className="mt-1 text-sm text-gray-400">View Registry →</p>
            </a>
          ))}
        </div>
      </div>
      {isEditor && <EditorBadge label="REGISTRY" />}
    </section>
  );
}

// ─── Gallery ──────────────────────────────────────────────────────────────────
export function GallerySection({ section, isEditor = false, onEdit }) {
  const layout = section.config?.layout || "grid";
  const images = Array.isArray(section.config?.images) ? section.config.images : [];
  const placeholders = isEditor ? Array(layout === "carousel" ? 5 : 6).fill(null) : [];
  const displayImages = images.length > 0 ? images : placeholders;

  return (
    <section
      className={`relative bg-white py-20 px-6 ${
        isEditor ? "cursor-pointer ring-inset hover:ring-2 hover:ring-indigo-400/60" : ""
      }`}
      onClick={isEditor ? onEdit : undefined}
    >
      <div className="mx-auto max-w-6xl">
        <h2 className="mb-8 text-4xl font-black text-gray-900">{section.title}</h2>

        {images.length === 0 && !isEditor ? (
          <p className="py-12 text-center text-gray-400">Upload images to display gallery</p>
        ) : layout === "carousel" ? (
          <div className="flex gap-4 overflow-x-auto pb-4">
            {displayImages.map((img, i) => (
              <div
                key={i}
                className="min-w-[280px] h-[200px] rounded-2xl overflow-hidden bg-gradient-to-br from-gray-200 to-gray-100 shrink-0"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {img && <img src={img} alt={`Gallery ${i + 1}`} className="h-full w-full object-cover transition-transform hover:scale-105" />}
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {displayImages.map((img, i) => (
              <div
                key={i}
                className="aspect-[4/3] rounded-2xl overflow-hidden bg-gradient-to-br from-gray-200 to-gray-100"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {img && <img src={img} alt={`Gallery ${i + 1}`} className="h-full w-full object-cover transition-transform hover:scale-105" />}
              </div>
            ))}
          </div>
        )}
      </div>
      {isEditor && <EditorBadge label="GALLERY" />}
    </section>
  );
}

// ─── Schedule ─────────────────────────────────────────────────────────────────
export function ScheduleSection({ section, event, isEditor = false, onEdit }) {
  const items = event?.schedule_items || section.config?.items || [];

  const mockItems = [
    { title: "Registration & Welcome", starts_at: "9:00 AM", location: "Main Hall" },
    { title: "Keynote", starts_at: "10:00 AM", location: "Auditorium" },
    { title: "Lunch Break", starts_at: "12:00 PM", location: "Dining Area" },
  ];

  const displayItems = items.length > 0 ? items : isEditor ? mockItems : [];

  return (
    <section
      className={`bg-slate-50 py-20 px-6 ${
        isEditor ? "cursor-pointer ring-inset hover:ring-2 hover:ring-indigo-400/60" : ""
      }`}
      onClick={isEditor ? onEdit : undefined}
    >
      <div className="mx-auto max-w-4xl">
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.3em] text-gray-400">Agenda</p>
        <h2 className="mb-10 text-4xl font-black text-gray-900">{section.title}</h2>

        <div className="space-y-4">
          {displayItems.map((item, i) => (
            <div key={item.id || i} className="flex gap-6 rounded-2xl bg-white border border-gray-100 p-5 shadow-sm">
              <div className="min-w-[90px] text-sm font-bold text-gray-800">
                {item.starts_at && typeof item.starts_at === "string" && item.starts_at.includes("T")
                  ? new Date(item.starts_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                  : item.starts_at || "—"}
              </div>
              <div>
                <h4 className="font-bold text-gray-900">{item.title}</h4>
                {item.location && <p className="text-sm text-gray-400 mt-1">📍 {item.location}</p>}
                {item.description && <p className="text-sm text-gray-500 mt-1">{item.description}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
      {isEditor && <EditorBadge label="SCHEDULE" />}
    </section>
  );
}

// ─── Speakers ─────────────────────────────────────────────────────────────────
export function SpeakersSection({ section, event, isEditor = false, onEdit }) {
  const speakers = event?.speakers || section.config?.items || [];
  const mockSpeakers = [
    { full_name: "Speaker Name", title: "Role / Company" },
    { full_name: "Speaker Name", title: "Role / Company" },
    { full_name: "Speaker Name", title: "Role / Company" },
  ];
  const displaySpeakers = speakers.length > 0 ? speakers : isEditor ? mockSpeakers : [];

  return (
    <section
      className={`bg-white py-20 px-6 ${
        isEditor ? "cursor-pointer ring-inset hover:ring-2 hover:ring-indigo-400/60" : ""
      }`}
      onClick={isEditor ? onEdit : undefined}
    >
      <div className="mx-auto max-w-5xl">
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.3em] text-gray-400">Speakers</p>
        <h2 className="mb-10 text-4xl font-black text-gray-900">{section.title}</h2>

        <div className="grid gap-6 md:grid-cols-3">
          {displaySpeakers.map((s, i) => (
            <div key={s.id || i} className="rounded-3xl border border-gray-100 p-6 text-center shadow-sm">
              <div className="mx-auto h-20 w-20 overflow-hidden rounded-full bg-gradient-to-br from-gray-200 to-gray-100">
                {s.avatar_url && <img src={s.avatar_url} className="h-full w-full object-cover" alt="" />}
              </div>
              <h4 className="mt-4 font-bold text-gray-900">{s.full_name}</h4>
              {s.title && <p className="text-sm text-gray-400 mt-1">{s.title}</p>}
              {s.bio && <p className="text-sm text-gray-500 mt-2 line-clamp-2">{s.bio}</p>}
            </div>
          ))}
        </div>
      </div>
      {isEditor && <EditorBadge label="SPEAKERS" />}
    </section>
  );
}

// ─── Tickets ──────────────────────────────────────────────────────────────────
export function TicketsSection({ section, isEditor = false, onEdit }) {
  const mockTickets = [
    { name: "Standard", price: 20, currency: "USD" },
    { name: "VIP", price: 50, currency: "USD" },
    { name: "Group (x5)", price: 90, currency: "USD" },
  ];

  return (
    <section
      className={`bg-slate-50 py-20 px-6 ${
        isEditor ? "cursor-pointer ring-inset hover:ring-2 hover:ring-indigo-400/60" : ""
      }`}
      onClick={isEditor ? onEdit : undefined}
    >
      <div className="mx-auto max-w-4xl">
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.3em] text-gray-400">Tickets</p>
        <h2 className="mb-3 text-4xl font-black text-gray-900">{section.title}</h2>
        {section.body && <p className="text-gray-500 mb-10">{section.body}</p>}

        <div className="grid gap-4 md:grid-cols-3">
          {mockTickets.map((t, i) => (
            <div key={i} className="rounded-2xl bg-white border border-gray-200 p-6 shadow-sm flex flex-col">
              <h4 className="font-bold text-gray-900">{t.name}</h4>
              <div className="text-3xl font-black text-gray-900 my-3">${t.price}</div>
              <button className="mt-auto w-full rounded-xl bg-gray-900 py-3 text-sm font-bold text-white transition hover:bg-black">
                Select
              </button>
            </div>
          ))}
        </div>
      </div>
      {isEditor && <EditorBadge label="TICKETS" />}
    </section>
  );
}

// ─── Donations ────────────────────────────────────────────────────────────────
export function DonationsSection({ section, isEditor = false, onEdit }) {
  const amounts = ["$10", "$25", "$50", "$100", "Custom"];

  return (
    <section
      className={`bg-gray-950 py-20 px-6 text-white text-center ${
        isEditor ? "cursor-pointer ring-inset hover:ring-2 hover:ring-indigo-400/60" : ""
      }`}
      onClick={isEditor ? onEdit : undefined}
    >
      <div className="mx-auto max-w-3xl">
        <h2 className="text-4xl font-black mb-4">{section.title}</h2>
        <p className="text-white/60 mb-10">{section.body}</p>
        <div className="flex flex-wrap justify-center gap-3">
          {amounts.map((a) => (
            <button
              key={a}
              className="rounded-xl border border-white/20 bg-white/5 px-6 py-3 text-sm font-bold text-white transition hover:bg-white/10"
            >
              {a}
            </button>
          ))}
        </div>
      </div>
      {isEditor && <EditorBadge label="DONATIONS" />}
    </section>
  );
}

// ─── FAQ ──────────────────────────────────────────────────────────────────────
export function FAQSection({ section, isEditor = false, onEdit }) {
  const items = section.config?.items || [];
  const mock = [
    { question: "What time does it start?", answer: "Doors open 1 hour before the event." },
    { question: "Is parking available?", answer: "Yes, free parking on-site." },
    { question: "Can I bring a plus one?", answer: "Depends on your invitation." },
  ];
  const displayItems = items.length > 0 ? items : isEditor ? mock : [];

  return (
    <section
      className={`bg-slate-50 py-20 px-6 ${
        isEditor ? "cursor-pointer ring-inset hover:ring-2 hover:ring-indigo-400/60" : ""
      }`}
      onClick={isEditor ? onEdit : undefined}
    >
      <div className="mx-auto max-w-3xl">
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.3em] text-gray-400">FAQ</p>
        <h2 className="mb-10 text-4xl font-black text-gray-900">{section.title}</h2>

        <div className="space-y-4">
          {displayItems.map((item, i) => (
            <details key={i} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm group">
              <summary className="font-bold text-gray-900 cursor-pointer list-none flex justify-between items-center">
                {item.question}
                <span className="text-gray-400 group-open:rotate-180 transition-transform">▾</span>
              </summary>
              <p className="mt-3 text-gray-500 text-sm leading-relaxed">{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
      {isEditor && <EditorBadge label="FAQ" />}
    </section>
  );
}

// ─── CTA ──────────────────────────────────────────────────────────────────────
export function CTASection({ section, isEditor = false, onEdit }) {
  return (
    <section
      className={`bg-black py-24 px-6 text-white text-center ${
        isEditor ? "cursor-pointer ring-inset hover:ring-2 hover:ring-indigo-400/60" : ""
      }`}
      onClick={isEditor ? onEdit : undefined}
    >
      <div className="mx-auto max-w-3xl">
        <h2 className="text-5xl font-black mb-4 leading-tight">{section.title || "Join Us"}</h2>
        <p className="text-white/60 text-lg mb-10">{section.body}</p>
        <button className="rounded-2xl bg-white px-10 py-4 text-sm font-black text-black shadow-2xl transition hover:bg-white/90 active:scale-95">
          {section.config?.button_text || "Get Started"}
        </button>
      </div>
      {isEditor && <EditorBadge label="CTA" />}
    </section>
  );
}

// ─── Editor badge helper ──────────────────────────────────────────────────────
function EditorBadge({ label }) {
  return (
    <div className="absolute right-3 top-3 z-20 rounded-full bg-indigo-600 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow pointer-events-none">
      {label}
    </div>
  );
}
export function AboutSection({ section, isEditor = false, onEdit }) {
  return (
    <section
      className={`bg-white py-20 px-6 text-center ${
        isEditor ? "cursor-pointer ring-inset hover:ring-2 hover:ring-indigo-400/60" : ""
      }`}
      onClick={isEditor ? onEdit : undefined}
    >
      <div className="mx-auto max-w-3xl">
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.3em] text-gray-400">
          About
        </p>

        <h2 className="text-4xl font-black text-gray-900 mb-4">
          {section.title || "About This Event"}
        </h2>

        <p className="text-gray-600 text-lg leading-relaxed">
          {section.body || "Add your event description here."}
        </p>
      </div>
    </section>
  );
}