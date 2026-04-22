import Image from "next/image";
import Link from "next/link";

function TemplateCard({ template: t }) {
  return (
    <div className="group relative rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer">
      <div className="relative overflow-hidden" style={{ aspectRatio: "3/4" }}>
        <Image
          src={t.assets.cover_image}
          alt={t.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          loading="lazy"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-linear-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        <div className="absolute top-2 left-2">
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              t.tier === "premium"
                ? "bg-amber-500 text-white"
                : "bg-white/90 text-gray-700"
            }`}
          >
            {t.tier === "premium" ? "⭐ Premium" : "Free"}
          </span>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-2 opacity-0 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
          <Link
            href="/register"
            className="block w-full text-center py-1.5 rounded-lg bg-white text-gray-900 text-xs font-bold hover:bg-amber-400 hover:text-white transition-colors"
          >
            Use This Template
          </Link>
        </div>
      </div>

      <div className="p-2.5 bg-white">
        <p className="text-xs font-semibold text-gray-900 truncate">{t.name}</p>
        <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-1">
          {t.description}
        </p>
      </div>
    </div>
  );
}

export default function TemplatesSection({ freeTemplates, premiumTemplates }) {
  return (
    <section id="templates" className="py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        {/* Header */}
        <div className="text-center mb-14">
          <span className="text-amber-600 text-sm font-bold uppercase tracking-widest">
            Templates
          </span>
          <h2 className="mt-2 text-4xl md:text-5xl font-black text-gray-900 tracking-tight">
            Find your perfect look
          </h2>
          <p className="mt-4 text-gray-500 max-w-xl mx-auto text-lg">
            Every template is crafted by professional designers and fully
            customisable — no design skills needed.
          </p>
        </div>

        {/* Free */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <h3 className="text-xl font-bold text-gray-900">Free Templates</h3>
            <span className="px-2.5 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-bold">
              {freeTemplates.length} included
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {freeTemplates.map((t) => (
              <TemplateCard key={t.id} template={t} />
            ))}
          </div>
        </div>

        {/* Premium */}
        <div>
          <div className="flex items-center gap-3 mb-6">
            <h3 className="text-xl font-bold text-gray-900">
              Premium Templates
            </h3>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-bold">
              ⭐ {premiumTemplates.length} premium
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {premiumTemplates.map((t) => (
              <TemplateCard key={t.id} template={t} />
            ))}
          </div>
        </div>

        <div className="text-center mt-12">
          <Link
            href="/register"
            className="inline-flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white font-bold px-8 py-3.5 rounded-2xl transition-all shadow-lg text-sm"
          >
            Start Building for Free →
          </Link>
        </div>
      </div>
    </section>
  );
}
