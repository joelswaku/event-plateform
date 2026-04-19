export default function HeroPublic({ section }) {
    const config = section.config || {};
  
    const align =
      config.headline_align === "left"
        ? "text-left"
        : config.headline_align === "right"
        ? "text-right"
        : "text-center";
  
    return (
      <section className={`py-20 bg-black text-white ${align}`}>
        <h1 className="text-4xl font-bold">{section.title}</h1>
        <p className="mt-4">{section.body}</p>
  
        {config.show_cta && (
          <button className="mt-6 px-6 py-3 bg-white text-black rounded-lg">
            {config.cta_text || "Get Started"}
          </button>
        )}
      </section>
    );
  }