// ─── User ─────────────────────────────────────────────────────────────────────
export interface User {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  default_organization_id: string;
  subscription_plan: 'free' | 'premium';
  is_subscribed: boolean;
}

// ─── Event ────────────────────────────────────────────────────────────────────
export type EventStatus = 'DRAFT' | 'PUBLISHED' | 'CANCELLED' | 'ARCHIVED';
export type Visibility  = 'PUBLIC' | 'PRIVATE';

export interface Event {
  id: string;
  title: string;
  slug: string;
  event_type: string;
  description: string | null;
  short_description: string | null;
  cover_image_url: string | null;
  banner_url: string | null;
  status: EventStatus;
  runtime_status: string;
  visibility: Visibility;
  venue_name: string | null;
  venue_address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  timezone: string;
  starts_at_utc: string | null;
  ends_at_utc: string | null;
  starts_at_local: string | null;
  ends_at_local: string | null;
  allow_rsvp: boolean;
  allow_plus_ones: boolean;
  allow_qr_checkin: boolean;
  allow_ticketing: boolean;
  allow_donations: boolean;
  dashboard_mode: string | null;
  organization_id: string;
  created_at: string;
  updated_at: string;
}

export interface EventDashboard {
  event: Event;
  stats: {
    guest_count: number;
    attending_count: number;
    ticket_count: number;
    checkin_count: number;
  };
}

export interface EventCreatePayload {
  title: string;
  event_type: string;
  starts_at?: string;
  ends_at?: string;
  timezone: string;
  description?: string;
  short_description?: string;
  visibility?: Visibility;
  venue_name?: string;
  venue_address?: string;
  city?: string;
  state?: string;
  country?: string;
  allow_rsvp?: boolean;
  allow_ticketing?: boolean;
  allow_qr_checkin?: boolean;
  allow_donations?: boolean;
  allow_plus_ones?: boolean;
  dashboard_mode?: string;
}

// ─── Guest ────────────────────────────────────────────────────────────────────
export type GuestStatus = 'PENDING' | 'CONFIRMED' | 'DECLINED';

export interface Guest {
  id: string;
  event_id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  status: GuestStatus;
  rsvp_status: string | null;
  is_vip: boolean;
  plus_one_allowed: boolean;
  plus_one_count: number;
  checked_in_at: string | null;
  group_id: string | null;
  created_at: string;
}

export interface GuestGroup {
  id: string;
  event_id: string;
  name: string;
  created_at: string;
}

export interface GuestRsvp {
  id: string;
  guest_id: string;
  event_id: string;
  rsvp_status: string;
  responded_at: string | null;
  notes: string | null;
}

export interface GuestAttendance {
  id: string;
  guest_id: string;
  event_id: string;
  checked_in_at: string;
  checked_in_by: string | null;
}

export interface GuestDashboard {
  total: number;
  confirmed: number;
  pending: number;
  declined: number;
  checked_in: number;
}

// ─── Tickets ──────────────────────────────────────────────────────────────────
export type TicketKind = 'FREE' | 'PAID' | 'DONATION';

export interface TicketType {
  id: string;
  event_id: string;
  name: string;
  kind: TicketKind;
  price: number;
  currency: string;
  quantity_total: number | null;
  quantity_sold: number;
  is_active: boolean;
  description: string | null;
  sale_starts_at: string | null;
  sale_ends_at: string | null;
}

export interface IssuedTicket {
  id: string;
  ticket_number: string;
  qr_token: string;
  qr_status: 'ACTIVE' | 'USED' | 'REVOKED';
  event_title: string;
  event_slug: string;
  starts_at_utc: string | null;
  venue_name: string | null;
  city: string | null;
  cover_image_url: string | null;
  ticket_type_name: string;
  buyer_name: string;
  buyer_email: string;
  checked_in_at: string | null;
  kind: TicketKind;
  price: number;
  currency: string;
}

export interface TicketOrder {
  id: string;
  buyer_name: string;
  buyer_email: string;
  total: number;
  currency: string;
  order_status: string;
  payment_status: string;
  created_at: string;
}

export interface TicketStats {
  gross_revenue: number;
  paid_orders: number;
  total_orders: number;
  total_issued: number;
  checked_in: number;
  by_ticket_type: Array<{
    ticket_type_id: string;
    name: string;
    quantity_sold: number;
    revenue: number;
    quantity_total: number | null;
  }>;
}

export interface PurchaseOrderPayload {
  buyer_name: string;
  buyer_email: string;
  buyer_phone?: string;
  items: Array<{ ticket_type_id: string; quantity: number }>;
}

export interface PurchaseOrderResult {
  order_id: string;
  payment_required: boolean;
  checkout_url: string | null;
  order_status: string;
  payment_status: string;
  total: number;
  currency: string;
  issued_tickets: IssuedTicket[] | null;
}

// ─── Scanner ──────────────────────────────────────────────────────────────────
export type ScanResultType = 'SUCCESS' | 'DUPLICATE' | 'INVALID' | 'REVOKED' | 'QUEUED';

export interface ScanResult {
  type: ScanResultType;
  qr_token: string;
  holder_name?: string;
  holder_email?: string;
  ticket_type_name?: string;
  message?: string;
  scanned_at: string;
}

export interface OfflineScan {
  qr_token: string;
  eventId: string;
  queued_at: string;
  status: 'pending';
}

export interface ScannerStats {
  total_issued: number;
  checked_in: number;
  total_guests: number;
  recent_scans: ScanResult[];
}

// ─── Subscription ─────────────────────────────────────────────────────────────
export interface SubscriptionStatus {
  is_subscribed: boolean;
  plan: 'free' | 'premium';
  subscription_status: 'active' | 'past_due' | 'canceled' | 'trialing' | null;
  current_period_end: string | null;
  usage: { events: number };
  limits: { events: number; templates: number; guests: number };
}

export interface PlanLimits {
  events: number;
  templates: number;
  guests: number;
}

export interface PlanUsage {
  events: number;
}

// ─── Seating ──────────────────────────────────────────────────────────────────
export interface SeatingLocation {
  id: string;
  event_id: string;
  name: string;
  capacity: number;
  location_type: string;
  position_x: number | null;
  position_y: number | null;
  created_at: string;
  updated_at: string;
}

export interface SeatingAssignment {
  id: string;
  event_id: string;
  guest_id: string;
  seating_table_id: string;
  seat_number: number | null;
  created_at: string;
}

export interface SeatingChartEntry extends SeatingLocation {
  assignments: SeatingAssignment[];
}

export interface SeatingStats {
  totalCapacity: number;
  assigned: number;
  unassigned: number;
  fillRate: number;
  tableCount: number;
}

// ─── Builder ──────────────────────────────────────────────────────────────────
export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export type SectionType =
  | 'HERO' | 'ABOUT' | 'STORY' | 'COUPLE' | 'COUNTDOWN' | 'VENUE'
  | 'REGISTRY' | 'GALLERY' | 'SCHEDULE' | 'SPEAKERS' | 'TICKETS'
  | 'DONATIONS' | 'FAQ' | 'CTA';

export interface BuilderSection {
  id: string;
  event_id: string;
  section_type: SectionType | string;
  template_key: string;
  config: Record<string, unknown>;
  is_visible: boolean;
  position_order: number;
  created_at: string;
  updated_at: string;
}

export interface BuilderPage {
  id: string;
  event_id: string;
  status: string;
  slug: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface BuilderData {
  event: Event;
  page: BuilderPage | null;
  sections: BuilderSection[];
}
