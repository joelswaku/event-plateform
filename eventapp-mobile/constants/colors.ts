export const Colors = {
  bg: {
    primary:  '#07070f',
    card:     '#0e0e16',
    elevated: '#14141f',
    input:    '#0a0a14',
    sheet:    '#111120',
  },
  accent: {
    gold:    '#C9A96E',
    indigo:  '#6366f1',
    emerald: '#10b981',
    amber:   '#f59e0b',
    red:     '#ef4444',
    violet:  '#a78bfa',
    cyan:    '#06b6d4',
  },
  text: {
    primary: '#ffffff',
    muted:   'rgba(255,255,255,0.45)',
    subtle:  'rgba(255,255,255,0.25)',
    inverse: '#07070f',
  },
  border: {
    DEFAULT: 'rgba(255,255,255,0.10)',
    subtle:  'rgba(255,255,255,0.06)',
    strong:  'rgba(255,255,255,0.18)',
  },
  status: {
    PUBLISHED: { bg: 'rgba(16,185,129,0.15)',  text: '#10b981', dot: '#10b981' },
    DRAFT:     { bg: 'rgba(245,158,11,0.15)',  text: '#f59e0b', dot: '#f59e0b' },
    CANCELLED: { bg: 'rgba(239,68,68,0.15)',   text: '#ef4444', dot: '#ef4444' },
    ARCHIVED:  { bg: 'rgba(107,114,128,0.15)', text: '#9ca3af', dot: '#6b7280' },
  },
  tier: {
    free:     { accent: '#10b981', dark: '#022c22', glow: 'rgba(16,185,129,0.25)',  label: 'Free',       icon: '🎁' },
    early:    { accent: '#f59e0b', dark: '#1c1002', glow: 'rgba(245,158,11,0.25)',  label: 'Early Bird', icon: '⚡' },
    standard: { accent: '#6366f1', dark: '#0f0f1f', glow: 'rgba(99,102,241,0.25)', label: 'Standard',   icon: '🎟️' },
    discount: { accent: '#06b6d4', dark: '#0a1520', glow: 'rgba(6,182,212,0.25)',  label: 'Discount',   icon: '🏷️' },
    vip:      { accent: '#C9A96E', dark: '#0f0b00', glow: 'rgba(201,169,110,0.3)', label: 'VIP',        icon: '👑' },
    pro:      { accent: '#a78bfa', dark: '#0d0718', glow: 'rgba(167,139,250,0.3)', label: 'Premium',    icon: '💎' },
  },
} as const;

export type TierKey = keyof typeof Colors.tier;
export type StatusKey = keyof typeof Colors.status;
