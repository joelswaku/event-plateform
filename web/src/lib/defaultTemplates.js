// Keys must match backend SECTION_TEMPLATES keys exactly
export const DEFAULT_TEMPLATES = {
  // exact event_type values from create form
  wedding:          ["HERO", "COUPLE", "STORY", "COUNTDOWN", "SCHEDULE", "VENUE", "GALLERY", "FAQ", "CTA"],
  conference:       ["HERO", "ABOUT", "SPEAKERS", "SCHEDULE", "TICKETS", "VENUE", "FAQ"],
  birthday:         ["HERO", "ABOUT", "COUNTDOWN", "VENUE", "GALLERY", "FAQ", "CTA"],
  corporate:        ["HERO", "ABOUT", "SPEAKERS", "SCHEDULE", "VENUE", "CTA"],
  corporate_event:  ["HERO", "ABOUT", "SPEAKERS", "SCHEDULE", "VENUE", "CTA"],
  funeral:          ["HERO", "ABOUT", "SCHEDULE", "VENUE", "GALLERY", "CTA"],
  meeting:          ["HERO", "ABOUT", "SCHEDULE", "VENUE", "FAQ"],
  concert:          ["HERO", "ABOUT", "SCHEDULE", "TICKETS", "VENUE", "FAQ"],
  church:           ["HERO", "ABOUT", "SCHEDULE", "SPEAKERS", "DONATIONS", "CTA"],
  other:            ["HERO", "ABOUT", "SCHEDULE", "VENUE", "CTA"],
  default:          ["HERO", "ABOUT", "CTA"],
};

// Normalize any event_type string to a template key (handles uppercase from DB)
export function resolveTemplate(eventType) {
  if (!eventType) return DEFAULT_TEMPLATES.default;
  const key = String(eventType).toLowerCase().trim();
  return DEFAULT_TEMPLATES[key] ?? DEFAULT_TEMPLATES.default;
}
