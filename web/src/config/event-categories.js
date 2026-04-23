// Category → event_type mapping, style presets, and UI metadata

export const EVENT_CATEGORIES = [
  {
    id: "social",
    label: "Social Events",
    icon: "🎉",
    color: "#8b5cf6",
    bg: "bg-violet-50",
    border: "border-violet-200",
    description: "Celebrations, milestones & gatherings",
    subcategories: [
      { id: "WEDDING",       label: "Wedding",              icon: "💍", eventType: "WEDDING",         preset: "CLASSIC",  ticketDefault: false },
      { id: "ENGAGEMENT",    label: "Engagement",           icon: "💒", eventType: "WEDDING",         preset: "ELEGANT",  ticketDefault: false },
      { id: "BIRTHDAY",      label: "Birthday",             icon: "🎂", eventType: "BIRTHDAY",        preset: "FUN",      ticketDefault: false },
      { id: "ANNIVERSARY",   label: "Anniversary",          icon: "🥂", eventType: "BIRTHDAY",        preset: "ELEGANT",  ticketDefault: false },
      { id: "BABY_SHOWER",   label: "Baby Shower",          icon: "🍼", eventType: "BIRTHDAY",        preset: "FUN",      ticketDefault: false },
      { id: "GENDER_REVEAL", label: "Gender Reveal",        icon: "🎀", eventType: "BIRTHDAY",        preset: "FUN",      ticketDefault: false },
      { id: "GRADUATION",    label: "Graduation",           icon: "🎓", eventType: "OTHER",           preset: "CLASSIC",  ticketDefault: false },
      { id: "FUNERAL",       label: "Funeral / Memorial",   icon: "🕊️", eventType: "FUNERAL",        preset: "MINIMAL",  ticketDefault: false },
      { id: "PRIVATE_PARTY", label: "Private Party",        icon: "🎈", eventType: "BIRTHDAY",        preset: "FUN",      ticketDefault: false },
      { id: "FAMILY_REUNION",label: "Family Reunion",       icon: "👨‍👩‍👧‍👦", eventType: "OTHER",     preset: "CLASSIC",  ticketDefault: false },
    ],
  },
  {
    id: "corporate",
    label: "Corporate & Professional",
    icon: "💼",
    color: "#0ea5e9",
    bg: "bg-sky-50",
    border: "border-sky-200",
    description: "Business meetings, launches & training",
    subcategories: [
      { id: "MEETING",        label: "Meeting",          icon: "📋", eventType: "MEETING",         preset: "MINIMAL",  ticketDefault: false },
      { id: "CONFERENCE",     label: "Conference",       icon: "🎤", eventType: "CORPORATE_EVENT", preset: "MODERN",   ticketDefault: true  },
      { id: "SEMINAR",        label: "Seminar",          icon: "📚", eventType: "CORPORATE_EVENT", preset: "MODERN",   ticketDefault: true  },
      { id: "WORKSHOP",       label: "Workshop",         icon: "🛠️", eventType: "MEETING",        preset: "MODERN",   ticketDefault: false },
      { id: "NETWORKING",     label: "Networking Event", icon: "🤝", eventType: "CORPORATE_EVENT", preset: "MODERN",   ticketDefault: true  },
      { id: "PRODUCT_LAUNCH", label: "Product Launch",   icon: "🚀", eventType: "CORPORATE_EVENT", preset: "MODERN",   ticketDefault: false },
      { id: "COMPANY_PARTY",  label: "Company Party",    icon: "🥳", eventType: "CORPORATE_EVENT", preset: "FUN",      ticketDefault: false },
      { id: "TRAINING",       label: "Training Session", icon: "📝", eventType: "MEETING",         preset: "MINIMAL",  ticketDefault: false },
    ],
  },
  {
    id: "entertainment",
    label: "Ticketed & Entertainment",
    icon: "🎟️",
    color: "#f59e0b",
    bg: "bg-amber-50",
    border: "border-amber-200",
    description: "Concerts, shows & live experiences",
    subcategories: [
      { id: "CONCERT",    label: "Concert",          icon: "🎵", eventType: "CONCERT",         preset: "LUXURY",   ticketDefault: true  },
      { id: "FESTIVAL",   label: "Festival",         icon: "🎪", eventType: "CONCERT",         preset: "FUN",      ticketDefault: true  },
      { id: "LIVE_SHOW",  label: "Live Show",        icon: "🎭", eventType: "CONCERT",         preset: "MODERN",   ticketDefault: true  },
      { id: "NIGHTCLUB",  label: "Nightclub Event",  icon: "🌙", eventType: "CONCERT",         preset: "LUXURY",   ticketDefault: true  },
      { id: "THEATER",    label: "Theater",          icon: "🎬", eventType: "CONCERT",         preset: "ELEGANT",  ticketDefault: true  },
      { id: "COMEDY",     label: "Comedy Show",      icon: "😂", eventType: "CONCERT",         preset: "FUN",      ticketDefault: true  },
      { id: "SPORTS",     label: "Sports Event",     icon: "🏟️", eventType: "CONCERT",         preset: "MODERN",   ticketDefault: true  },
      { id: "EXHIBITION", label: "Exhibition",       icon: "🖼️", eventType: "CORPORATE_EVENT", preset: "MINIMAL",  ticketDefault: true  },
    ],
  },
  {
    id: "religious",
    label: "Religious & Cultural",
    icon: "🕌",
    color: "#10b981",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    description: "Worship, celebrations & ceremonies",
    subcategories: [
      { id: "CHURCH_SERVICE", label: "Church Service",      icon: "⛪", eventType: "CHURCH",    preset: "CLASSIC",  ticketDefault: false },
      { id: "RAMADAN",        label: "Ramadan / Iftar",     icon: "🌙", eventType: "CHURCH",    preset: "ELEGANT",  ticketDefault: false },
      { id: "EID",            label: "Eid Celebration",     icon: "🌟", eventType: "CHURCH",    preset: "FUN",      ticketDefault: false },
      { id: "CHRISTMAS",      label: "Christmas Event",     icon: "🎄", eventType: "CHURCH",    preset: "CLASSIC",  ticketDefault: false },
      { id: "CULTURAL_FEST",  label: "Cultural Festival",   icon: "🎎", eventType: "OTHER",     preset: "FUN",      ticketDefault: true  },
      { id: "CEREMONY",       label: "Traditional Ceremony",icon: "🎋", eventType: "OTHER",     preset: "ELEGANT",  ticketDefault: false },
    ],
  },
  {
    id: "education",
    label: "Education & Community",
    icon: "📖",
    color: "#6366f1",
    bg: "bg-indigo-50",
    border: "border-indigo-200",
    description: "Learning, fundraising & community",
    subcategories: [
      { id: "SCHOOL_EVENT", label: "School Event",        icon: "🏫", eventType: "OTHER",     preset: "CLASSIC",  ticketDefault: false },
      { id: "WEBINAR",      label: "Webinar",             icon: "💻", eventType: "MEETING",   preset: "MODERN",   ticketDefault: false },
      { id: "CLASS",        label: "Class",               icon: "🧑‍🏫", eventType: "MEETING", preset: "MINIMAL",  ticketDefault: true  },
      { id: "BOOTCAMP",     label: "Bootcamp",            icon: "⚡", eventType: "MEETING",   preset: "MODERN",   ticketDefault: true  },
      { id: "COMMUNITY",    label: "Community Gathering", icon: "🏘️", eventType: "OTHER",     preset: "CLASSIC",  ticketDefault: false },
      { id: "CHARITY",      label: "Charity Event",       icon: "❤️", eventType: "OTHER",     preset: "ELEGANT",  ticketDefault: false },
      { id: "FUNDRAISER",   label: "Fundraiser",          icon: "💰", eventType: "OTHER",     preset: "CLASSIC",  ticketDefault: true  },
    ],
  },
  {
    id: "lifestyle",
    label: "Lifestyle & Special Interest",
    icon: "✨",
    color: "#ec4899",
    bg: "bg-pink-50",
    border: "border-pink-200",
    description: "Wellness, fashion, food & arts",
    subcategories: [
      { id: "FITNESS",      label: "Fitness Class",  icon: "🏋️", eventType: "OTHER",   preset: "MODERN",   ticketDefault: true  },
      { id: "RETREAT",      label: "Retreat",        icon: "🧘", eventType: "OTHER",   preset: "MINIMAL",  ticketDefault: true  },
      { id: "TRAVEL",       label: "Travel Event",   icon: "✈️", eventType: "OTHER",   preset: "MODERN",   ticketDefault: true  },
      { id: "FOOD_TASTING", label: "Food Tasting",   icon: "🍷", eventType: "OTHER",   preset: "ELEGANT",  ticketDefault: true  },
      { id: "FASHION_SHOW", label: "Fashion Show",   icon: "👗", eventType: "CONCERT", preset: "LUXURY",   ticketDefault: true  },
      { id: "ART_GALLERY",  label: "Art Gallery",    icon: "🎨", eventType: "OTHER",   preset: "MINIMAL",  ticketDefault: false },
      { id: "POPUP",        label: "Pop-up Event",   icon: "🛍️", eventType: "OTHER",  preset: "FUN",      ticketDefault: false },
    ],
  },
];

export const RSVP_DEFAULTS = {
  allow_rsvp: true,
  allow_ticketing: false,
  allow_donations: false,
  allow_plus_ones: true,
  allow_manual_attendance: true,
  allow_qr_checkin: true,
  visibility: "PRIVATE",
};

export const TICKET_DEFAULTS = {
  allow_rsvp: false,
  allow_ticketing: true,
  allow_donations: false,
  allow_plus_ones: false,
  allow_manual_attendance: true,
  allow_qr_checkin: true,
  visibility: "PUBLIC",
};

export function findSubcategory(subcategoryId) {
  for (const cat of EVENT_CATEGORIES) {
    const sub = cat.subcategories.find((s) => s.id === subcategoryId);
    if (sub) return { category: cat, subcategory: sub };
  }
  return null;
}
