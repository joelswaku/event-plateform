// ── Style-based template collection ───────────────────────────────────────────
// 18 templates across 6 styles (3 per style: 2 free, 1 premium)
// Each section config carries _theme so the renderer knows which CSS vars to use.

export function canAccessTemplate(template, userPlan) {
  return template.tier === "free" || userPlan === "premium";
}

export const STYLE_TEMPLATES = [

  // ── CLASSIC ──────────────────────────────────────────────────────────────────

  {
    id: "classic-grand",
    name: "Classic Grand",
    style: "CLASSIC",
    tier: "free",
    description: "A stately layout with champagne accents and timeless serif typography.",
    design: {
      fonts:  { heading: "Georgia, serif",     body: "system-ui, sans-serif" },
      colors: { bg: "#FAF9F6", accent: "#C9A96E", dark: "#1C1917", text: "#1C1917" },
    },
    assets: {
      hero_image:    "https://images.unsplash.com/photo-1519741497674-611481863552?w=1400&q=85",
      cover_image:   "https://images.unsplash.com/photo-1519741497674-611481863552?w=640&q=80",
      gallery_images: [
        "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800&q=80",
        "https://images.unsplash.com/photo-1478146059778-26b43b8b0a86?w=800&q=80",
        "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800&q=80",
        "https://images.unsplash.com/photo-1469371670807-013ccf25f16a?w=800&q=80",
      ],
    },
    sections: [
      { type: "HERO",     config: { _theme: "CLASSIC", headline_align: "center", overlay_opacity: 55, eyebrow: "You Are Invited" } },
      { type: "ABOUT",    config: { _theme: "CLASSIC" } },
      { type: "SCHEDULE", config: { _theme: "CLASSIC" } },
      { type: "VENUE",    config: { _theme: "CLASSIC" } },
      { type: "GALLERY",  config: { _theme: "CLASSIC", layout: "grid" } },
      { type: "FAQ",      config: { _theme: "CLASSIC" } },
      { type: "CTA",      config: { _theme: "CLASSIC" } },
    ],
  },

  {
    id: "classic-intimate",
    name: "Classic Intimate",
    style: "CLASSIC",
    tier: "free",
    description: "A focused, warm layout ideal for private gatherings and milestone celebrations.",
    design: {
      fonts:  { heading: "Georgia, serif",     body: "system-ui, sans-serif" },
      colors: { bg: "#FAF9F6", accent: "#C9A96E", dark: "#1C1917", text: "#1C1917" },
    },
    assets: {
      hero_image:    "https://images.unsplash.com/photo-1469371670807-013ccf25f16a?w=1400&q=85",
      cover_image:   "https://images.unsplash.com/photo-1469371670807-013ccf25f16a?w=640&q=80",
      gallery_images: [],
    },
    sections: [
      { type: "HERO",      config: { _theme: "CLASSIC", headline_align: "center", overlay_opacity: 60, eyebrow: "A Special Occasion" } },
      { type: "ABOUT",     config: { _theme: "CLASSIC" } },
      { type: "COUNTDOWN", config: { _theme: "CLASSIC" } },
      { type: "VENUE",     config: { _theme: "CLASSIC" } },
      { type: "FAQ",       config: { _theme: "CLASSIC" } },
      { type: "CTA",       config: { _theme: "CLASSIC" } },
    ],
  },

  {
    id: "classic-complete",
    name: "Classic Complete",
    style: "CLASSIC",
    tier: "premium",
    description: "The full classic experience — couple portraits, story, schedule, gallery, and registry.",
    design: {
      fonts:  { heading: "Georgia, serif",     body: "system-ui, sans-serif" },
      colors: { bg: "#FAF9F6", accent: "#C9A96E", dark: "#1C1917", text: "#1C1917" },
    },
    assets: {
      hero_image:    "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=1400&q=85",
      cover_image:   "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=640&q=80",
      gallery_images: [
        "https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80",
        "https://images.unsplash.com/photo-1469371670807-013ccf25f16a?w=800&q=80",
        "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800&q=80",
        "https://images.unsplash.com/photo-1478146059778-26b43b8b0a86?w=800&q=80",
        "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&q=80",
        "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80",
      ],
    },
    sections: [
      { type: "HERO",     config: { _theme: "CLASSIC", headline_align: "center", overlay_opacity: 55, eyebrow: "We Are Getting Married" } },
      { type: "COUPLE",   config: { _theme: "CLASSIC" } },
      { type: "STORY",    config: { _theme: "CLASSIC" } },
      { type: "COUNTDOWN",config: { _theme: "CLASSIC" } },
      { type: "SCHEDULE", config: { _theme: "CLASSIC" } },
      { type: "VENUE",    config: { _theme: "CLASSIC" } },
      { type: "GALLERY",  config: { _theme: "CLASSIC", layout: "grid" } },
      { type: "REGISTRY", config: { _theme: "CLASSIC" } },
      { type: "FAQ",      config: { _theme: "CLASSIC" } },
      { type: "CTA",      config: { _theme: "CLASSIC" } },
    ],
  },

  // ── ELEGANT ───────────────────────────────────────────────────────────────────

  {
    id: "elegant-blossom",
    name: "Blossom",
    style: "ELEGANT",
    tier: "free",
    description: "Warm ivory tones and rose terracotta details for a romantically refined event.",
    design: {
      fonts:  { heading: "Garamond, Georgia, serif", body: "system-ui, sans-serif" },
      colors: { bg: "#FDF5EF", accent: "#B87355", dark: "#271A14", text: "#271A14" },
    },
    assets: {
      hero_image:    "https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=1400&q=85",
      cover_image:   "https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=640&q=80",
      gallery_images: [
        "https://images.unsplash.com/photo-1561369036-c9e2bcca6d52?w=800&q=80",
        "https://images.unsplash.com/photo-1490750967868-88df5691cc84?w=800&q=80",
        "https://images.unsplash.com/photo-1444021465936-c6ca81d39b84?w=800&q=80",
      ],
    },
    sections: [
      { type: "HERO",     config: { _theme: "ELEGANT", headline_align: "center", overlay_opacity: 50, eyebrow: "With Love" } },
      { type: "ABOUT",    config: { _theme: "ELEGANT" } },
      { type: "SCHEDULE", config: { _theme: "ELEGANT" } },
      { type: "VENUE",    config: { _theme: "ELEGANT" } },
      { type: "GALLERY",  config: { _theme: "ELEGANT", layout: "grid" } },
      { type: "FAQ",      config: { _theme: "ELEGANT" } },
      { type: "CTA",      config: { _theme: "ELEGANT" } },
    ],
  },

  {
    id: "elegant-rosegarden",
    name: "Rose Garden",
    style: "ELEGANT",
    tier: "free",
    description: "A flowing, gallery-forward layout bathed in soft warmth.",
    design: {
      fonts:  { heading: "Garamond, Georgia, serif", body: "system-ui, sans-serif" },
      colors: { bg: "#FDF5EF", accent: "#B87355", dark: "#271A14", text: "#271A14" },
    },
    assets: {
      hero_image:    "https://images.unsplash.com/photo-1487530811015-780780cc5afc?w=1400&q=85",
      cover_image:   "https://images.unsplash.com/photo-1487530811015-780780cc5afc?w=640&q=80",
      gallery_images: [
        "https://images.unsplash.com/photo-1490750967868-88df5691cc84?w=800&q=80",
        "https://images.unsplash.com/photo-1444021465936-c6ca81d39b84?w=800&q=80",
        "https://images.unsplash.com/photo-1561369036-c9e2bcca6d52?w=800&q=80",
        "https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=800&q=80",
      ],
    },
    sections: [
      { type: "HERO",      config: { _theme: "ELEGANT", headline_align: "center", overlay_opacity: 45, eyebrow: "Celebrate With Us" } },
      { type: "ABOUT",     config: { _theme: "ELEGANT" } },
      { type: "COUNTDOWN", config: { _theme: "ELEGANT" } },
      { type: "GALLERY",   config: { _theme: "ELEGANT", layout: "grid" } },
      { type: "FAQ",       config: { _theme: "ELEGANT" } },
      { type: "CTA",       config: { _theme: "ELEGANT" } },
    ],
  },

  {
    id: "elegant-ivorydream",
    name: "Ivory Dream",
    style: "ELEGANT",
    tier: "premium",
    description: "Full romantic experience — couple feature, story, countdown, gallery, and registry.",
    design: {
      fonts:  { heading: "Garamond, Georgia, serif", body: "system-ui, sans-serif" },
      colors: { bg: "#FDF5EF", accent: "#B87355", dark: "#271A14", text: "#271A14" },
    },
    assets: {
      hero_image:    "https://images.unsplash.com/photo-1533658057034-e83b42ad8b24?w=1400&q=85",
      cover_image:   "https://images.unsplash.com/photo-1533658057034-e83b42ad8b24?w=640&q=80",
      gallery_images: [
        "https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=800&q=80",
        "https://images.unsplash.com/photo-1487530811015-780780cc5afc?w=800&q=80",
        "https://images.unsplash.com/photo-1490750967868-88df5691cc84?w=800&q=80",
        "https://images.unsplash.com/photo-1444021465936-c6ca81d39b84?w=800&q=80",
        "https://images.unsplash.com/photo-1561369036-c9e2bcca6d52?w=800&q=80",
        "https://images.unsplash.com/photo-1533658057034-e83b42ad8b24?w=800&q=80",
      ],
    },
    sections: [
      { type: "HERO",     config: { _theme: "ELEGANT", headline_align: "center", overlay_opacity: 50, eyebrow: "Our Special Day" } },
      { type: "COUPLE",   config: { _theme: "ELEGANT" } },
      { type: "STORY",    config: { _theme: "ELEGANT" } },
      { type: "COUNTDOWN",config: { _theme: "ELEGANT" } },
      { type: "SCHEDULE", config: { _theme: "ELEGANT" } },
      { type: "VENUE",    config: { _theme: "ELEGANT" } },
      { type: "GALLERY",  config: { _theme: "ELEGANT", layout: "grid" } },
      { type: "REGISTRY", config: { _theme: "ELEGANT" } },
      { type: "FAQ",      config: { _theme: "ELEGANT" } },
      { type: "CTA",      config: { _theme: "ELEGANT" } },
    ],
  },

  // ── MODERN ────────────────────────────────────────────────────────────────────

  {
    id: "modern-bold",
    name: "Bold Statement",
    style: "MODERN",
    tier: "free",
    description: "Geometric, left-aligned typography with strong indigo accents and a sharp grid layout.",
    design: {
      fonts:  { heading: "system-ui, sans-serif", body: "system-ui, sans-serif" },
      colors: { bg: "#F4F4F8", accent: "#5B5FED", dark: "#0A0A14", text: "#0F0F1A" },
    },
    assets: {
      hero_image:    "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1400&q=85",
      cover_image:   "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=640&q=80",
      gallery_images: [
        "https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=800&q=80",
        "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=800&q=80",
        "https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&q=80",
      ],
    },
    sections: [
      { type: "HERO",     config: { _theme: "MODERN", headline_align: "left", overlay_opacity: 70, eyebrow: "REGISTER NOW" } },
      { type: "ABOUT",    config: { _theme: "MODERN" } },
      { type: "SPEAKERS", config: { _theme: "MODERN" } },
      { type: "SCHEDULE", config: { _theme: "MODERN" } },
      { type: "VENUE",    config: { _theme: "MODERN" } },
      { type: "FAQ",      config: { _theme: "MODERN" } },
      { type: "CTA",      config: { _theme: "MODERN", button_text: "Register Now" } },
    ],
  },

  {
    id: "modern-clean",
    name: "Clean Cut",
    style: "MODERN",
    tier: "free",
    description: "Stripped-down modern essentials — crisp, purposeful, and fast.",
    design: {
      fonts:  { heading: "system-ui, sans-serif", body: "system-ui, sans-serif" },
      colors: { bg: "#F4F4F8", accent: "#5B5FED", dark: "#0A0A14", text: "#0F0F1A" },
    },
    assets: {
      hero_image:    "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1400&q=85",
      cover_image:   "https://images.unsplash.com/photo-1497366216548-37526070297c?w=640&q=80",
      gallery_images: [],
    },
    sections: [
      { type: "HERO",      config: { _theme: "MODERN", headline_align: "left", overlay_opacity: 75 } },
      { type: "ABOUT",     config: { _theme: "MODERN" } },
      { type: "COUNTDOWN", config: { _theme: "MODERN" } },
      { type: "VENUE",     config: { _theme: "MODERN" } },
      { type: "FAQ",       config: { _theme: "MODERN" } },
      { type: "CTA",       config: { _theme: "MODERN" } },
    ],
  },

  {
    id: "modern-pro",
    name: "Urban Pro",
    style: "MODERN",
    tier: "premium",
    description: "The complete modern professional package with speakers, tickets, and full schedule.",
    design: {
      fonts:  { heading: "system-ui, sans-serif", body: "system-ui, sans-serif" },
      colors: { bg: "#F4F4F8", accent: "#5B5FED", dark: "#0A0A14", text: "#0F0F1A" },
    },
    assets: {
      hero_image:    "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=1400&q=85",
      cover_image:   "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=640&q=80",
      gallery_images: [
        "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80",
        "https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=800&q=80",
        "https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&q=80",
        "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80",
      ],
    },
    sections: [
      { type: "HERO",     config: { _theme: "MODERN", headline_align: "left", overlay_opacity: 70, eyebrow: "ANNUAL CONFERENCE" } },
      { type: "ABOUT",    config: { _theme: "MODERN" } },
      { type: "SPEAKERS", config: { _theme: "MODERN" } },
      { type: "SCHEDULE", config: { _theme: "MODERN" } },
      { type: "TICKETS",  config: { _theme: "MODERN" } },
      { type: "VENUE",    config: { _theme: "MODERN" } },
      { type: "GALLERY",  config: { _theme: "MODERN", layout: "carousel" } },
      { type: "FAQ",      config: { _theme: "MODERN" } },
      { type: "CTA",      config: { _theme: "MODERN", button_text: "Get Your Ticket" } },
    ],
  },

  // ── MINIMAL ───────────────────────────────────────────────────────────────────

  {
    id: "minimal-whitespace",
    name: "White Space",
    style: "MINIMAL",
    tier: "free",
    description: "Maximum breathing room, minimum distraction. Let your content speak.",
    design: {
      fonts:  { heading: "system-ui, sans-serif", body: "system-ui, sans-serif" },
      colors: { bg: "#F9F9F9", accent: "#888888", dark: "#111111", text: "#222222" },
    },
    assets: {
      hero_image:    "https://images.unsplash.com/photo-1617196034183-421b4040ed20?w=1400&q=85",
      cover_image:   "https://images.unsplash.com/photo-1617196034183-421b4040ed20?w=640&q=80",
      gallery_images: [],
    },
    sections: [
      { type: "HERO",  config: { _theme: "MINIMAL", headline_align: "center", overlay_opacity: 60 } },
      { type: "ABOUT", config: { _theme: "MINIMAL" } },
      { type: "VENUE", config: { _theme: "MINIMAL" } },
      { type: "FAQ",   config: { _theme: "MINIMAL" } },
      { type: "CTA",   config: { _theme: "MINIMAL" } },
    ],
  },

  {
    id: "minimal-pureform",
    name: "Pure Form",
    style: "MINIMAL",
    tier: "free",
    description: "A structured, schedule-centric layout with subtle graphite tones.",
    design: {
      fonts:  { heading: "system-ui, sans-serif", body: "system-ui, sans-serif" },
      colors: { bg: "#F9F9F9", accent: "#888888", dark: "#111111", text: "#222222" },
    },
    assets: {
      hero_image:    "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1400&q=85",
      cover_image:   "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=640&q=80",
      gallery_images: [],
    },
    sections: [
      { type: "HERO",     config: { _theme: "MINIMAL", headline_align: "center", overlay_opacity: 65 } },
      { type: "ABOUT",    config: { _theme: "MINIMAL" } },
      { type: "SCHEDULE", config: { _theme: "MINIMAL" } },
      { type: "VENUE",    config: { _theme: "MINIMAL" } },
      { type: "CTA",      config: { _theme: "MINIMAL" } },
    ],
  },

  {
    id: "minimal-essential",
    name: "Essential",
    style: "MINIMAL",
    tier: "premium",
    description: "A complete minimal experience — countdown, speakers, schedule, and refined CTA.",
    design: {
      fonts:  { heading: "system-ui, sans-serif", body: "system-ui, sans-serif" },
      colors: { bg: "#F9F9F9", accent: "#888888", dark: "#111111", text: "#222222" },
    },
    assets: {
      hero_image:    "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=1400&q=85",
      cover_image:   "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=640&q=80",
      gallery_images: [
        "https://images.unsplash.com/photo-1617196034183-421b4040ed20?w=800&q=80",
        "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&q=80",
        "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&q=80",
      ],
    },
    sections: [
      { type: "HERO",      config: { _theme: "MINIMAL", headline_align: "center", overlay_opacity: 60 } },
      { type: "ABOUT",     config: { _theme: "MINIMAL" } },
      { type: "COUNTDOWN", config: { _theme: "MINIMAL" } },
      { type: "SCHEDULE",  config: { _theme: "MINIMAL" } },
      { type: "SPEAKERS",  config: { _theme: "MINIMAL" } },
      { type: "VENUE",     config: { _theme: "MINIMAL" } },
      { type: "FAQ",       config: { _theme: "MINIMAL" } },
      { type: "CTA",       config: { _theme: "MINIMAL" } },
    ],
  },

  // ── LUXURY ────────────────────────────────────────────────────────────────────

  {
    id: "luxury-obsidian",
    name: "Obsidian",
    style: "LUXURY",
    tier: "free",
    description: "Deep black canvas with glowing gold details. Immersive and commanding.",
    design: {
      fonts:  { heading: "Georgia, serif",              body: "system-ui, sans-serif" },
      colors: { bg: "#0D0C0A", accent: "#D4AF6F", dark: "#0D0C0A", text: "#EDE8DF" },
    },
    assets: {
      hero_image:    "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1400&q=85",
      cover_image:   "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=640&q=80",
      gallery_images: [
        "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&q=80",
        "https://images.unsplash.com/photo-1551882547-ff40c4a49ce5?w=800&q=80",
        "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&q=80",
      ],
    },
    sections: [
      { type: "HERO",     config: { _theme: "LUXURY", headline_align: "center", overlay_opacity: 65, eyebrow: "An Exclusive Evening" } },
      { type: "ABOUT",    config: { _theme: "LUXURY" } },
      { type: "SCHEDULE", config: { _theme: "LUXURY" } },
      { type: "VENUE",    config: { _theme: "LUXURY" } },
      { type: "GALLERY",  config: { _theme: "LUXURY", layout: "grid" } },
      { type: "FAQ",      config: { _theme: "LUXURY" } },
      { type: "CTA",      config: { _theme: "LUXURY", button_text: "Reserve Your Place" } },
    ],
  },

  {
    id: "luxury-darkopulence",
    name: "Dark Opulence",
    style: "LUXURY",
    tier: "free",
    description: "Dramatic black and gold with countdown timer and gallery showcase.",
    design: {
      fonts:  { heading: "Georgia, serif",              body: "system-ui, sans-serif" },
      colors: { bg: "#0D0C0A", accent: "#D4AF6F", dark: "#0D0C0A", text: "#EDE8DF" },
    },
    assets: {
      hero_image:    "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1400&q=85",
      cover_image:   "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=640&q=80",
      gallery_images: [
        "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80",
        "https://images.unsplash.com/photo-1551882547-ff40c4a49ce5?w=800&q=80",
        "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&q=80",
        "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800&q=80",
      ],
    },
    sections: [
      { type: "HERO",      config: { _theme: "LUXURY", headline_align: "center", overlay_opacity: 70, eyebrow: "A Night to Remember" } },
      { type: "ABOUT",     config: { _theme: "LUXURY" } },
      { type: "COUNTDOWN", config: { _theme: "LUXURY" } },
      { type: "GALLERY",   config: { _theme: "LUXURY", layout: "grid" } },
      { type: "FAQ",       config: { _theme: "LUXURY" } },
      { type: "CTA",       config: { _theme: "LUXURY", button_text: "Secure Your Seat" } },
    ],
  },

  {
    id: "luxury-goldreserve",
    name: "Gold Reserve",
    style: "LUXURY",
    tier: "premium",
    description: "The definitive luxury event — couple feature, full timeline, gallery, registry, and grand CTA.",
    design: {
      fonts:  { heading: "Georgia, serif",              body: "system-ui, sans-serif" },
      colors: { bg: "#0D0C0A", accent: "#D4AF6F", dark: "#0D0C0A", text: "#EDE8DF" },
    },
    assets: {
      hero_image:    "https://images.unsplash.com/photo-1551882547-ff40c4a49ce5?w=1400&q=85",
      cover_image:   "https://images.unsplash.com/photo-1551882547-ff40c4a49ce5?w=640&q=80",
      gallery_images: [
        "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80",
        "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&q=80",
        "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&q=80",
        "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800&q=80",
        "https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80",
        "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800&q=80",
      ],
    },
    sections: [
      { type: "HERO",     config: { _theme: "LUXURY", headline_align: "center", overlay_opacity: 65, eyebrow: "An Extraordinary Occasion" } },
      { type: "COUPLE",   config: { _theme: "LUXURY" } },
      { type: "STORY",    config: { _theme: "LUXURY" } },
      { type: "COUNTDOWN",config: { _theme: "LUXURY" } },
      { type: "SCHEDULE", config: { _theme: "LUXURY" } },
      { type: "VENUE",    config: { _theme: "LUXURY" } },
      { type: "GALLERY",  config: { _theme: "LUXURY", layout: "grid" } },
      { type: "REGISTRY", config: { _theme: "LUXURY" } },
      { type: "FAQ",      config: { _theme: "LUXURY" } },
      { type: "CTA",      config: { _theme: "LUXURY", button_text: "Join Us for the Evening" } },
    ],
  },

  // ── FUN ───────────────────────────────────────────────────────────────────────

  {
    id: "fun-partytime",
    name: "Party Time",
    style: "FUN",
    tier: "free",
    description: "Warm amber energy with big countdown and bold gallery. Born to celebrate.",
    design: {
      fonts:  { heading: "system-ui, sans-serif", body: "system-ui, sans-serif" },
      colors: { bg: "#FFFBF0", accent: "#F59E0B", dark: "#1C1407", text: "#1C2333" },
    },
    assets: {
      hero_image:    "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=1400&q=85",
      cover_image:   "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=640&q=80",
      gallery_images: [
        "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&q=80",
        "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&q=80",
        "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&q=80",
        "https://images.unsplash.com/photo-1506157786151-b8491531f063?w=800&q=80",
      ],
    },
    sections: [
      { type: "HERO",      config: { _theme: "FUN", headline_align: "center", overlay_opacity: 55, eyebrow: "Let's Celebrate!" } },
      { type: "ABOUT",     config: { _theme: "FUN" } },
      { type: "COUNTDOWN", config: { _theme: "FUN" } },
      { type: "VENUE",     config: { _theme: "FUN" } },
      { type: "GALLERY",   config: { _theme: "FUN", layout: "grid" } },
      { type: "FAQ",       config: { _theme: "FUN" } },
      { type: "CTA",       config: { _theme: "FUN", button_text: "I'm Coming!" } },
    ],
  },

  {
    id: "fun-celebration",
    name: "Celebration",
    style: "FUN",
    tier: "free",
    description: "Schedule-forward fun template for events with an energetic agenda.",
    design: {
      fonts:  { heading: "system-ui, sans-serif", body: "system-ui, sans-serif" },
      colors: { bg: "#FFFBF0", accent: "#F59E0B", dark: "#1C1407", text: "#1C2333" },
    },
    assets: {
      hero_image:    "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=1400&q=85",
      cover_image:   "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=640&q=80",
      gallery_images: [],
    },
    sections: [
      { type: "HERO",     config: { _theme: "FUN", headline_align: "center", overlay_opacity: 60, eyebrow: "You're Invited!" } },
      { type: "ABOUT",    config: { _theme: "FUN" } },
      { type: "SCHEDULE", config: { _theme: "FUN" } },
      { type: "VENUE",    config: { _theme: "FUN" } },
      { type: "GALLERY",  config: { _theme: "FUN", layout: "carousel" } },
      { type: "CTA",      config: { _theme: "FUN", button_text: "Count Me In!" } },
    ],
  },

  {
    id: "fun-festival",
    name: "Festival Vibes",
    style: "FUN",
    tier: "premium",
    description: "The full festival package — lineup, schedule, venue, gallery, and high-energy CTA.",
    design: {
      fonts:  { heading: "system-ui, sans-serif", body: "system-ui, sans-serif" },
      colors: { bg: "#FFFBF0", accent: "#F59E0B", dark: "#1C1407", text: "#1C2333" },
    },
    assets: {
      hero_image:    "https://images.unsplash.com/photo-1506157786151-b8491531f063?w=1400&q=85",
      cover_image:   "https://images.unsplash.com/photo-1506157786151-b8491531f063?w=640&q=80",
      gallery_images: [
        "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800&q=80",
        "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&q=80",
        "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&q=80",
        "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&q=80",
        "https://images.unsplash.com/photo-1506157786151-b8491531f063?w=800&q=80",
      ],
    },
    sections: [
      { type: "HERO",      config: { _theme: "FUN", headline_align: "center", overlay_opacity: 60, eyebrow: "The Big Event" } },
      { type: "ABOUT",     config: { _theme: "FUN" } },
      { type: "COUNTDOWN", config: { _theme: "FUN" } },
      { type: "SPEAKERS",  config: { _theme: "FUN" } },
      { type: "SCHEDULE",  config: { _theme: "FUN" } },
      { type: "VENUE",     config: { _theme: "FUN" } },
      { type: "GALLERY",   config: { _theme: "FUN", layout: "grid" } },
      { type: "FAQ",       config: { _theme: "FUN" } },
      { type: "CTA",       config: { _theme: "FUN", button_text: "Get My Ticket!" } },
    ],
  },
];

// Grouped by style for easy lookup
export const TEMPLATES_BY_STYLE = STYLE_TEMPLATES.reduce((acc, t) => {
  if (!acc[t.style]) acc[t.style] = [];
  acc[t.style].push(t);
  return acc;
}, {});

// Legacy export so existing imports from weddingTemplates still resolve
export const WEDDING_TEMPLATES = STYLE_TEMPLATES;
export const FREE_TEMPLATES    = STYLE_TEMPLATES.filter((t) => t.tier === "free");
export const PREMIUM_TEMPLATES = STYLE_TEMPLATES.filter((t) => t.tier === "premium");

export function getTemplateById(id) {
  return STYLE_TEMPLATES.find((t) => t.id === id) || null;
}
