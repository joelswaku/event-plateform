"use client";
"use client";

import React, { useState, useEffect } from "react";

// ─── Story ───────────────────────────────────────────────────────────────────
export function StorySection({ section, isEditor = false, onEdit }) {
  const config = section.config || {};
  const image = config.story_image;
  const imageRight = config.image_position === "right";

  const imagePanel = (
    <div className="relative aspect-[4/5] w-full overflow-hidden rounded-3xl shadow-xl">
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={image}
          alt="Our Story"
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-rose-50 via-pink-50 to-amber-50">
          {/* decorative botanical frame */}
          <div className="absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 80%, #f9a8d4 0%, transparent 50%), radial-gradient(circle at 80% 20%, #fde68a 0%, transparent 50%)",
            }}
          />
          <div className="relative flex flex-col items-center gap-4 text-center px-8">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/70 shadow-inner">
              <svg className="h-10 w-10 text-rose-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 18h16.5M4.5 5.25h15A.75.75 0 0 1 20.25 6v12a.75.75 0 0 1-.75.75H4.5A.75.75 0 0 1 3.75 18V6A.75.75 0 0 1 4.5 5.25Z" />
              </svg>
            </div>
            {isEditor ? (
              <>
                <p className="text-sm font-semibold text-rose-400">Add your photo</p>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Click the section, then upload a photo<br />to tell your story
                </p>
              </>
            ) : (
              <p className="text-sm italic text-gray-400">Photo coming soon</p>
            )}
          </div>
          {/* corner flourishes */}
          <div className="absolute left-4 top-4 h-10 w-10 rounded-tl-2xl border-l-2 border-t-2 border-rose-200" />
          <div className="absolute right-4 top-4 h-10 w-10 rounded-tr-2xl border-r-2 border-t-2 border-rose-200" />
          <div className="absolute bottom-4 left-4 h-10 w-10 rounded-bl-2xl border-b-2 border-l-2 border-rose-200" />
          <div className="absolute bottom-4 right-4 h-10 w-10 rounded-br-2xl border-b-2 border-r-2 border-rose-200" />
        </div>
      )}
    </div>
  );

  const textPanel = (
    <div className="flex flex-col justify-center">
      <div className="mb-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent to-rose-200" />
        <span className="text-xs font-bold uppercase tracking-[0.3em] text-rose-400">Our Story</span>
        <div className="h-px flex-1 bg-gradient-to-l from-transparent to-rose-200" />
      </div>

      <h2 className="mb-6 text-4xl font-black leading-tight text-gray-900 md:text-5xl">
        {section.title || "How It All Began"}
      </h2>

      <div className="mb-6 h-0.5 w-12 bg-gradient-to-r from-rose-400 to-amber-300" />

      <p className="text-lg leading-relaxed text-gray-600">
        {section.body || (isEditor
          ? "Share the story of how you met, your journey together, and what makes your love unique. Click to edit this section."
          : "")}
      </p>

      {!section.body && !isEditor && null}

      {section.config?.quote && (
        <blockquote className="mt-8 border-l-4 border-rose-300 pl-5 italic text-gray-500">
          "{section.config.quote}"
        </blockquote>
      )}
    </div>
  );

  return (
    <section
      className={`relative overflow-hidden bg-[#faf9f7] py-24 px-6 ${
        isEditor ? "cursor-pointer ring-inset hover:ring-2 hover:ring-indigo-400/60" : ""
      }`}
      onClick={isEditor ? onEdit : undefined}
    >
      {/* ambient background blobs */}
      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-rose-100/40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-amber-100/40 blur-3xl" />

      <div
        className={`relative mx-auto grid max-w-6xl gap-16 md:grid-cols-2 md:items-center ${
          imageRight ? "" : "md:[&>*:first-child]:order-2"
        }`}
      >
        {imageRight ? (
          <>
            {textPanel}
            {imagePanel}
          </>
        ) : (
          <>
            {imagePanel}
            {textPanel}
          </>
        )}
      </div>

      {isEditor && <EditorBadge label="STORY" />}
    </section>
  );
}

