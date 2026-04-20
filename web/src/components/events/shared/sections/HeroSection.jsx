"use client";

export default function HeroSection({ section, isEditor = false, onEdit }) {
  const config = section.config || {};
  const align =
    config.headline_align === "left"
      ? "text-left items-start"
      : config.headline_align === "right"
      ? "text-right items-end"
      : "text-center items-center";

  const overlayOpacity = config.overlay_opacity ?? 40;

  return (
    <section
      className={`relative flex min-h-[480px] flex-col justify-center overflow-hidden ${align} ${
        isEditor ? "cursor-pointer ring-inset hover:ring-2 hover:ring-indigo-400/60" : ""
      }`}
      style={{
        background: config.background_color
          ? config.background_color
          : "linear-gradient(135deg, #0f0c29, #302b63, #24243e)",
      }}
      onClick={isEditor ? onEdit : undefined}
    >
      {/* Background image */}
      {config.background_image && (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${config.background_image})` }}
        />
      )}

      {/* Overlay */}
      <div
        className="absolute inset-0"
        style={{ background: `rgba(0,0,0,${overlayOpacity / 100})` }}
      />

      {/* Content */}
      <div className={`relative z-10 mx-auto w-full max-w-5xl px-6 py-24 flex flex-col ${align} gap-6`}>
        <p className="text-xs font-bold uppercase tracking-[0.35em] text-white/60">
          {config.eyebrow || ""}
        </p>

        <h1 className="text-5xl font-black leading-tight text-white drop-shadow-lg md:text-7xl">
          {section.title || "Welcome"}
        </h1>

        {section.body && (
          <p className="max-w-2xl text-lg text-white/80 leading-relaxed">
            {section.body}
          </p>
        )}

        {config.show_cta && (
          <div className="flex flex-wrap gap-4 mt-2">
            <button className="rounded-2xl bg-white px-8 py-3.5 text-sm font-bold text-black shadow-xl transition hover:bg-white/90 active:scale-95">
              {config.cta_text || "Register Now"}
            </button>
            {config.secondary_cta_text && (
              <button className="rounded-2xl border border-white/30 px-8 py-3.5 text-sm font-bold text-white transition hover:bg-white/10">
                {config.secondary_cta_text}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Editor badge */}
      {isEditor && (
        <div className="absolute right-3 top-3 z-20 rounded-full bg-indigo-600 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow">
          HERO
        </div>
      )}
    </section>
  );
}
