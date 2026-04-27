// ── Style-based template collection ───────────────────────────────────────────
// Free tier: all CLASSIC style templates.
// All other styles require Premium.
// Each template carries an `eventTypes` array for category-aware filtering.

export const FREE_STYLE = "CLASSIC";

export function canAccessTemplate(template, userPlan) {
  if (userPlan === "premium") return true;
  return template.style === FREE_STYLE;
}

export const FREE_STARTER_TEMPLATE_ID = "classic-grand";

// ── Categories ────────────────────────────────────────────────────────────────
export const TEMPLATE_CATEGORIES = {
  SOCIAL:        { label: "Social & Celebrations", emoji: "🎉", types: ["birthday","anniversary","baby_shower","bridal_shower","gender_reveal","graduation","private_party","family_reunion","engagement_party"] },
  CORPORATE:     { label: "Corporate & Professional", emoji: "💼", types: ["conference","seminar","workshop","meeting","networking","product_launch","company_party","training","corporate_event","corporate"] },
  ENTERTAINMENT: { label: "Entertainment & Shows", emoji: "🎵", types: ["concert","festival","live_show","nightclub","theater","comedy","sports","exhibition"] },
  LIFE:          { label: "Life Events", emoji: "💍", types: ["wedding","engagement","funeral"] },
  RELIGIOUS:     { label: "Religious & Community", emoji: "✨", types: ["church","charity","community"] },
};

export function getCategoryForType(eventType) {
  if (!eventType) return null;
  const t = String(eventType).toLowerCase().trim();
  for (const [key, cat] of Object.entries(TEMPLATE_CATEGORIES)) {
    if (cat.types.includes(t)) return key;
  }
  return null;
}