// ─── Couple ──────────────────────────────────────────────────────────────────
function CouplePerson({ image, name, role, bio, quote, fallbackGradient, fallbackInitial, isEditor }) {
  const [flipped, setFlipped] = useState(false);

  return (
    <div className="flex flex-col items-center">
      {/* ── Flip card ── */}
      <div
        className="relative w-full max-w-[320px] cursor-pointer"
        style={{ perspective: "1200px" }}
        onClick={(e) => { e.stopPropagation(); setFlipped((f) => !f); }}
        title={quote ? "Click to reveal" : undefined}
      >
        <div
          className="relative transition-all duration-700"
          style={{
            transformStyle: "preserve-3d",
            transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
            aspectRatio: "3/4",
          }}
        >
          {/* Front — photo */}
          <div
            className="absolute inset-0 overflow-hidden rounded-[28px] shadow-2xl"
            style={{ backfaceVisibility: "hidden" }}
          >
            {image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={image}
                alt={name || ""}
                className="h-full w-full object-cover"
              />
            ) : (
              <div
                className={`flex h-full w-full items-center justify-center ${fallbackGradient}`}
              >
                {isEditor ? (
                  <div className="flex flex-col items-center gap-3 text-white/70">
                    <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 18h16.5M4.5 5.25h15A.75.75 0 0 1 20.25 6v12a.75.75 0 0 1-.75.75H4.5A.75.75 0 0 1 3.75 18V6A.75.75 0 0 1 4.5 5.25Z" />
                    </svg>
                    <span className="text-xs font-medium">Upload photo</span>
                  </div>
                ) : (
                  <span className="text-8xl font-thin text-white/50">
                    {fallbackInitial}
                  </span>
                )}
              </div>
            )}
            {/* Vignette */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent rounded-[28px]" />
            {/* Flip hint — only when there is a quote */}
            {(quote || isEditor) && (
              <div className="absolute bottom-4 right-4 flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 backdrop-blur-sm">
                <span className="text-[10px] font-medium text-white">flip</span>
                <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 0 0-3.7-3.7 48.678 48.678 0 0 0-7.324 0 4.006 4.006 0 0 0-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 0 0 3.7 3.7 48.656 48.656 0 0 0 7.324 0 4.006 4.006 0 0 0 3.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3-3 3" />
                </svg>
              </div>
            )}
          </div>

          {/* Back — personal quote */}
          <div
            className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden rounded-[28px] bg-[#0f0e0d] p-8 text-center"
            style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
          >
            <div className="pointer-events-none absolute inset-0 opacity-20"
              style={{
                backgroundImage: "radial-gradient(circle at 30% 70%, #c9a96e33 0%, transparent 60%), radial-gradient(circle at 70% 30%, #f9a8d433 0%, transparent 60%)",
              }}
            />
            <span className="relative mb-4 text-6xl leading-none text-[#c9a96e]/40" style={{ fontFamily: "Georgia, serif" }}>&ldquo;</span>
            <p className="relative text-sm leading-relaxed text-white/80 italic">
              {quote || (isEditor ? `Add a personal quote for ${name || "this person"} in the config panel.` : "")}
            </p>
            <span className="relative mt-4 text-xs tracking-[0.25em] uppercase text-[#c9a96e]/60">— {name}</span>
          </div>
        </div>
      </div>

      {/* ── Text below card ── */}
      <div className="mt-7 text-center">
        {role && (
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.3em] text-[#c9a96e]">
            {role}
          </p>
        )}
        <h3 className="text-2xl font-black text-gray-900 leading-tight">
          {name || fallbackInitial}
        </h3>
        {bio && (
          <p className="mx-auto mt-3 max-w-[280px] text-sm leading-relaxed text-gray-500">
            {bio}
          </p>
        )}
      </div>
    </div>
  );
}

export function CoupleSection({ section, isEditor = false, onEdit }) {
  const config = section.config || {};

  return (
    <section
      className={`relative overflow-hidden bg-[#faf9f6] py-24 px-6 ${
        isEditor ? "cursor-pointer ring-inset hover:ring-2 hover:ring-indigo-400/60" : ""
      }`}
      onClick={isEditor ? onEdit : undefined}
    >
      {/* Ambient blobs */}
      <div className="pointer-events-none absolute -left-40 top-1/2 h-[500px] w-[500px] -translate-y-1/2 rounded-full bg-rose-100/50 blur-3xl" />
      <div className="pointer-events-none absolute -right-40 top-1/2 h-[500px] w-[500px] -translate-y-1/2 rounded-full bg-amber-100/50 blur-3xl" />

      <div className="relative mx-auto max-w-5xl">

        {/* Header */}
        <div className="mb-16 text-center">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.35em] text-[#c9a96e]">
            The Couple
          </p>
          <h2 className="text-4xl font-black text-gray-900 md:text-5xl">
            {section.title || "Meet the Couple"}
          </h2>
          {section.body && (
            <p className="mx-auto mt-4 max-w-xl text-gray-500 leading-relaxed">
              {section.body}
            </p>
          )}
          <div className="mt-6 flex items-center justify-center gap-4">
            <div className="h-px w-20 bg-gradient-to-r from-transparent to-[#c9a96e]/50" />
            <svg className="h-4 w-4 text-[#c9a96e]" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
            </svg>
            <div className="h-px w-20 bg-gradient-to-l from-transparent to-[#c9a96e]/50" />
          </div>
        </div>

        {/* Cards */}
        <div className="grid gap-10 md:grid-cols-[1fr_auto_1fr] md:items-start">
          <CouplePerson
            image={config.bride_image}
            name={config.bride_name || "Partner One"}
            role={config.bride_role || "Bride"}
            bio={config.bride_bio}
            quote={config.bride_quote}
            fallbackGradient="bg-gradient-to-br from-rose-200 via-pink-200 to-rose-300"
            fallbackInitial="A"
            isEditor={isEditor}
          />

          {/* Divider — hidden on mobile */}
          <div className="hidden md:flex flex-col items-center justify-start pt-16 gap-3">
            <div className="h-12 w-px bg-gradient-to-b from-transparent to-[#c9a96e]/40" />
            <span
              className="text-5xl text-[#c9a96e]/30 font-thin select-none"
              style={{ fontFamily: "Georgia, serif" }}
            >
              &amp;
            </span>
            <div className="h-12 w-px bg-gradient-to-t from-transparent to-[#c9a96e]/40" />
          </div>

          <CouplePerson
            image={config.groom_image}
            name={config.groom_name || "Partner Two"}
            role={config.groom_role || "Groom"}
            bio={config.groom_bio}
            quote={config.groom_quote}
            fallbackGradient="bg-gradient-to-br from-slate-300 via-blue-200 to-indigo-300"
            fallbackInitial="B"
            isEditor={isEditor}
          />
        </div>
      </div>

      {isEditor && <EditorBadge label="COUPLE" />}
    </section>
  );
}

// ─── Countdown ───────────────────────────────────────────────────────────────
function calcTimeLeft(targetISO) {
  if (!targetISO) return null;
  const diff = new Date(targetISO) - Date.now();
  if (diff <= 0) return null;
  return {
    Days:    Math.floor(diff / 864e5),
    Hours:   Math.floor((diff / 36e5) % 24),
    Minutes: Math.floor((diff / 6e4) % 60),
    Seconds: Math.floor((diff / 1e3) % 60),
  };
}

export function CountdownSection({ section, isEditor = false, onEdit }) {
  const target = section.config?.starts_at;
  const [timeLeft, setTimeLeft] = useState(() => calcTimeLeft(target));

  useEffect(() => {
    if (!target) return;
    const id = setInterval(() => setTimeLeft(calcTimeLeft(target)), 1000);
    return () => clearInterval(id);
  }, [target]);

  return (
    <section
      className={`relative bg-gray-950 py-20 px-6 text-white text-center ${
        isEditor ? "cursor-pointer ring-inset hover:ring-2 hover:ring-indigo-400/60" : ""
      }`}
      onClick={isEditor ? onEdit : undefined}
    >
      <div className="mx-auto max-w-4xl">
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.3em] text-white/40">Countdown</p>
        <h2 className="text-4xl font-black mb-4">{section.title}</h2>
        {section.body && <p className="text-white/60 mb-10">{section.body}</p>}

        {!target ? (
          <p className="text-white/30 text-sm">Event date not set</p>
        ) : !timeLeft ? (
          <p className="text-2xl font-black text-rose-400">🎉 Happening now!</p>
        ) : (
          <div className="grid grid-cols-4 gap-4 max-w-lg mx-auto">
            {Object.entries(timeLeft).map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <div className="text-4xl font-black tabular-num">
                  {String(value).padStart(2, "0")}
                </div>
                <div className="mt-1 text-[11px] uppercase tracking-widest text-white/40">{label}</div>
              </div>
            ))}
          </div>
        )}
      </div>
      {isEditor && <EditorBadge label="COUNTDOWN" />}
    </section>
  );
}


