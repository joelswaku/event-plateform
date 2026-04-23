// ── 6 visual style themes ─────────────────────────────────────────────────────
// Each theme exports a flat object of CSS custom properties injected on the
// page wrapper by SharedEventRenderer. Section components use var(--t-*).

export const STYLE_THEMES = {
  CLASSIC: {
    // Warm cream + champagne gold — timeless and refined
    "--t-bg":           "#FAF9F6",
    "--t-bg-alt":       "#FFFFFF",
    "--t-dark":         "#1C1917",
    "--t-dark-surface": "#0F0E0C",
    "--t-accent":       "#C9A96E",
    "--t-accent-dim":   "rgba(201,169,110,0.18)",
    "--t-text":         "#1C1917",
    "--t-text-muted":   "#78716C",
    "--t-border":       "#E7E5E4",
    "--t-font-heading": "'Georgia', 'Times New Roman', serif",
    "--t-font-body":    "system-ui, -apple-system, sans-serif",
    "--t-radius":       "0px",
  },

  ELEGANT: {
    // Warm ivory + rose terracotta — feminine and sculptural
    "--t-bg":           "#FDF5EF",
    "--t-bg-alt":       "#FFFCF9",
    "--t-dark":         "#271A14",
    "--t-dark-surface": "#180F0A",
    "--t-accent":       "#B87355",
    "--t-accent-dim":   "rgba(184,115,85,0.16)",
    "--t-text":         "#271A14",
    "--t-text-muted":   "#8C7B6E",
    "--t-border":       "#EDE0D8",
    "--t-font-heading": "'Garamond', 'Georgia', serif",
    "--t-font-body":    "system-ui, -apple-system, sans-serif",
    "--t-radius":       "0px",
  },

  MODERN: {
    // Clean white + electric indigo — bold and geometric
    "--t-bg":           "#F4F4F8",
    "--t-bg-alt":       "#FFFFFF",
    "--t-dark":         "#0A0A14",
    "--t-dark-surface": "#06060E",
    "--t-accent":       "#5B5FED",
    "--t-accent-dim":   "rgba(91,95,237,0.12)",
    "--t-text":         "#0F0F1A",
    "--t-text-muted":   "#6B6B80",
    "--t-border":       "#E0E0EC",
    "--t-font-heading": "system-ui, -apple-system, 'Segoe UI', sans-serif",
    "--t-font-body":    "system-ui, -apple-system, sans-serif",
    "--t-radius":       "3px",
  },

  MINIMAL: {
    // Pure white + soft graphite — space and quiet
    "--t-bg":           "#F9F9F9",
    "--t-bg-alt":       "#FFFFFF",
    "--t-dark":         "#111111",
    "--t-dark-surface": "#080808",
    "--t-accent":       "#888888",
    "--t-accent-dim":   "rgba(136,136,136,0.12)",
    "--t-text":         "#222222",
    "--t-text-muted":   "#888888",
    "--t-border":       "#E5E5E5",
    "--t-font-heading": "system-ui, -apple-system, sans-serif",
    "--t-font-body":    "system-ui, -apple-system, sans-serif",
    "--t-radius":       "0px",
  },

  LUXURY: {
    // Near-black + deep gold — immersive and dramatic
    "--t-bg":           "#0D0C0A",
    "--t-bg-alt":       "#111009",
    "--t-dark":         "#0D0C0A",
    "--t-dark-surface": "#060504",
    "--t-accent":       "#D4AF6F",
    "--t-accent-dim":   "rgba(212,175,111,0.15)",
    "--t-text":         "#EDE8DF",
    "--t-text-muted":   "#9A8A72",
    "--t-border":       "rgba(212,175,111,0.18)",
    "--t-font-heading": "'Georgia', 'Palatino Linotype', serif",
    "--t-font-body":    "system-ui, -apple-system, sans-serif",
    "--t-radius":       "0px",
  },

  FUN: {
    // Warm amber + playful energy — vibrant celebration
    "--t-bg":           "#FFFBF0",
    "--t-bg-alt":       "#FFFFFF",
    "--t-dark":         "#1C1407",
    "--t-dark-surface": "#1C1407",
    "--t-accent":       "#F59E0B",
    "--t-accent-dim":   "rgba(245,158,11,0.15)",
    "--t-text":         "#1C2333",
    "--t-text-muted":   "#6B7280",
    "--t-border":       "#FDE68A",
    "--t-font-heading": "system-ui, -apple-system, 'Segoe UI', sans-serif",
    "--t-font-body":    "system-ui, -apple-system, sans-serif",
    "--t-radius":       "12px",
  },
};

// Visual metadata for TemplatePicker UI (not injected as CSS)
export const STYLE_META = {
  CLASSIC: {
    label: "Classic",
    description: "Timeless cream & champagne gold",
    icon: "✦",
    preview: { hero: "#1C1917", bg: "#FAF9F6", accent: "#C9A96E" },
  },
  ELEGANT: {
    label: "Elegant",
    description: "Warm ivory & rose terracotta",
    icon: "❧",
    preview: { hero: "#271A14", bg: "#FDF5EF", accent: "#B87355" },
  },
  MODERN: {
    label: "Modern",
    description: "Clean white & electric indigo",
    icon: "◈",
    preview: { hero: "#0A0A14", bg: "#F4F4F8", accent: "#5B5FED" },
  },
  MINIMAL: {
    label: "Minimal",
    description: "Pure white & soft graphite",
    icon: "—",
    preview: { hero: "#111111", bg: "#F9F9F9", accent: "#888888" },
  },
  LUXURY: {
    label: "Luxury",
    description: "Near-black & deep gold",
    icon: "◆",
    preview: { hero: "#060504", bg: "#0D0C0A", accent: "#D4AF6F" },
  },
  FUN: {
    label: "Fun",
    description: "Warm amber & playful energy",
    icon: "★",
    preview: { hero: "#1C1407", bg: "#FFFBF0", accent: "#F59E0B" },
  },
};

export function getTheme(themeId) {
  return STYLE_THEMES[themeId] || STYLE_THEMES.CLASSIC;
}

export function resolveThemeFromSections(sections) {
  for (const s of sections || []) {
    const t = s?.config?._theme;
    if (t && STYLE_THEMES[t]) return STYLE_THEMES[t];
  }
  return STYLE_THEMES.CLASSIC;
}