export const STYLE_TEMPLATES = [

  // ══════════════════════════════════════════════════════════════════════════════
  // CLASSIC (Free)
  // ══════════════════════════════════════════════════════════════════════════════

  {
    id: "classic-grand",
    name: "Classic Grand",
    style: "CLASSIC",
    tier: "free",
    category: "LIFE",
    eventTypes: ["wedding","engagement","anniversary"],
    description: "A stately layout with champagne accents and timeless serif typography.",
    design: {
      fonts:  { heading: "Georgia, serif", body: "system-ui, sans-serif" },
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
    category: "SOCIAL",
    eventTypes: ["birthday","anniversary","graduation","private_party","family_reunion"],
    description: "A focused, warm layout ideal for private gatherings and milestone celebrations.",
    design: {
      fonts:  { heading: "Georgia, serif", body: "system-ui, sans-serif" },
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
    tier: "free",
    category: "LIFE",
    eventTypes: ["wedding","engagement"],
    description: "The full classic experience — couple portraits, story, schedule, gallery, and registry.",
    design: {
      fonts:  { heading: "Georgia, serif", body: "system-ui, sans-serif" },
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
      ],
    },
    sections: [
      { type: "HERO",      config: { _theme: "CLASSIC", headline_align: "center", overlay_opacity: 55, eyebrow: "We Are Getting Married" } },
      { type: "COUPLE",    config: { _theme: "CLASSIC" } },
      { type: "STORY",     config: { _theme: "CLASSIC" } },
      { type: "COUNTDOWN", config: { _theme: "CLASSIC" } },
      { type: "SCHEDULE",  config: { _theme: "CLASSIC" } },
      { type: "VENUE",     config: { _theme: "CLASSIC" } },
      { type: "GALLERY",   config: { _theme: "CLASSIC", layout: "grid" } },
      { type: "REGISTRY",  config: { _theme: "CLASSIC" } },
      { type: "FAQ",       config: { _theme: "CLASSIC" } },
      { type: "CTA",       config: { _theme: "CLASSIC" } },
    ],
  },

  // ── CLASSIC: Social ───────────────────────────────────────────────────────────

  {
    id: "classic-birthday",
    name: "Birthday Classic",
    style: "CLASSIC",
    tier: "free",
    category: "SOCIAL",
    eventTypes: ["birthday","private_party"],
    description: "A warm, timeless birthday celebration layout with gallery and countdown.",
    design: {
      fonts:  { heading: "Georgia, serif", body: "system-ui, sans-serif" },
      colors: { bg: "#FAF9F6", accent: "#C9A96E", dark: "#1C1917", text: "#1C1917" },
    },
    assets: {
      hero_image:    "https://images.unsplash.com/photo-1527529482837-4698179dc6ce?w=1400&q=85",
      cover_image:   "https://images.unsplash.com/photo-1527529482837-4698179dc6ce?w=640&q=80",
      gallery_images: [
        "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800&q=80",
        "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&q=80",
      ],
    },
    sections: [
      { type: "HERO",      config: { _theme: "CLASSIC", headline_align: "center", overlay_opacity: 55, eyebrow: "You're Invited!" } },
      { type: "ABOUT",     config: { _theme: "CLASSIC" } },
      { type: "COUNTDOWN", config: { _theme: "CLASSIC" } },
      { type: "VENUE",     config: { _theme: "CLASSIC" } },
      { type: "GALLERY",   config: { _theme: "CLASSIC", layout: "grid" } },
      { type: "CTA",       config: { _theme: "CLASSIC", button_text: "RSVP Now" } },
    ],
  },

  {
    id: "classic-graduation",
    name: "Graduation Day",
    style: "CLASSIC",
    tier: "free",
    category: "SOCIAL",
    eventTypes: ["graduation"],
    description: "Celebrate the graduate with a dignified layout featuring schedule and gallery.",
    design: {
      fonts:  { heading: "Georgia, serif", body: "system-ui, sans-serif" },
      colors: { bg: "#FAF9F6", accent: "#C9A96E", dark: "#1C1917", text: "#1C1917" },
    },
    assets: {
      hero_image:    "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1400&q=85",
      cover_image:   "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=640&q=80",
      gallery_images: [],
    },
    sections: [
      { type: "HERO",     config: { _theme: "CLASSIC", headline_align: "center", overlay_opacity: 55, eyebrow: "Class of 2025" } },
      { type: "ABOUT",    config: { _theme: "CLASSIC" } },
      { type: "SCHEDULE", config: { _theme: "CLASSIC" } },
      { type: "VENUE",    config: { _theme: "CLASSIC" } },
      { type: "FAQ",      config: { _theme: "CLASSIC" } },
      { type: "CTA",      config: { _theme: "CLASSIC", button_text: "Attend Ceremony" } },
    ],
  },

  {
    id: "classic-corporate",
    name: "Professional Classic",
    style: "CLASSIC",
    tier: "free",
    category: "CORPORATE",
    eventTypes: ["conference","seminar","meeting","corporate","corporate_event"],
    description: "A clean, professional classic layout for corporate gatherings and seminars.",
    design: {
      fonts:  { heading: "Georgia, serif", body: "system-ui, sans-serif" },
      colors: { bg: "#FAF9F6", accent: "#C9A96E", dark: "#1C1917", text: "#1C1917" },
    },
    assets: {
      hero_image:    "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1400&q=85",
      cover_image:   "https://images.unsplash.com/photo-1497366216548-37526070297c?w=640&q=80",
      gallery_images: [],
    },
    sections: [
      { type: "HERO",     config: { _theme: "CLASSIC", headline_align: "left", overlay_opacity: 65, eyebrow: "Join Us" } },
      { type: "ABOUT",    config: { _theme: "CLASSIC" } },
      { type: "SPEAKERS", config: { _theme: "CLASSIC" } },
      { type: "SCHEDULE", config: { _theme: "CLASSIC" } },
      { type: "VENUE",    config: { _theme: "CLASSIC" } },
      { type: "FAQ",      config: { _theme: "CLASSIC" } },
      { type: "CTA",      config: { _theme: "CLASSIC", button_text: "Register Now" } },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════════
  // ELEGANT (Premium)
  // ══════════════════════════════════════════════════════════════════════════════

  {
    id: "elegant-blossom",
    name: "Blossom",
    style: "ELEGANT",
    tier: "premium",
    category: "LIFE",
    eventTypes: ["wedding","engagement","anniversary"],
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
    tier: "premium",
    category: "SOCIAL",
    eventTypes: ["birthday","anniversary","baby_shower","bridal_shower"],
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
    category: "LIFE",
    eventTypes: ["wedding","engagement"],
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
      ],
    },
    sections: [
      { type: "HERO",      config: { _theme: "ELEGANT", headline_align: "center", overlay_opacity: 50, eyebrow: "Our Special Day" } },
      { type: "COUPLE",    config: { _theme: "ELEGANT" } },
      { type: "STORY",     config: { _theme: "ELEGANT" } },
      { type: "COUNTDOWN", config: { _theme: "ELEGANT" } },
      { type: "SCHEDULE",  config: { _theme: "ELEGANT" } },
      { type: "VENUE",     config: { _theme: "ELEGANT" } },
      { type: "GALLERY",   config: { _theme: "ELEGANT", layout: "grid" } },
      { type: "REGISTRY",  config: { _theme: "ELEGANT" } },
      { type: "FAQ",       config: { _theme: "ELEGANT" } },
      { type: "CTA",       config: { _theme: "ELEGANT" } },
    ],
  },

  {
    id: "elegant-birthday",
    name: "Chic Birthday",
    style: "ELEGANT",
    tier: "premium",
    category: "SOCIAL",
    eventTypes: ["birthday","anniversary","bridal_shower"],
    description: "A sophisticated birthday layout with elegant typography and warm gallery.",
    design: {
      fonts:  { heading: "Garamond, Georgia, serif", body: "system-ui, sans-serif" },
      colors: { bg: "#FDF5EF", accent: "#B87355", dark: "#271A14", text: "#271A14" },
    },
    assets: {
      hero_image:    "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1400&q=85",
      cover_image:   "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=640&q=80",
      gallery_images: [
        "https://images.unsplash.com/photo-1527529482837-4698179dc6ce?w=800&q=80",
        "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&q=80",
      ],
    },
    sections: [
      { type: "HERO",      config: { _theme: "ELEGANT", headline_align: "center", overlay_opacity: 50, eyebrow: "A Milestone Celebration" } },
      { type: "ABOUT",     config: { _theme: "ELEGANT" } },
      { type: "COUNTDOWN", config: { _theme: "ELEGANT" } },
      { type: "GALLERY",   config: { _theme: "ELEGANT", layout: "grid" } },
      { type: "VENUE",     config: { _theme: "ELEGANT" } },
      { type: "CTA",       config: { _theme: "ELEGANT", button_text: "Save the Date" } },
    ],
  },

  {
    id: "elegant-theater",
    name: "Stage & Screen",
    style: "ELEGANT",
    tier: "premium",
    category: "ENTERTAINMENT",
    eventTypes: ["theater","live_show","exhibition","comedy"],
    description: "A refined layout for theater, shows, and cultural events with ticketing.",
    design: {
      fonts:  { heading: "Garamond, Georgia, serif", body: "system-ui, sans-serif" },
      colors: { bg: "#FDF5EF", accent: "#B87355", dark: "#271A14", text: "#271A14" },
    },
    assets: {
      hero_image:    "https://images.unsplash.com/photo-1503095396549-807759245b35?w=1400&q=85",
      cover_image:   "https://images.unsplash.com/photo-1503095396549-807759245b35?w=640&q=80",
      gallery_images: [],
    },
    sections: [
      { type: "HERO",     config: { _theme: "ELEGANT", headline_align: "center", overlay_opacity: 65, eyebrow: "One Night Only" } },
      { type: "ABOUT",    config: { _theme: "ELEGANT" } },
      { type: "SPEAKERS", config: { _theme: "ELEGANT" } },
      { type: "SCHEDULE", config: { _theme: "ELEGANT" } },
      { type: "TICKETS",  config: { _theme: "ELEGANT" } },
      { type: "VENUE",    config: { _theme: "ELEGANT" } },
      { type: "FAQ",      config: { _theme: "ELEGANT" } },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════════
  // MODERN (Premium)
  // ══════════════════════════════════════════════════════════════════════════════

  {
    id: "modern-bold",
    name: "Bold Statement",
    style: "MODERN",
    tier: "premium",
    category: "CORPORATE",
    eventTypes: ["conference","seminar","product_launch","networking","corporate_event","corporate"],
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
    tier: "premium",
    category: "CORPORATE",
    eventTypes: ["meeting","workshop","training","seminar"],
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
    category: "CORPORATE",
    eventTypes: ["conference","seminar","product_launch","corporate","corporate_event"],
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

  {
    id: "modern-concert",
    name: "Neon Nights",
    style: "MODERN",
    tier: "premium",
    category: "ENTERTAINMENT",
    eventTypes: ["concert","live_show","nightclub","festival","sports"],
    description: "High-energy dark modern layout built for concerts, shows, and live entertainment.",
    design: {
      fonts:  { heading: "system-ui, sans-serif", body: "system-ui, sans-serif" },
      colors: { bg: "#F4F4F8", accent: "#5B5FED", dark: "#0A0A14", text: "#0F0F1A" },
    },
    assets: {
      hero_image:    "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=1400&q=85",
      cover_image:   "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=640&q=80",
      gallery_images: [
        "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800&q=80",
        "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&q=80",
        "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&q=80",
      ],
    },
    sections: [
      { type: "HERO",     config: { _theme: "MODERN", headline_align: "center", overlay_opacity: 75, eyebrow: "LIVE EXPERIENCE" } },
      { type: "ABOUT",    config: { _theme: "MODERN" } },
      { type: "SPEAKERS", config: { _theme: "MODERN" } },
      { type: "SCHEDULE", config: { _theme: "MODERN" } },
      { type: "TICKETS",  config: { _theme: "MODERN" } },
      { type: "VENUE",    config: { _theme: "MODERN" } },
      { type: "GALLERY",  config: { _theme: "MODERN", layout: "carousel" } },
      { type: "FAQ",      config: { _theme: "MODERN" } },
      { type: "CTA",      config: { _theme: "MODERN", button_text: "Buy Tickets" } },
    ],
  },

  {
    id: "modern-launch",
    name: "Product Drop",
    style: "MODERN",
    tier: "premium",
    category: "CORPORATE",
    eventTypes: ["product_launch","networking","company_party"],
    description: "Sharp and promotional — built for product launches and brand reveal events.",
    design: {
      fonts:  { heading: "system-ui, sans-serif", body: "system-ui, sans-serif" },
      colors: { bg: "#F4F4F8", accent: "#5B5FED", dark: "#0A0A14", text: "#0F0F1A" },
    },
    assets: {
      hero_image:    "https://images.unsplash.com/photo-1552664730-d307ca884978?w=1400&q=85",
      cover_image:   "https://images.unsplash.com/photo-1552664730-d307ca884978?w=640&q=80",
      gallery_images: [],
    },
    sections: [
      { type: "HERO",      config: { _theme: "MODERN", headline_align: "left", overlay_opacity: 70, eyebrow: "EXCLUSIVE LAUNCH EVENT" } },
      { type: "ABOUT",     config: { _theme: "MODERN" } },
      { type: "COUNTDOWN", config: { _theme: "MODERN" } },
      { type: "SPEAKERS",  config: { _theme: "MODERN" } },
      { type: "SCHEDULE",  config: { _theme: "MODERN" } },
      { type: "TICKETS",   config: { _theme: "MODERN" } },
      { type: "VENUE",     config: { _theme: "MODERN" } },
      { type: "FAQ",       config: { _theme: "MODERN" } },
      { type: "CTA",       config: { _theme: "MODERN", button_text: "Secure Your Spot" } },
    ],
  },

  {
    id: "modern-networking",
    name: "Connect & Grow",
    style: "MODERN",
    tier: "premium",
    category: "CORPORATE",
    eventTypes: ["networking","meeting","company_party","workshop"],
    description: "Professional networking event with speakers, schedule, and registration.",
    design: {
      fonts:  { heading: "system-ui, sans-serif", body: "system-ui, sans-serif" },
      colors: { bg: "#F4F4F8", accent: "#5B5FED", dark: "#0A0A14", text: "#0F0F1A" },
    },
    assets: {
      hero_image:    "https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=1400&q=85",
      cover_image:   "https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=640&q=80",
      gallery_images: [],
    },
    sections: [
      { type: "HERO",     config: { _theme: "MODERN", headline_align: "left", overlay_opacity: 70, eyebrow: "NETWORKING EVENT" } },
      { type: "ABOUT",    config: { _theme: "MODERN" } },
      { type: "SPEAKERS", config: { _theme: "MODERN" } },
      { type: "SCHEDULE", config: { _theme: "MODERN" } },
      { type: "VENUE",    config: { _theme: "MODERN" } },
      { type: "FAQ",      config: { _theme: "MODERN" } },
      { type: "CTA",      config: { _theme: "MODERN", button_text: "Reserve Your Seat" } },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════════
  // MINIMAL (Premium)
  // ══════════════════════════════════════════════════════════════════════════════

  {
    id: "minimal-whitespace",
    name: "White Space",
    style: "MINIMAL",
    tier: "premium",
    category: "CORPORATE",
    eventTypes: ["meeting","seminar","training","workshop"],
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
    tier: "premium",
    category: "CORPORATE",
    eventTypes: ["conference","seminar","training","corporate","corporate_event"],
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
    category: "CORPORATE",
    eventTypes: ["conference","seminar","networking","workshop","product_launch"],
    description: "A complete minimal experience — countdown, speakers, schedule, and refined CTA.",
    design: {
      fonts:  { heading: "system-ui, sans-serif", body: "system-ui, sans-serif" },
      colors: { bg: "#F9F9F9", accent: "#888888", dark: "#111111", text: "#222222" },
    },
    assets: {
      hero_image:    "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=1400&q=85",
      cover_image:   "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=640&q=80",
      gallery_images: [],
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

  {
    id: "minimal-exhibition",
    name: "Gallery Opening",
    style: "MINIMAL",
    tier: "premium",
    category: "ENTERTAINMENT",
    eventTypes: ["exhibition","theater","live_show"],
    description: "A clean, art-forward layout for exhibitions and cultural events.",
    design: {
      fonts:  { heading: "system-ui, sans-serif", body: "system-ui, sans-serif" },
      colors: { bg: "#F9F9F9", accent: "#888888", dark: "#111111", text: "#222222" },
    },
    assets: {
      hero_image:    "https://images.unsplash.com/photo-1608501078713-8e445a709b39?w=1400&q=85",
      cover_image:   "https://images.unsplash.com/photo-1608501078713-8e445a709b39?w=640&q=80",
      gallery_images: [
        "https://images.unsplash.com/photo-1577720580479-7d839d829c73?w=800&q=80",
        "https://images.unsplash.com/photo-1461360370896-922624d12aa1?w=800&q=80",
      ],
    },
    sections: [
      { type: "HERO",     config: { _theme: "MINIMAL", headline_align: "center", overlay_opacity: 55, eyebrow: "Opening Night" } },
      { type: "ABOUT",    config: { _theme: "MINIMAL" } },
      { type: "SCHEDULE", config: { _theme: "MINIMAL" } },
      { type: "TICKETS",  config: { _theme: "MINIMAL" } },
      { type: "VENUE",    config: { _theme: "MINIMAL" } },
      { type: "GALLERY",  config: { _theme: "MINIMAL", layout: "grid" } },
      { type: "FAQ",      config: { _theme: "MINIMAL" } },
    ],
  },

  {
    id: "minimal-funeral",
    name: "In Memoriam",
    style: "MINIMAL",
    tier: "premium",
    category: "LIFE",
    eventTypes: ["funeral"],
    description: "A peaceful, dignified layout for memorial services and celebrations of life.",
    design: {
      fonts:  { heading: "system-ui, sans-serif", body: "system-ui, sans-serif" },
      colors: { bg: "#F9F9F9", accent: "#888888", dark: "#111111", text: "#222222" },
    },
    assets: {
      hero_image:    "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1400&q=85",
      cover_image:   "https://images.unsplash.com/photo-1497366216548-37526070297c?w=640&q=80",
      gallery_images: [],
    },
    sections: [
      { type: "HERO",     config: { _theme: "MINIMAL", headline_align: "center", overlay_opacity: 50, eyebrow: "In Loving Memory" } },
      { type: "ABOUT",    config: { _theme: "MINIMAL" } },
      { type: "SCHEDULE", config: { _theme: "MINIMAL" } },
      { type: "VENUE",    config: { _theme: "MINIMAL" } },
      { type: "GALLERY",  config: { _theme: "MINIMAL", layout: "grid" } },
      { type: "CTA",      config: { _theme: "MINIMAL", button_text: "RSVP to Service" } },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════════
  // LUXURY (Premium)
  // ══════════════════════════════════════════════════════════════════════════════

  {
    id: "luxury-obsidian",
    name: "Obsidian",
    style: "LUXURY",
    tier: "premium",
    category: "SOCIAL",
    eventTypes: ["private_party","birthday","anniversary","gala"],
    description: "Deep black canvas with glowing gold details. Immersive and commanding.",
    design: {
      fonts:  { heading: "Georgia, serif", body: "system-ui, sans-serif" },
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
    tier: "premium",
    category: "ENTERTAINMENT",
    eventTypes: ["concert","nightclub","private_party","gala"],
    description: "Dramatic black and gold with countdown timer and gallery showcase.",
    design: {
      fonts:  { heading: "Georgia, serif", body: "system-ui, sans-serif" },
      colors: { bg: "#0D0C0A", accent: "#D4AF6F", dark: "#0D0C0A", text: "#EDE8DF" },
    },
    assets: {
      hero_image:    "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1400&q=85",
      cover_image:   "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=640&q=80",
      gallery_images: [
        "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80",
        "https://images.unsplash.com/photo-1551882547-ff40c4a49ce5?w=800&q=80",
      ],
    },
    sections: [
      { type: "HERO",      config: { _theme: "LUXURY", headline_align: "center", overlay_opacity: 70, eyebrow: "A Night to Remember" } },
      { type: "ABOUT",     config: { _theme: "LUXURY" } },
      { type: "COUNTDOWN", config: { _theme: "LUXURY" } },
      { type: "TICKETS",   config: { _theme: "LUXURY" } },
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
    category: "LIFE",
    eventTypes: ["wedding","engagement","anniversary"],
    description: "The definitive luxury event — couple feature, full timeline, gallery, registry, and grand CTA.",
    design: {
      fonts:  { heading: "Georgia, serif", body: "system-ui, sans-serif" },
      colors: { bg: "#0D0C0A", accent: "#D4AF6F", dark: "#0D0C0A", text: "#EDE8DF" },
    },
    assets: {
      hero_image:    "https://images.unsplash.com/photo-1551882547-ff40c4a49ce5?w=1400&q=85",
      cover_image:   "https://images.unsplash.com/photo-1551882547-ff40c4a49ce5?w=640&q=80",
      gallery_images: [
        "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80",
        "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&q=80",
      ],
    },
    sections: [
      { type: "HERO",      config: { _theme: "LUXURY", headline_align: "center", overlay_opacity: 65, eyebrow: "An Extraordinary Occasion" } },
      { type: "COUPLE",    config: { _theme: "LUXURY" } },
      { type: "STORY",     config: { _theme: "LUXURY" } },
      { type: "COUNTDOWN", config: { _theme: "LUXURY" } },
      { type: "SCHEDULE",  config: { _theme: "LUXURY" } },
      { type: "VENUE",     config: { _theme: "LUXURY" } },
      { type: "GALLERY",   config: { _theme: "LUXURY", layout: "grid" } },
      { type: "REGISTRY",  config: { _theme: "LUXURY" } },
      { type: "FAQ",       config: { _theme: "LUXURY" } },
      { type: "CTA",       config: { _theme: "LUXURY", button_text: "Join Us for the Evening" } },
    ],
  },

  {
    id: "luxury-summit",
    name: "Executive Summit",
    style: "LUXURY",
    tier: "premium",
    category: "CORPORATE",
    eventTypes: ["conference","product_launch","networking","corporate","corporate_event"],
    description: "Prestige corporate event with gold details, speakers stage, and VIP ticketing.",
    design: {
      fonts:  { heading: "Georgia, serif", body: "system-ui, sans-serif" },
      colors: { bg: "#0D0C0A", accent: "#D4AF6F", dark: "#0D0C0A", text: "#EDE8DF" },
    },
    assets: {
      hero_image:    "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1400&q=85",
      cover_image:   "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=640&q=80",
      gallery_images: [],
    },
    sections: [
      { type: "HERO",     config: { _theme: "LUXURY", headline_align: "center", overlay_opacity: 70, eyebrow: "EXCLUSIVE SUMMIT" } },
      { type: "ABOUT",    config: { _theme: "LUXURY" } },
      { type: "SPEAKERS", config: { _theme: "LUXURY" } },
      { type: "SCHEDULE", config: { _theme: "LUXURY" } },
      { type: "TICKETS",  config: { _theme: "LUXURY" } },
      { type: "VENUE",    config: { _theme: "LUXURY" } },
      { type: "FAQ",      config: { _theme: "LUXURY" } },
      { type: "CTA",      config: { _theme: "LUXURY", button_text: "Apply for Invitation" } },
    ],
  },

  {
    id: "luxury-concert",
    name: "Grand Spectacle",
    style: "LUXURY",
    tier: "premium",
    category: "ENTERTAINMENT",
    eventTypes: ["concert","live_show","theater","nightclub"],
    description: "A cinematic concert experience — sold-out energy, VIP tiers, and gold accents.",
    design: {
      fonts:  { heading: "Georgia, serif", body: "system-ui, sans-serif" },
      colors: { bg: "#0D0C0A", accent: "#D4AF6F", dark: "#0D0C0A", text: "#EDE8DF" },
    },
    assets: {
      hero_image:    "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=1400&q=85",
      cover_image:   "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=640&q=80",
      gallery_images: [
        "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800&q=80",
        "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&q=80",
      ],
    },
    sections: [
      { type: "HERO",      config: { _theme: "LUXURY", headline_align: "center", overlay_opacity: 72, eyebrow: "LIVE PERFORMANCE" } },
      { type: "ABOUT",     config: { _theme: "LUXURY" } },
      { type: "COUNTDOWN", config: { _theme: "LUXURY" } },
      { type: "SPEAKERS",  config: { _theme: "LUXURY" } },
      { type: "TICKETS",   config: { _theme: "LUXURY" } },
      { type: "VENUE",     config: { _theme: "LUXURY" } },
      { type: "GALLERY",   config: { _theme: "LUXURY", layout: "grid" } },
      { type: "FAQ",       config: { _theme: "LUXURY" } },
      { type: "CTA",       config: { _theme: "LUXURY", button_text: "Get Your Tickets" } },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════════
  // FUN (Premium)
  // ══════════════════════════════════════════════════════════════════════════════

  {
    id: "fun-partytime",
    name: "Party Time",
    style: "FUN",
    tier: "premium",
    category: "SOCIAL",
    eventTypes: ["birthday","private_party","gender_reveal","baby_shower"],
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
    tier: "premium",
    category: "SOCIAL",
    eventTypes: ["birthday","graduation","family_reunion","anniversary"],
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
    category: "ENTERTAINMENT",
    eventTypes: ["festival","concert","sports","live_show"],
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
      ],
    },
    sections: [
      { type: "HERO",      config: { _theme: "FUN", headline_align: "center", overlay_opacity: 60, eyebrow: "The Big Event" } },
      { type: "ABOUT",     config: { _theme: "FUN" } },
      { type: "COUNTDOWN", config: { _theme: "FUN" } },
      { type: "SPEAKERS",  config: { _theme: "FUN" } },
      { type: "SCHEDULE",  config: { _theme: "FUN" } },
      { type: "TICKETS",   config: { _theme: "FUN" } },
      { type: "VENUE",     config: { _theme: "FUN" } },
      { type: "GALLERY",   config: { _theme: "FUN", layout: "grid" } },
      { type: "FAQ",       config: { _theme: "FUN" } },
      { type: "CTA",       config: { _theme: "FUN", button_text: "Get My Ticket!" } },
    ],
  },

  {
    id: "fun-birthday-bash",
    name: "Birthday Bash",
    style: "FUN",
    tier: "premium",
    category: "SOCIAL",
    eventTypes: ["birthday","private_party","graduation"],
    description: "Bold, colorful, and energetic — the ultimate birthday party template.",
    design: {
      fonts:  { heading: "system-ui, sans-serif", body: "system-ui, sans-serif" },
      colors: { bg: "#FFFBF0", accent: "#F59E0B", dark: "#1C1407", text: "#1C2333" },
    },
    assets: {
      hero_image:    "https://images.unsplash.com/photo-1527529482837-4698179dc6ce?w=1400&q=85",
      cover_image:   "https://images.unsplash.com/photo-1527529482837-4698179dc6ce?w=640&q=80",
      gallery_images: [
        "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800&q=80",
        "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&q=80",
      ],
    },
    sections: [
      { type: "HERO",      config: { _theme: "FUN", headline_align: "center", overlay_opacity: 55, eyebrow: "🎂 It's Party Time!" } },
      { type: "ABOUT",     config: { _theme: "FUN" } },
      { type: "COUNTDOWN", config: { _theme: "FUN" } },
      { type: "SCHEDULE",  config: { _theme: "FUN" } },
      { type: "VENUE",     config: { _theme: "FUN" } },
      { type: "GALLERY",   config: { _theme: "FUN", layout: "grid" } },
      { type: "FAQ",       config: { _theme: "FUN" } },
      { type: "CTA",       config: { _theme: "FUN", button_text: "I'll Be There! 🎉" } },
    ],
  },

  {
    id: "fun-company-party",
    name: "Team Bash",
    style: "FUN",
    tier: "premium",
    category: "CORPORATE",
    eventTypes: ["company_party","networking","corporate_event"],
    description: "Fun, energetic company event template — great for team outings and office parties.",
    design: {
      fonts:  { heading: "system-ui, sans-serif", body: "system-ui, sans-serif" },
      colors: { bg: "#FFFBF0", accent: "#F59E0B", dark: "#1C1407", text: "#1C2333" },
    },
    assets: {
      hero_image:    "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1400&q=85",
      cover_image:   "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=640&q=80",
      gallery_images: [],
    },
    sections: [
      { type: "HERO",     config: { _theme: "FUN", headline_align: "center", overlay_opacity: 60, eyebrow: "Team Event!" } },
      { type: "ABOUT",    config: { _theme: "FUN" } },
      { type: "SCHEDULE", config: { _theme: "FUN" } },
      { type: "VENUE",    config: { _theme: "FUN" } },
      { type: "FAQ",      config: { _theme: "FUN" } },
      { type: "CTA",      config: { _theme: "FUN", button_text: "I'm In! 🙌" } },
    ],
  },

  {
    id: "fun-comedy",
    name: "Comedy Night",
    style: "FUN",
    tier: "premium",
    category: "ENTERTAINMENT",
    eventTypes: ["comedy","live_show","nightclub"],
    description: "High-energy comedy night template with big ticket button and countdown.",
    design: {
      fonts:  { heading: "system-ui, sans-serif", body: "system-ui, sans-serif" },
      colors: { bg: "#FFFBF0", accent: "#F59E0B", dark: "#1C1407", text: "#1C2333" },
    },
    assets: {
      hero_image:    "https://images.unsplash.com/photo-1506157786151-b8491531f063?w=1400&q=85",
      cover_image:   "https://images.unsplash.com/photo-1506157786151-b8491531f063?w=640&q=80",
      gallery_images: [],
    },
    sections: [
      { type: "HERO",      config: { _theme: "FUN", headline_align: "center", overlay_opacity: 65, eyebrow: "😂 Live Comedy" } },
      { type: "ABOUT",     config: { _theme: "FUN" } },
      { type: "COUNTDOWN", config: { _theme: "FUN" } },
      { type: "SPEAKERS",  config: { _theme: "FUN" } },
      { type: "TICKETS",   config: { _theme: "FUN" } },
      { type: "VENUE",     config: { _theme: "FUN" } },
      { type: "FAQ",       config: { _theme: "FUN" } },
      { type: "CTA",       config: { _theme: "FUN", button_text: "Get Tickets 😂" } },
    ],
  },

];

// ── Helpers ───────────────────────────────────────────────────────────────────

export const TEMPLATES_BY_STYLE = STYLE_TEMPLATES.reduce((acc, t) => {
  if (!acc[t.style]) acc[t.style] = [];
  acc[t.style].push(t);
  return acc;
}, {});

export const TEMPLATES_BY_CATEGORY = STYLE_TEMPLATES.reduce((acc, t) => {
  const cat = t.category ?? "OTHER";
  if (!acc[cat]) acc[cat] = [];
  acc[cat].push(t);
  return acc;
}, {});

/** Returns templates that match the given event type, sorted by relevance */
export function getTemplatesForEventType(eventType) {
  if (!eventType) return STYLE_TEMPLATES;
  const t = String(eventType).toLowerCase().trim();
  const exact   = STYLE_TEMPLATES.filter((tmpl) => tmpl.eventTypes?.includes(t));
  const catKey  = getCategoryForType(t);
  const byCat   = catKey
    ? STYLE_TEMPLATES.filter((tmpl) => tmpl.category === catKey && !tmpl.eventTypes?.includes(t))
    : [];
  const rest    = STYLE_TEMPLATES.filter(
    (tmpl) => !tmpl.eventTypes?.includes(t) && tmpl.category !== catKey
  );
  return [...exact, ...byCat, ...rest];
}

// Legacy exports so existing imports stay intact
export const WEDDING_TEMPLATES = STYLE_TEMPLATES;
export const FREE_TEMPLATES    = STYLE_TEMPLATES.filter((t) => t.style === FREE_STYLE);
export const PREMIUM_TEMPLATES = STYLE_TEMPLATES.filter((t) => t.style !== FREE_STYLE);

export function getTemplateById(id) {
  return STYLE_TEMPLATES.find((t) => t.id === id) || null;
}