// ─── Venue ────────────────────────────────────────────────────────────────────
export function VenueSection({ section, isEditor = false, onEdit }) {
  const config = section.config || {};
  const locationLine = [config.city, config.state, config.country].filter(Boolean).join(", ");

  return (
    <section
      className={`relative bg-slate-50 py-20 px-6 ${
        isEditor ? "cursor-pointer ring-inset hover:ring-2 hover:ring-indigo-400/60" : ""
      }`}
      onClick={isEditor ? onEdit : undefined}
    >
      <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-2 md:items-stretch">
        <div>
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.3em] text-gray-400">Venue</p>
          <h2 className="text-4xl font-black text-gray-900 mb-4">{section.title || "Venue & Directions"}</h2>
          {section.body && <p className="text-gray-600 leading-relaxed mb-6">{section.body}</p>}

          <div className="space-y-2 text-sm text-gray-600">
            {config.venue_name && (
              <div className="font-semibold text-gray-800">{config.venue_name}</div>
            )}
            {config.venue_address && <div>📍 {config.venue_address}</div>}
            {locationLine && <div>{locationLine}</div>}
            {!config.venue_name && !config.venue_address && !locationLine && (
              <div className="text-gray-400 italic">Location details coming soon</div>
            )}
            {config.show_parking && <div>🚗 Parking available on-site</div>}
          </div>
        </div>

        <div className="flex min-h-[280px] items-center justify-center rounded-3xl border border-gray-200 bg-gradient-to-br from-gray-200 to-gray-100 text-gray-400 text-sm">
          {config.show_map ? "Map Preview" : "📍 Location"}
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