// ─────────────────────────────────────────────────────────────────────────────
// WEDDING TEMPLATES  —  30 total (15 free · 15 premium)
// Add new templates here; no other file needs to change.
// ─────────────────────────────────────────────────────────────────────────────

export const WEDDING_TEMPLATES = [

  /* ═══════════════════════════════════════════════════════
     FREE TEMPLATES  (15)
  ═══════════════════════════════════════════════════════ */

  {
    id: "modern-minimalist",
    name: "Modern Minimalist",
    category: "wedding",
    tier: "free",
    description: "Clean lines, breathable white space, and understated elegance for the contemporary couple.",
    design: {
      fonts: { heading_font: "Cormorant Garamond", body_font: "Jost" },
      colors: { primary: "#1a1a1a", secondary: "#6b6b6b", background: "#ffffff", text: "#333333", accent: "#c9a96e" },
    },
    assets: {
      hero_image:   "https://images.unsplash.com/photo-1519225421261-f86ad14b2e2e?w=1920&q=85&auto=format&fit=crop",
      cover_image:  "https://images.unsplash.com/photo-1519225421261-f86ad14b2e2e?w=800&q=80&auto=format&fit=crop",
      gallery_images: [
        "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=800&q=80&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1606216794074-735ab4ca97c0?w=800&q=80&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1511285560929-80b72b03a058?w=800&q=80&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=800&q=80&auto=format&fit=crop",
      ],
    },
    sections: [
      { type: "HERO",      layout: "centered",    config: { title: "Sarah & James",   subtitle: "We're getting married",           overlay_opacity: 0.30 } },
      { type: "COUPLE",    layout: "split",        config: { heading: "Our Story" } },
      { type: "STORY",     layout: "timeline",     config: { heading: "How It Happened" } },
      { type: "COUNTDOWN", layout: "minimal",      config: { heading: "Counting Down" } },
      { type: "VENUE",     layout: "card",         config: { heading: "Ceremony & Reception" } },
      { type: "GALLERY",   layout: "grid-3",       config: { heading: "Our Moments" } },
      { type: "RSVP",      layout: "simple",       config: { heading: "Join the Celebration",          cta_text: "RSVP Now" } },
    ],
  },

  {
    id: "classic-white-wedding",
    name: "Classic White Wedding",
    category: "wedding",
    tier: "free",
    description: "Timeless ivory elegance—the aesthetic that never goes out of style.",
    design: {
      fonts: { heading_font: "Playfair Display", body_font: "Lato" },
      colors: { primary: "#2c2c2c", secondary: "#8a8a8a", background: "#faf9f7", text: "#3d3d3d", accent: "#b89a6b" },
    },
    assets: {
      hero_image:   "https://images.unsplash.com/photo-1591604021695-0c69b7c05981?w=1920&q=85&auto=format&fit=crop",
      cover_image:  "https://images.unsplash.com/photo-1591604021695-0c69b7c05981?w=800&q=80&auto=format&fit=crop",
      gallery_images: [
        "https://images.unsplash.com/photo-1529543544282-ea669407fca3?w=800&q=80&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1503863222744-f04c86f6fd47?w=800&q=80&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1439539698758-ba2680ecadd9?w=800&q=80&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=800&q=80&auto=format&fit=crop",
      ],
    },
    sections: [
      { type: "HERO",      layout: "full-bleed",   config: { title: "Emily & Thomas",  subtitle: "A Classic Love Story",            overlay_opacity: 0.25 } },
      { type: "COUPLE",    layout: "centered",     config: { heading: "About the Couple" } },
      { type: "STORY",     layout: "alternating",  config: { heading: "Our Journey" } },
      { type: "COUNTDOWN", layout: "elegant",      config: { heading: "The Big Day" } },
      { type: "VENUE",     layout: "full-width",   config: { heading: "Where to Find Us" } },
      { type: "GALLERY",   layout: "masonry",      config: { heading: "Captured Moments" } },
      { type: "RSVP",      layout: "centered",     config: { heading: "We Hope You Can Make It",       cta_text: "Confirm Attendance" } },
    ],
  },

  {
    id: "simple-garden",
    name: "Simple Garden",
    category: "wedding",
    tier: "free",
    description: "Fresh greenery and soft pastels for an outdoor garden ceremony.",
    design: {
      fonts: { heading_font: "Libre Baskerville", body_font: "Source Sans Pro" },
      colors: { primary: "#2d4a2d", secondary: "#6b8e6b", background: "#f4f8f0", text: "#2d3a2d", accent: "#c8a882" },
    },
    assets: {
      hero_image:   "https://images.unsplash.com/photo-1439539698758-ba2680ecadd9?w=1920&q=85&auto=format&fit=crop",
      cover_image:  "https://images.unsplash.com/photo-1439539698758-ba2680ecadd9?w=800&q=80&auto=format&fit=crop",
      gallery_images: [
        "https://images.unsplash.com/photo-1503863222744-f04c86f6fd47?w=800&q=80&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=800&q=80&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1519225421261-f86ad14b2e2e?w=800&q=80&auto=format&fit=crop",
      ],
    },
    sections: [
      { type: "HERO",      layout: "garden",       config: { title: "Olivia & Noah",   subtitle: "A Garden Wedding",                overlay_opacity: 0.20 } },
      { type: "COUPLE",    layout: "split",        config: { heading: "The Happy Couple" } },
      { type: "STORY",     layout: "timeline",     config: { heading: "Our Love Story" } },
      { type: "COUNTDOWN", layout: "floral",       config: { heading: "Almost Time" } },
      { type: "VENUE",     layout: "map-card",     config: { heading: "The Venue" } },
      { type: "GALLERY",   layout: "grid-2",       config: { heading: "Photo Album" } },
      { type: "RSVP",      layout: "garden",       config: { heading: "RSVP to Celebrate",             cta_text: "Yes, I'll Be There" } },
    ],
  },

  {
    id: "soft-blush",
    name: "Soft Blush",
    category: "wedding",
    tier: "free",
    description: "Romantic blush tones and delicate flourishes for a dreamy celebration.",
    design: {
      fonts: { heading_font: "Gilda Display", body_font: "Raleway" },
      colors: { primary: "#c47b8a", secondary: "#d4a0aa", background: "#fff5f6", text: "#5a3540", accent: "#f0b8c0" },
    },
    assets: {
      hero_image:   "https://images.unsplash.com/photo-1511285560929-80b72b03a058?w=1920&q=85&auto=format&fit=crop",
      cover_image:  "https://images.unsplash.com/photo-1511285560929-80b72b03a058?w=800&q=80&auto=format&fit=crop",
      gallery_images: [
        "https://images.unsplash.com/photo-1519225421261-f86ad14b2e2e?w=800&q=80&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1529543544282-ea669407fca3?w=800&q=80&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1503863222744-f04c86f6fd47?w=800&q=80&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=800&q=80&auto=format&fit=crop",
      ],
    },
    sections: [
      { type: "HERO",      layout: "centered",    config: { title: "Lily & Connor",   subtitle: "Two hearts, one love",            overlay_opacity: 0.20 } },
      { type: "COUPLE",    layout: "split",       config: { heading: "About Us" } },
      { type: "STORY",     layout: "timeline",    config: { heading: "Our Story" } },
      { type: "COUNTDOWN", layout: "elegant",     config: { heading: "Days Until Forever" } },
      { type: "VENUE",     layout: "card",        config: { heading: "Our Venue" } },
      { type: "GALLERY",   layout: "grid-3",      config: { heading: "Memories" } },
      { type: "RSVP",      layout: "simple",      config: { heading: "Will You Join Us?",              cta_text: "Send RSVP" } },
    ],
  },

  {
    id: "airy-linen",
    name: "Airy Linen",
    category: "wedding",
    tier: "free",
    description: "Natural linen textures and warm neutrals for an effortlessly organic feel.",
    design: {
      fonts: { heading_font: "DM Serif Display", body_font: "DM Sans" },
      colors: { primary: "#7a6652", secondary: "#a89880", background: "#faf7f2", text: "#4a3d30", accent: "#c4a882" },
    },
    assets: {
      hero_image:   "https://images.unsplash.com/photo-1476477540549-0b5ad4e33ca3?w=1920&q=85&auto=format&fit=crop",
      cover_image:  "https://images.unsplash.com/photo-1476477540549-0b5ad4e33ca3?w=800&q=80&auto=format&fit=crop",
      gallery_images: [
        "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1439539698758-ba2680ecadd9?w=800&q=80&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1519225421261-f86ad14b2e2e?w=800&q=80&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=800&q=80&auto=format&fit=crop",
      ],
    },
    sections: [
      { type: "HERO",      layout: "full-bleed",  config: { title: "Grace & Liam",    subtitle: "An intimate gathering",           overlay_opacity: 0.15 } },
      { type: "COUPLE",    layout: "centered",    config: { heading: "The Couple" } },
      { type: "STORY",     layout: "alternating", config: { heading: "How We Met" } },
      { type: "COUNTDOWN", layout: "minimal",     config: { heading: "The Countdown" } },
      { type: "VENUE",     layout: "full-width",  config: { heading: "Venue Details" } },
      { type: "GALLERY",   layout: "masonry",     config: { heading: "Gallery" } },
      { type: "RSVP",      layout: "centered",    config: { heading: "Please Reply",                   cta_text: "RSVP" } },
    ],
  },

  {
    id: "pale-sage",
    name: "Pale Sage",
    category: "wedding",
    tier: "free",
    description: "Muted sage greens and warm ivory for a naturally serene atmosphere.",
    design: {
      fonts: { heading_font: "Spectral", body_font: "Inter" },
      colors: { primary: "#5a7a5a", secondary: "#8aaa8a", background: "#f5f8f3", text: "#334433", accent: "#a8c8a0" },
    },
    assets: {
      hero_image:   "https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=1920&q=85&auto=format&fit=crop",
      cover_image:  "https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=800&q=80&auto=format&fit=crop",
      gallery_images: [
        "https://images.unsplash.com/photo-1503863222744-f04c86f6fd47?w=800&q=80&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1439539698758-ba2680ecadd9?w=800&q=80&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1519225421261-f86ad14b2e2e?w=800&q=80&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=800&q=80&auto=format&fit=crop",
      ],
    },
    sections: [
      { type: "HERO",      layout: "centered",    config: { title: "Ava & Finn",      subtitle: "A celebration of love",           overlay_opacity: 0.20 } },
      { type: "COUPLE",    layout: "split",       config: { heading: "Meet the Couple" } },
      { type: "STORY",     layout: "timeline",    config: { heading: "Our Story" } },
      { type: "COUNTDOWN", layout: "elegant",     config: { heading: "Counting Down" } },
      { type: "VENUE",     layout: "card",        config: { heading: "Location" } },
      { type: "GALLERY",   layout: "grid-3",      config: { heading: "Our Photos" } },
      { type: "RSVP",      layout: "simple",      config: { heading: "Join Our Day",                   cta_text: "RSVP Here" } },
    ],
  },

  {
    id: "ivory-dream",
    name: "Ivory Dream",
    category: "wedding",
    tier: "free",
    description: "Warm ivory and champagne hues for a soft, dreamy celebration.",
    design: {
      fonts: { heading_font: "Crimson Pro", body_font: "Nunito" },
      colors: { primary: "#8b7355", secondary: "#b09a7a", background: "#fefbf5", text: "#4a3d28", accent: "#d4b896" },
    },
    assets: {
      hero_image:   "https://images.unsplash.com/photo-1606216794074-735ab4ca97c0?w=1920&q=85&auto=format&fit=crop",
      cover_image:  "https://images.unsplash.com/photo-1606216794074-735ab4ca97c0?w=800&q=80&auto=format&fit=crop",
      gallery_images: [
        "https://images.unsplash.com/photo-1529543544282-ea669407fca3?w=800&q=80&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1511285560929-80b72b03a058?w=800&q=80&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1519225421261-f86ad14b2e2e?w=800&q=80&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=800&q=80&auto=format&fit=crop",
      ],
    },
    sections: [
      { type: "HERO",      layout: "full-bleed",  config: { title: "Clara & Henry",   subtitle: "Forever starts today",            overlay_opacity: 0.25 } },
      { type: "COUPLE",    layout: "centered",    config: { heading: "The Couple" } },
      { type: "STORY",     layout: "alternating", config: { heading: "Our Story" } },
      { type: "COUNTDOWN", layout: "minimal",     config: { heading: "Almost Here" } },
      { type: "VENUE",     layout: "full-width",  config: { heading: "The Venue" } },
      { type: "GALLERY",   layout: "masonry",     config: { heading: "Gallery" } },
      { type: "RSVP",      layout: "centered",    config: { heading: "You're Invited",                 cta_text: "Confirm" } },
    ],
  },

  {
    id: "coastal-breeze",
    name: "Coastal Breeze",
    category: "wedding",
    tier: "free",
    description: "Light ocean blues and sandy whites for a relaxed coastal celebration.",
    design: {
      fonts: { heading_font: "Josefin Slab", body_font: "Josefin Sans" },
      colors: { primary: "#3a7ca5", secondary: "#6aafd4", background: "#f7fbfe", text: "#1e3a5f", accent: "#b0d8f0" },
    },
    assets: {
      hero_image:   "https://images.unsplash.com/photo-1505932794465-147d1f1b2c97?w=1920&q=85&auto=format&fit=crop",
      cover_image:  "https://images.unsplash.com/photo-1505932794465-147d1f1b2c97?w=800&q=80&auto=format&fit=crop",
      gallery_images: [
        "https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=800&q=80&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1519225421261-f86ad14b2e2e?w=800&q=80&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=800&q=80&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1511285560929-80b72b03a058?w=800&q=80&auto=format&fit=crop",
      ],
    },
    sections: [
      { type: "HERO",      layout: "centered",    config: { title: "Mia & Jack",      subtitle: "By the sea, forever",             overlay_opacity: 0.20 } },
      { type: "COUPLE",    layout: "split",       config: { heading: "About Us" } },
      { type: "STORY",     layout: "timeline",    config: { heading: "Our Journey" } },
      { type: "COUNTDOWN", layout: "elegant",     config: { heading: "Tide Is Coming In" } },
      { type: "VENUE",     layout: "map-card",    config: { heading: "Venue" } },
      { type: "GALLERY",   layout: "grid-3",      config: { heading: "Seaside Memories" } },
      { type: "RSVP",      layout: "simple",      config: { heading: "Set Sail With Us",               cta_text: "RSVP" } },
    ],
  },

  {
    id: "serene-meadow",
    name: "Serene Meadow",
    category: "wedding",
    tier: "free",
    description: "Wildflower meadows and golden hour light in warm lavender and wheat.",
    design: {
      fonts: { heading_font: "EB Garamond", body_font: "Work Sans" },
      colors: { primary: "#7c6a9e", secondary: "#a896c0", background: "#faf8ff", text: "#3d3050", accent: "#c8b8e8" },
    },
    assets: {
      hero_image:   "https://images.unsplash.com/photo-1520854221256-17451cc331bf?w=1920&q=85&auto=format&fit=crop",
      cover_image:  "https://images.unsplash.com/photo-1520854221256-17451cc331bf?w=800&q=80&auto=format&fit=crop",
      gallery_images: [
        "https://images.unsplash.com/photo-1519225421261-f86ad14b2e2e?w=800&q=80&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1503863222744-f04c86f6fd47?w=800&q=80&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1439539698758-ba2680ecadd9?w=800&q=80&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=800&q=80&auto=format&fit=crop",
      ],
    },
    sections: [
      { type: "HERO",      layout: "full-bleed",  config: { title: "Nora & Elliot",   subtitle: "Among the wildflowers",           overlay_opacity: 0.18 } },
      { type: "COUPLE",    layout: "centered",    config: { heading: "Our Love Story" } },
      { type: "STORY",     layout: "alternating", config: { heading: "How It Began" } },
      { type: "COUNTDOWN", layout: "floral",      config: { heading: "Almost Here" } },
      { type: "VENUE",     layout: "card",        config: { heading: "The Meadow" } },
      { type: "GALLERY",   layout: "masonry",     config: { heading: "Golden Moments" } },
      { type: "RSVP",      layout: "centered",    config: { heading: "Join Us in the Meadow",          cta_text: "I'll Be There" } },
    ],
  },

  {
    id: "gentle-twilight",
    name: "Gentle Twilight",
    category: "wedding",
    tier: "free",
    description: "Dusty mauve and soft violet hues evoke the magic hour before sunset.",
    design: {
      fonts: { heading_font: "Cormorant", body_font: "Karla" },
      colors: { primary: "#7b5ea7", secondary: "#a080c8", background: "#fdf8ff", text: "#3d2a5a", accent: "#d0b8f0" },
    },
    assets: {
      hero_image:   "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1920&q=85&auto=format&fit=crop",
      cover_image:  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80&auto=format&fit=crop",
      gallery_images: [
        "https://images.unsplash.com/photo-1511285560929-80b72b03a058?w=800&q=80&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1529543544282-ea669407fca3?w=800&q=80&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1519225421261-f86ad14b2e2e?w=800&q=80&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=800&q=80&auto=format&fit=crop",
      ],
    },
    sections: [
      { type: "HERO",      layout: "centered",    config: { title: "Iris & Leo",      subtitle: "As the sun sets on our old lives", overlay_opacity: 0.30 } },
      { type: "COUPLE",    layout: "split",       config: { heading: "About the Couple" } },
      { type: "STORY",     layout: "timeline",    config: { heading: "Our Journey" } },
      { type: "COUNTDOWN", layout: "elegant",     config: { heading: "Until the Twilight" } },
      { type: "VENUE",     layout: "card",        config: { heading: "Venue" } },
      { type: "GALLERY",   layout: "grid-3",      config: { heading: "Dusk & Dawn" } },
      { type: "RSVP",      layout: "simple",      config: { heading: "Join Us at Dusk",                cta_text: "Reserve Your Spot" } },
    ],
  },

  {
    id: "pure-romance",
    name: "Pure Romance",
    category: "wedding",
    tier: "free",
    description: "A celebration of love in soft rose and silk white, utterly romantic.",
    design: {
      fonts: { heading_font: "Italiana", body_font: "Questrial" },
      colors: { primary: "#b06080", secondary: "#d09090", background: "#fff8f9", text: "#5a2a3a", accent: "#f0b0c0" },
    },
    assets: {
      hero_image:   "https://images.unsplash.com/photo-1529543544282-ea669407fca3?w=1920&q=85&auto=format&fit=crop",
      cover_image:  "https://images.unsplash.com/photo-1529543544282-ea669407fca3?w=800&q=80&auto=format&fit=crop",
      gallery_images: [
        "https://images.unsplash.com/photo-1503863222744-f04c86f6fd47?w=800&q=80&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1519225421261-f86ad14b2e2e?w=800&q=80&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1511285560929-80b72b03a058?w=800&q=80&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=800&q=80&auto=format&fit=crop",
      ],
    },
    sections: [
      { type: "HERO",      layout: "full-bleed",  config: { title: "Sophie & James",  subtitle: "Pure, simple, ours",              overlay_opacity: 0.20 } },
      { type: "COUPLE",    layout: "centered",    config: { heading: "The Couple" } },
      { type: "STORY",     layout: "alternating", config: { heading: "Our Romance" } },
      { type: "COUNTDOWN", layout: "minimal",     config: { heading: "Until the Kiss" } },
      { type: "VENUE",     layout: "full-width",  config: { heading: "Venue" } },
      { type: "GALLERY",   layout: "masonry",     config: { heading: "Love in Frames" } },
      { type: "RSVP",      layout: "centered",    config: { heading: "Celebrate With Us",             cta_text: "RSVP with Love" } },
    ],
  },

  {
    id: "timeless-vows",
    name: "Timeless Vows",
    category: "wedding",
    tier: "free",
    description: "Deep slate and silver — refined, structured, and enduringly beautiful.",
    design: {
      fonts: { heading_font: "Cinzel", body_font: "Mulish" },
      colors: { primary: "#374151", secondary: "#6b7280", background: "#f9fafb", text: "#1f2937", accent: "#9ca3af" },
    },
    assets: {
      hero_image:   "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=1920&q=85&auto=format&fit=crop",
      cover_image:  "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=800&q=80&auto=format&fit=crop",
      gallery_images: [
        "https://images.unsplash.com/photo-1606216794074-735ab4ca97c0?w=800&q=80&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1550005809-91ad75fb315f?w=800&q=80&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1529543544282-ea669407fca3?w=800&q=80&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1519225421261-f86ad14b2e2e?w=800&q=80&auto=format&fit=crop",
      ],
    },
    sections: [
      { type: "HERO",      layout: "centered",    config: { title: "Anna & Michael",  subtitle: "Until the end of time",           overlay_opacity: 0.35 } },
      { type: "COUPLE",    layout: "split",       config: { heading: "About Us" } },
      { type: "STORY",     layout: "timeline",    config: { heading: "Our Story" } },
      { type: "COUNTDOWN", layout: "elegant",     config: { heading: "Countdown" } },
      { type: "VENUE",     layout: "card",        config: { heading: "The Venue" } },
      { type: "GALLERY",   layout: "grid-3",      config: { heading: "Gallery" } },
      { type: "RSVP",      layout: "simple",      config: { heading: "You Are Invited",                cta_text: "RSVP" } },
    ],
  },

  {
    id: "morning-dew",
    name: "Morning Dew",
    category: "wedding",
    tier: "free",
    description: "Crisp whites and morning-light golds — fresh, bright, full of promise.",
    design: {
      fonts: { heading_font: "Bodoni Moda", body_font: "Barlow" },
      colors: { primary: "#c8962a", secondary: "#e0b84a", background: "#fffdf7", text: "#3d2e10", accent: "#f5d880" },
    },
    assets: {
      hero_image:   "https://images.unsplash.com/photo-1516589091380-5d8fd7a7b0a0?w=1920&q=85&auto=format&fit=crop",
      cover_image:  "https://images.unsplash.com/photo-1516589091380-5d8fd7a7b0a0?w=800&q=80&auto=format&fit=crop",
      gallery_images: [
        "https://images.unsplash.com/photo-1519225421261-f86ad14b2e2e?w=800&q=80&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1503863222744-f04c86f6fd47?w=800&q=80&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1511285560929-80b72b03a058?w=800&q=80&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=800&q=80&auto=format&fit=crop",
      ],
    },
    sections: [
      { type: "HERO",      layout: "full-bleed",  config: { title: "Chloe & Ryan",    subtitle: "A new day, a new beginning",      overlay_opacity: 0.22 } },
      { type: "COUPLE",    layout: "centered",    config: { heading: "Our Story" } },
      { type: "STORY",     layout: "alternating", config: { heading: "The Beginning" } },
      { type: "COUNTDOWN", layout: "minimal",     config: { heading: "Rising Sun" } },
      { type: "VENUE",     layout: "full-width",  config: { heading: "Venue" } },
      { type: "GALLERY",   layout: "masonry",     config: { heading: "Golden Frames" } },
      { type: "RSVP",      layout: "centered",    config: { heading: "Join Our Morning",               cta_text: "RSVP Now" } },
    ],
  },

  {
    id: "woodland-light",
    name: "Woodland Light",
    category: "wedding",
    tier: "free",
    description: "Dappled forest light and earth tones for a nature-inspired celebration.",
    design: {
      fonts: { heading_font: "Vollkorn", body_font: "Cabin" },
      colors: { primary: "#4a6741", secondary: "#7a9a70", background: "#f3f7f0", text: "#2a3d26", accent: "#90b880" },
    },
    assets: {
      hero_image:   "https://images.unsplash.com/photo-1476477540549-0b5ad4e33ca3?w=1920&q=85&auto=format&fit=crop",
      cover_image:  "https://images.unsplash.com/photo-1476477540549-0b5ad4e33ca3?w=800&q=80&auto=format&fit=crop",
      gallery_images: [
        "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1439539698758-ba2680ecadd9?w=800&q=80&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1503863222744-f04c86f6fd47?w=800&q=80&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1519225421261-f86ad14b2e2e?w=800&q=80&auto=format&fit=crop",
      ],
    },
    sections: [
      { type: "HERO",      layout: "garden",      config: { title: "Hazel & Oliver",  subtitle: "Where the trees whisper love",    overlay_opacity: 0.20 } },
      { type: "COUPLE",    layout: "split",       config: { heading: "The Two of Us" } },
      { type: "STORY",     layout: "timeline",    config: { heading: "Our Path" } },
      { type: "COUNTDOWN", layout: "floral",      config: { heading: "The Forest Awaits" } },
      { type: "VENUE",     layout: "map-card",    config: { heading: "Find Us" } },
      { type: "GALLERY",   layout: "grid-2",      config: { heading: "Forest Frames" } },
      { type: "RSVP",      layout: "garden",      config: { heading: "Come into the Woods",            cta_text: "Count Me In" } },
    ],
  },

  {
    id: "forever-after",
    name: "Forever After",
    category: "wedding",
    tier: "free",
    description: "Warm terracotta and cream — rustic soul meets modern storytelling.",
    design: {
      fonts: { heading_font: "Fraunces", body_font: "Figtree" },
      colors: { primary: "#b5603a", secondary: "#d4856a", background: "#fdf7f2", text: "#4a2a18", accent: "#e8a888" },
    },
    assets: {
      hero_image:   "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&q=85&auto=format&fit=crop",
      cover_image:  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80&auto=format&fit=crop",
      gallery_images: [
        "https://images.unsplash.com/photo-1476477540549-0b5ad4e33ca3?w=800&q=80&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1519225421261-f86ad14b2e2e?w=800&q=80&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1503863222744-f04c86f6fd47?w=800&q=80&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=800&q=80&auto=format&fit=crop",
      ],
    },
    sections: [
      { type: "HERO",      layout: "full-bleed",  config: { title: "Daisy & Sam",     subtitle: "And they lived happily ever after", overlay_opacity: 0.25 } },
      { type: "COUPLE",    layout: "centered",    config: { heading: "Our Story" } },
      { type: "STORY",     layout: "alternating", config: { heading: "The Beginning" } },
      { type: "COUNTDOWN", layout: "minimal",     config: { heading: "The Story Continues" } },
      { type: "VENUE",     layout: "card",        config: { heading: "The Setting" } },
      { type: "GALLERY",   layout: "masonry",     config: { heading: "Our Chapter" } },
      { type: "RSVP",      layout: "centered",    config: { heading: "Be Part of Our Story",           cta_text: "RSVP" } },
    ],
  },


  /* ═══════════════════════════════════════════════════════
     PREMIUM TEMPLATES  (15)
  ═══════════════════════════════════════════════════════ */

  {
    id: "royal-vintage",
    name: "Royal Vintage",
    category: "wedding",
    tier: "premium",
    description: "Opulent deep navy and gold with ornate vintage motifs. Fit for royalty.",
    design: {
      fonts: { heading_font: "IM Fell English", body_font: "Crimson Text" },
      colors: { primary: "#0d1b4b", secondary: "#7a6435", background: "#0d1b4b", text: "#f5f0e8", accent: "#d4af37" },
    },
    assets: {
      hero_image:   "https://images.unsplash.com/photo-1550005809-91ad75fb315f?w=1920&q=85&auto=format&fit=crop",
      cover_image:  "https://images.unsplash.com/photo-1550005809-91ad75fb315f?w=800&q=80&auto=format&fit=crop",
      gallery_images: [
        "https://images.unsplash.com/photo-1606216794074-735ab4ca97c0?w=800&q=80&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1516589091380-5d8fd7a7b0a0?w=800&q=80&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1511285560929-80b72b03a058?w=800&q=80&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=800&q=80&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1529543544282-ea669407fca3?w=800&q=80&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1503863222744-f04c86f6fd47?w=800&q=80&auto=format&fit=crop",
      ],
    },
    sections: [
      { type: "HERO",      layout: "royal",           config: { title: "Isabella & William", subtitle: "A Royal Affair",                  cta_text: "View Invitation", overlay_opacity: 0.50 } },
      { type: "COUPLE",    layout: "portrait",        config: { heading: "The Royal Couple" } },
      { type: "STORY",     layout: "scroll-reveal",   config: { heading: "Our Chronicle" } },
      { type: "COUNTDOWN", layout: "ornate",          config: { heading: "Counting the Days" } },
      { type: "VENUE",     layout: "grand",           config: { heading: "Grand Venue" } },
      { type: "GALLERY",   layout: "masonry-dark",    config: { heading: "Royal Gallery" } },
      { type: "RSVP",      layout: "formal",          config: { heading: "Request Your Presence",       cta_text: "Accept Invitation" } },
    ],
  },

  {
    id: "elegant-black-tie",
    name: "Elegant Black Tie",
    category: "wedding",
    tier: "premium",
    description: "Dramatic black and champagne gold — the most formal statement you can make.",
    design: {
      fonts: { heading_font: "Tenor Sans", body_font: "Raleway" },
      colors: { primary: "#0a0a0a", secondary: "#3d3d3d", background: "#0a0a0a", text: "#f0e6d3", accent: "#c9a84c" },
    },
    assets: {
      hero_image:   "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=1920&q=85&auto=format&fit=crop",
      cover_image:  "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=800&q=80&auto=format&fit=crop",
      gallery_images: [
        "https://images.unsplash.com/photo-1606216794074-735ab4ca97c0?w=800&q=80&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1516589091380-5d8fd7a7b0a0?w=800&q=80&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1550005809-91ad75fb315f?w=800&q=80&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1529543544282-ea669407fca3?w=800&q=80&auto=format&fit=crop",
      ],
    },
    sections: [
      { type: "HERO",      layout: "cinematic",       config: { title: "Charlotte & Alexander", subtitle: "Black Tie Affair",             overlay_opacity: 0.60 } },
      { type: "COUPLE",    layout: "dark-split",      config: { heading: "The Couple" } },
      { type: "STORY",     layout: "dark-timeline",   config: { heading: "Our Story" } },
      { type: "COUNTDOWN", layout: "dark-elegant",    config: { heading: "Until We Say I Do" } },
      { type: "VENUE",     layout: "dark-card",       config: { heading: "The Venue" } },
      { type: "GALLERY",   layout: "dark-grid",       config: { heading: "Gallery" } },
      { type: "RSVP",      layout: "dark-form",       config: { heading: "Kindly Reply",               cta_text: "RSVP" } },
    ],
  },

  {
    id: "tropical-destination",
    name: "Tropical Destination",
    category: "wedding",
    tier: "premium",
    description: "Vibrant ocean blues and lush tropical greens for a sun-drenched beach ceremony.",
    design: {
      fonts: { heading_font: "Abril Fatface", body_font: "Nunito" },
      colors: { primary: "#006b6b", secondary: "#e8734a", background: "#f7fbfc", text: "#1a3a3a", accent: "#ff9c5b" },
    },
    assets: {
      hero_image:   "https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=1920&q=85&auto=format&fit=crop",
      cover_image:  "https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=800&q=80&auto=format&fit=crop",
      gallery_images: [
        "https://images.unsplash.com/photo-1505932794465-147d1f1b2c97?w=800&q=80&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1519225421261-f86ad14b2e2e?w=800&q=80&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1511285560929-80b72b03a058?w=800&q=80&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=800&q=80&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1439539698758-ba2680ecadd9?w=800&q=80&auto=format&fit=crop",
      ],
    },
    sections: [
      { type: "HERO",      layout: "beach",           config: { title: "Luna & Marco",  subtitle: "Destination Wedding — Bali",      overlay_opacity: 0.20 } },
      { type: "COUPLE",    layout: "tropical",        config: { heading: "Two Souls, One Destination" } },
      { type: "STORY",     layout: "journey",         config: { heading: "Our Adventure Together" } },
      { type: "COUNTDOWN", layout: "tropical-timer",  config: { heading: "Paradise Awaits" } },
      { type: "VENUE",     layout: "location-hero",   config: { heading: "Find Your Way Here" } },
      { type: "GALLERY",   layout: "waterfall",       config: { heading: "Our Paradise" } },
      { type: "RSVP",      layout: "beach-form",      config: { heading: "Join Us in Paradise?",       cta_text: "I'm Coming!" } },
    ],
  },

  {
    id: "boho-chic",
    name: "Boho Chic",
    category: "wedding",
    tier: "premium",
    description: "Free-spirited terracotta and sage with dreamy textures. For the wanderlust couple.",
    design: {
      fonts: { heading_font: "Pacifico", body_font: "Poppins" },
      colors: { primary: "#a0522d", secondary: "#7a8c69", background: "#fdf6ef", text: "#4a3728", accent: "#d4956a" },
    },
    assets: {
      hero_image:   "https://images.unsplash.com/photo-1476477540549-0b5ad4e33ca3?w=1920&q=85&auto=format&fit=crop",
      cover_image:  "https://images.unsplash.com/photo-1476477540549-0b5ad4e33ca3?w=800&q=80&auto=format&fit=crop",
      gallery_images: [
        "https://images.unsplash.com/photo-1503863222744-f04c86f6fd47?w=800&q=80&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1519225421261-f86ad14b2e2e?w=800&q=80&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1439539698758-ba2680ecadd9?w=800&q=80&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80&auto=format&fit=crop",
      ],
    },
    sections: [
      { type: "HERO",      layout: "boho-overlay",    config: { title: "Zoe & Ethan",   subtitle: "A Boho Love Story",               overlay_opacity: 0.15 } },
      { type: "COUPLE",    layout: "boho-cards",      config: { heading: "About Us" } },
      { type: "STORY",     layout: "polaroid",        config: { heading: "Our Moments" } },
      { type: "COUNTDOWN", layout: "earthy",          config: { heading: "Almost Here" } },
      { type: "VENUE",     layout: "rustic-card",     config: { heading: "Come Find Us" } },
      { type: "GALLERY",   layout: "boho-grid",       config: { heading: "Captured with Love" } },
      { type: "RSVP",      layout: "earthy-form",     config: { heading: "Join Our Celebration",       cta_text: "Count Me In" } },
    ],
  },

  {
    id: "garden-romance",
    name: "Garden Romance",
    category: "wedding",
    tier: "premium",
    description: "Lush blush and peony pink with soft watercolour florals. Romance in full bloom.",
    design: {
      fonts: { heading_font: "Great Vibes", body_font: "Montserrat" },
      colors: { primary: "#c2657a", secondary: "#a8c8a8", background: "#fff8f9", text: "#5a3a42", accent: "#f0a0b0" },
    },
    assets: {
      hero_image:   "https://images.unsplash.com/photo-1503863222744-f04c86f6fd47?w=1920&q=85&auto=format&fit=crop",
      cover_image:  "https://images.unsplash.com/photo-1503863222744-f04c86f6fd47?w=800&q=80&auto=format&fit=crop",
      gallery_images: [
        "https://images.unsplash.com/photo-1519225421261-f86ad14b2e2e?w=800&q=80&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1439539698758-ba2680ecadd9?w=800&q=80&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1511285560929-80b72b03a058?w=800&q=80&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=800&q=80&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1606216794074-735ab4ca97c0?w=800&q=80&auto=format&fit=crop",
      ],
    },
    sections: [
      { type: "HERO",      layout: "floral-banner",      config: { title: "Rose & Daniel", subtitle: "A Garden Affair",              overlay_opacity: 0.10 } },
      { type: "COUPLE",    layout: "floral-split",        config: { heading: "The Couple in Bloom" } },
      { type: "STORY",     layout: "petal-timeline",      config: { heading: "How Our Garden Grew" } },
      { type: "COUNTDOWN", layout: "floral-countdown",    config: { heading: "Blooming Soon" } },
      { type: "VENUE",     layout: "garden-map",          config: { heading: "In the Garden" } },
      { type: "GALLERY",   layout: "floral-masonry",      config: { heading: "Our Bouquet of Memories" } },
      { type: "RSVP",      layout: "petal-form",          config: { heading: "Join Our Garden Party?",    cta_text: "RSVP with Love" } },
    ],
  },

  {
    id: "luxury-gold",
    name: "Luxury Gold",
    category: "wedding",
    tier: "premium",
    description: "Pure indulgence. Champagne gold on rich cream — the pinnacle of wedding luxury.",
    design: {
      fonts: { heading_font: "Cinzel Decorative", body_font: "Cinzel" },
      colors: { primary: "#b8860b", secondary: "#8b6914", background: "#fef9f0", text: "#3d2b0a", accent: "#d4af37" },
    },
    assets: {
      hero_image:   "https://images.unsplash.com/photo-1516589091380-5d8fd7a7b0a0?w=1920&q=85&auto=format&fit=crop",
      cover_image:  "https://images.unsplash.com/photo-1516589091380-5d8fd7a7b0a0?w=800&q=80&auto=format&fit=crop",
      gallery_images: [
        "https://images.unsplash.com/photo-1606216794074-735ab4ca97c0?w=800&q=80&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1550005809-91ad75fb315f?w=800&q=80&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1511285560929-80b72b03a058?w=800&q=80&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1529543544282-ea669407fca3?w=800&q=80&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=800&q=80&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1519225421261-f86ad14b2e2e?w=800&q=80&auto=format&fit=crop",
      ],
    },
    sections: [
      { type: "HERO",      layout: "gold-luxury",     config: { title: "Victoria & James",  subtitle: "A Luxury Affair",             overlay_opacity: 0.30 } },
      { type: "COUPLE",    layout: "gold-portrait",   config: { heading: "The Celebrated Couple" } },
      { type: "STORY",     layout: "gilded-timeline", config: { heading: "A Golden Love Story" } },
      { type: "COUNTDOWN", layout: "gold-ornate",     config: { heading: "The Grand Occasion Approaches" } },
      { type: "VENUE",     layout: "luxury-venue",    config: { heading: "The Grand Setting" } },
      { type: "GALLERY",   layout: "gold-masonry",    config: { heading: "Our Golden Moments" } },
      { type: "RSVP",      layout: "luxury-form",     config: { heading: "You Are Cordially Invited",    cta_text: "Confirm Attendance" } },
    ],
  },

  {
    id: "mediterranean-blue",
    name: "Mediterranean Blue",
    category: "wedding",
    tier: "premium",
    description: "Cobalt blue and sun-bleached white inspired by the Santorini cliffs.",
    design: {
      fonts: { heading_font: "Philosopher", body_font: "Open Sans" },
      colors: { primary: "#1e3a8a", secondary: "#3b82c4", background: "#f8faff", text: "#1e3a5f", accent: "#e8b84b" },
    },
    assets: {
      hero_image:   "https://images.unsplash.com/photo-1505932794465-147d1f1b2c97?w=1920&q=85&auto=format&fit=crop",
      cover_image:  "https://images.unsplash.com/photo-1505932794465-147d1f1b2c97?w=800&q=80&auto=format&fit=crop",
      gallery_images: [
        "https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=800&q=80&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1519225421261-f86ad14b2e2e?w=800&q=80&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1511285560929-80b72b03a058?w=800&q=80&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=800&q=80&auto=format&fit=crop",
      ],
    },
    sections: [
      { type: "HERO",      layout: "coastal",           config: { title: "Elena & Nikolas", subtitle: "A Mediterranean Wedding",     overlay_opacity: 0.25 } },
      { type: "COUPLE",    layout: "sea-split",         config: { heading: "Two Souls by the Sea" } },
      { type: "STORY",     layout: "coastal-timeline",  config: { heading: "Our Voyage" } },
      { type: "COUNTDOWN", layout: "coastal-timer",     config: { heading: "Setting Sail Soon" } },
      { type: "VENUE",     layout: "coastal-map",       config: { heading: "Find Your Way to Us" } },
      { type: "GALLERY",   layout: "sea-grid",          config: { heading: "Sun, Salt & Love" } },
      { type: "RSVP",      layout: "coastal-form",      config: { heading: "Join Us by the Sea",         cta_text: "I'll Be There" } },
    ],
  },

  {
    id: "rustic-barn",
    name: "Rustic Barn",
    category: "wedding",
    tier: "premium",
    description: "Warm barn wood, burlap textures, and mason jars. Country charm at its finest.",
    design: {
      fonts: { heading_font: "Amatic SC", body_font: "Cabin" },
      colors: { primary: "#6b4c2a", secondary: "#9c7b52", background: "#fdf5e9", text: "#4a3420", accent: "#c8a462" },
    },
    assets: {
      hero_image:   "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&q=85&auto=format&fit=crop",
      cover_image:  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80&auto=format&fit=crop",
      gallery_images: [
        "https://images.unsplash.com/photo-1476477540549-0b5ad4e33ca3?w=800&q=80&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1503863222744-f04c86f6fd47?w=800&q=80&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1519225421261-f86ad14b2e2e?w=800&q=80&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1439539698758-ba2680ecadd9?w=800&q=80&auto=format&fit=crop",
      ],
    },
    sections: [
      { type: "HERO",      layout: "rustic-banner",  config: { title: "Daisy & Luke",    subtitle: "A Barn Wedding",                overlay_opacity: 0.20 } },
      { type: "COUPLE",    layout: "rustic-split",   config: { heading: "The Happy Pair" } },
      { type: "STORY",     layout: "wood-timeline",  config: { heading: "Our Story" } },
      { type: "COUNTDOWN", layout: "barn-timer",     config: { heading: "The Hoedown Is Coming" } },
      { type: "VENUE",     layout: "barn-map",       config: { heading: "Down on the Farm" } },
      { type: "GALLERY",   layout: "rustic-grid",    config: { heading: "Our Memories" } },
      { type: "RSVP",      layout: "barn-form",      config: { heading: "Celebrate With Us",            cta_text: "Y'all Come!" } },
    ],
  },

  {
    id: "celestial-night",
    name: "Celestial Night",
    category: "wedding",
    tier: "premium",
    description: "Deep indigo skies, silver stars, and moonlit romance — written in the stars.",
    design: {
      fonts: { heading_font: "Josefin Sans", body_font: "Quicksand" },
      colors: { primary: "#1a1035", secondary: "#3d2b7a", background: "#0d0a1e", text: "#e8e0ff", accent: "#c0a8f0" },
    },
    assets: {
      hero_image:   "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1920&q=85&auto=format&fit=crop",
      cover_image:  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80&auto=format&fit=crop",
      gallery_images: [
        "https://images.unsplash.com/photo-1511285560929-80b72b03a058?w=800&q=80&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=800&q=80&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1550005809-91ad75fb315f?w=800&q=80&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1519225421261-f86ad14b2e2e?w=800&q=80&auto=format&fit=crop",
      ],
    },
    sections: [
      { type: "HERO",      layout: "starfield",               config: { title: "Aurora & Orion",  subtitle: "Written in the Stars",    overlay_opacity: 0.50 } },
      { type: "COUPLE",    layout: "celestial-split",         config: { heading: "Two Stars Aligned" } },
      { type: "STORY",     layout: "constellation-timeline",  config: { heading: "Our Celestial Journey" } },
      { type: "COUNTDOWN", layout: "moon-timer",              config: { heading: "When the Stars Align" } },
      { type: "VENUE",     layout: "night-card",              config: { heading: "Under the Stars" } },
      { type: "GALLERY",   layout: "night-masonry",           config: { heading: "Starlit Memories" } },
      { type: "RSVP",      layout: "celestial-form",          config: { heading: "Join Us Under the Stars",  cta_text: "I'll Be There" } },
    ],
  },

  {
    id: "art-deco-glamour",
    name: "Art Deco Glamour",
    category: "wedding",
    tier: "premium",
    description: "Bold geometric lines, jet black, and champagne gold. The Roaring Twenties reborn.",
    design: {
      fonts: { heading_font: "Poiret One", body_font: "Josefin Sans" },
      colors: { primary: "#0c0c0c", secondary: "#2a2a2a", background: "#f5f0e8", text: "#1a1a1a", accent: "#c8a84b" },
    },
    assets: {
      hero_image:   "https://images.unsplash.com/photo-1606216794074-735ab4ca97c0?w=1920&q=85&auto=format&fit=crop",
      cover_image:  "https://images.unsplash.com/photo-1606216794074-735ab4ca97c0?w=800&q=80&auto=format&fit=crop",
      gallery_images: [
        "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=800&q=80&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1516589091380-5d8fd7a7b0a0?w=800&q=80&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1550005809-91ad75fb315f?w=800&q=80&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1529543544282-ea669407fca3?w=800&q=80&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1511285560929-80b72b03a058?w=800&q=80&auto=format&fit=crop",
      ],
    },
    sections: [
      { type: "HERO",      layout: "deco-geometric", config: { title: "Vivienne & Gatsby", subtitle: "The Grandest Affair of the Season", overlay_opacity: 0.40 } },
      { type: "COUPLE",    layout: "deco-portrait",  config: { heading: "The Stars of the Show" } },
      { type: "STORY",     layout: "deco-timeline",  config: { heading: "A Love Story Worth Telling" } },
      { type: "COUNTDOWN", layout: "deco-timer",     config: { heading: "The Clock Ticks Toward Splendour" } },
      { type: "VENUE",     layout: "deco-card",      config: { heading: "The Grand Ballroom" } },
      { type: "GALLERY",   layout: "deco-grid",      config: { heading: "A Glamorous Gallery" } },
      { type: "RSVP",      layout: "deco-form",      config: { heading: "You Are Invited to the Soiree",   cta_text: "Accept the Invitation" } },
    ],
  },

  {
    id: "japanese-zen",
    name: "Japanese Zen",
    category: "wedding",
    tier: "premium",
    description: "Cherry blossom pink, ink black, and pure white. Serene Japanese minimalism.",
    design: {
      fonts: { heading_font: "Noto Serif JP", body_font: "Noto Sans JP" },
      colors: { primary: "#1a1a2e", secondary: "#c78fa4", background: "#fdfbf9", text: "#2c2c2c", accent: "#e8a0b4" },
    },
    assets: {
      hero_image:   "https://images.unsplash.com/photo-1520854221256-17451cc331bf?w=1920&q=85&auto=format&fit=crop",
      cover_image:  "https://images.unsplash.com/photo-1520854221256-17451cc331bf?w=800&q=80&auto=format&fit=crop",
      gallery_images: [
        "https://images.unsplash.com/photo-1519225421261-f86ad14b2e2e?w=800&q=80&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1511285560929-80b72b03a058?w=800&q=80&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1529543544282-ea669407fca3?w=800&q=80&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=800&q=80&auto=format&fit=crop",
      ],
    },
    sections: [
      { type: "HERO",      layout: "zen-centered",  config: { title: "Hana & Kenji",    subtitle: "In the Season of Blossoms",    overlay_opacity: 0.15 } },
      { type: "COUPLE",    layout: "zen-split",     config: { heading: "Two Souls, One Heart" } },
      { type: "STORY",     layout: "zen-scroll",    config: { heading: "Our Story" } },
      { type: "COUNTDOWN", layout: "zen-timer",     config: { heading: "The Day Approaches" } },
      { type: "VENUE",     layout: "zen-card",      config: { heading: "The Sacred Space" } },
      { type: "GALLERY",   layout: "zen-grid",      config: { heading: "Moments in Bloom" } },
      { type: "RSVP",      layout: "zen-form",      config: { heading: "Honor Us with Your Presence",   cta_text: "With Great Pleasure" } },
    ],
  },

  {
    id: "parisian-chic",
    name: "Parisian Chic",
    category: "wedding",
    tier: "premium",
    description: "Effortless Parisian elegance in dusty rose and charcoal. C'est magnifique.",
    design: {
      fonts: { heading_font: "Didact Gothic", body_font: "Lora" },
      colors: { primary: "#2d2d2d", secondary: "#8a7a7a", background: "#fdf8f5", text: "#2d2020", accent: "#c8907a" },
    },
    assets: {
      hero_image:   "https://images.unsplash.com/photo-1550005809-91ad75fb315f?w=1920&q=85&auto=format&fit=crop",
      cover_image:  "https://images.unsplash.com/photo-1550005809-91ad75fb315f?w=800&q=80&auto=format&fit=crop",
      gallery_images: [
        "https://images.unsplash.com/photo-1529543544282-ea669407fca3?w=800&q=80&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1519225421261-f86ad14b2e2e?w=800&q=80&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1503863222744-f04c86f6fd47?w=800&q=80&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=800&q=80&auto=format&fit=crop",
      ],
    },
    sections: [
      { type: "HERO",      layout: "paris-banner",   config: { title: "Amélie & Pierre", subtitle: "Une belle histoire d'amour",   overlay_opacity: 0.30 } },
      { type: "COUPLE",    layout: "paris-split",    config: { heading: "Le Couple" } },
      { type: "STORY",     layout: "paris-timeline", config: { heading: "Notre Histoire" } },
      { type: "COUNTDOWN", layout: "paris-timer",    config: { heading: "Le Grand Jour Arrive" } },
      { type: "VENUE",     layout: "paris-card",     config: { heading: "Le Lieu" } },
      { type: "GALLERY",   layout: "paris-masonry",  config: { heading: "Nos Moments" } },
      { type: "RSVP",      layout: "paris-form",     config: { heading: "Rejoignez-Nous",               cta_text: "Je Serai Là" } },
    ],
  },

  {
    id: "opulent-marble",
    name: "Opulent Marble",
    category: "wedding",
    tier: "premium",
    description: "Veined white marble, rose gold accents — architectural luxury at its finest.",
    design: {
      fonts: { heading_font: "Cormorant Infant", body_font: "Montserrat" },
      colors: { primary: "#1a1a1a", secondary: "#8a7878", background: "#fefefe", text: "#2a2a2a", accent: "#c0907a" },
    },
    assets: {
      hero_image:   "https://images.unsplash.com/photo-1591604021695-0c69b7c05981?w=1920&q=85&auto=format&fit=crop",
      cover_image:  "https://images.unsplash.com/photo-1591604021695-0c69b7c05981?w=800&q=80&auto=format&fit=crop",
      gallery_images: [
        "https://images.unsplash.com/photo-1606216794074-735ab4ca97c0?w=800&q=80&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1516589091380-5d8fd7a7b0a0?w=800&q=80&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=800&q=80&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1529543544282-ea669407fca3?w=800&q=80&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1511285560929-80b72b03a058?w=800&q=80&auto=format&fit=crop",
      ],
    },
    sections: [
      { type: "HERO",      layout: "marble-full",    config: { title: "Sophia & Edward",  subtitle: "An Architectural Love Story",  overlay_opacity: 0.20 } },
      { type: "COUPLE",    layout: "marble-portrait",config: { heading: "The Couple" } },
      { type: "STORY",     layout: "marble-timeline",config: { heading: "Our Story" } },
      { type: "COUNTDOWN", layout: "marble-timer",   config: { heading: "The Day Approaches" } },
      { type: "VENUE",     layout: "marble-venue",   config: { heading: "Our Venue" } },
      { type: "GALLERY",   layout: "marble-grid",    config: { heading: "Gallery" } },
      { type: "RSVP",      layout: "marble-form",    config: { heading: "Your Presence Is Requested",  cta_text: "Confirm" } },
    ],
  },
];

/* ─── helpers ──────────────────────────────────────────────────────────────── */
export const FREE_TEMPLATES    = WEDDING_TEMPLATES.filter((t) => t.tier === "free");
export const PREMIUM_TEMPLATES = WEDDING_TEMPLATES.filter((t) => t.tier === "premium");

export function getTemplateById(id) {
  return WEDDING_TEMPLATES.find((t) => t.id === id) ?? null;
}

export function canAccessTemplate(template, userPlan) {
  if (template.tier === "free") return true;
  return userPlan === "premium";
}
