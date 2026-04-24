// Style-based page presets — used in BuilderSidebar "Add preset" dropdown.
// Keys map to the 6 visual styles; sections are generic and work for any event type.
export const PAGE_PRESETS = {
  CLASSIC: {
    label: "Classic",
    sections: ["HERO", "ABOUT", "SCHEDULE", "VENUE", "GALLERY", "FAQ", "CTA"],
  },
  ELEGANT: {
    label: "Elegant",
    sections: ["HERO", "ABOUT", "COUNTDOWN", "VENUE", "GALLERY", "FAQ", "CTA"],
  },
  MODERN: {
    label: "Modern",
    sections: ["HERO", "ABOUT", "SPEAKERS", "SCHEDULE", "VENUE", "FAQ", "CTA"],
  },
  MINIMAL: {
    label: "Minimal",
    sections: ["HERO", "ABOUT", "VENUE", "FAQ", "CTA"],
  },
  LUXURY: {
    label: "Luxury",
    sections: ["HERO", "ABOUT", "COUNTDOWN", "SCHEDULE", "VENUE", "GALLERY", "FAQ", "CTA"],
  },
  FUN: {
    label: "Fun",
    sections: ["HERO", "ABOUT", "COUNTDOWN", "VENUE", "GALLERY", "FAQ", "CTA"],
  },
};

// Event-type-specific presets — sections ordered to put TICKETS prominently.
// Used when the event type is concert / conference / festival / fundraiser.
export const EVENT_TYPE_PRESETS = {
  CONCERT: {
    label: "Concert",
    sections: ["HERO", "ABOUT", "TICKETS", "SCHEDULE", "VENUE", "GALLERY", "FAQ", "CTA"],
  },
  CONFERENCE: {
    label: "Conference",
    sections: ["HERO", "ABOUT", "TICKETS", "SPEAKERS", "SCHEDULE", "VENUE", "FAQ", "CTA"],
  },
  FESTIVAL: {
    label: "Festival",
    sections: ["HERO", "ABOUT", "TICKETS", "SCHEDULE", "VENUE", "GALLERY", "FAQ", "CTA"],
  },
  FUNDRAISER: {
    label: "Fundraiser",
    sections: ["HERO", "ABOUT", "TICKETS", "DONATIONS", "VENUE", "FAQ", "CTA"],
  },
  WORKSHOP: {
    label: "Workshop",
    sections: ["HERO", "ABOUT", "TICKETS", "SPEAKERS", "SCHEDULE", "VENUE", "FAQ", "CTA"],
  },
  SPORTS: {
    label: "Sports",
    sections: ["HERO", "ABOUT", "TICKETS", "COUNTDOWN", "VENUE", "FAQ", "CTA"],
  },
};
