--
-- PostgreSQL database dump
--

\restrict NRZJlaNS0XCfyHkp27DxpvMqJmert6n9gAv7w2LeCK6II3ghtCSLudwp79kfSsp

-- Dumped from database version 18.1
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: citext; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS citext WITH SCHEMA public;


--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: activity_level; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.activity_level AS ENUM (
    'INFO',
    'WARNING',
    'CRITICAL'
);


--
-- Name: attendance_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.attendance_status AS ENUM (
    'NOT_MARKED',
    'PRESENT',
    'ABSENT',
    'LATE',
    'CHECKED_IN'
);


--
-- Name: booking_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.booking_status AS ENUM (
    'REQUESTED',
    'ACCEPTED',
    'REJECTED',
    'CANCELLED',
    'COMPLETED'
);


--
-- Name: checkin_method; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.checkin_method AS ENUM (
    'MANUAL',
    'QR'
);


--
-- Name: discount_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.discount_type AS ENUM (
    'PERCENTAGE',
    'FIXED_AMOUNT'
);


--
-- Name: event_member_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.event_member_role AS ENUM (
    'OWNER',
    'ADMIN',
    'MANAGER',
    'CHECKIN_AGENT',
    'STAFF',
    'VIEWER'
);


--
-- Name: event_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.event_status AS ENUM (
    'DRAFT',
    'PUBLISHED',
    'ARCHIVED',
    'CANCELLED',
    'COMPLETED'
);


--
-- Name: event_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.event_type AS ENUM (
    'WEDDING',
    'FUNERAL',
    'MEETING',
    'CHURCH_CONFERENCE',
    'BIRTHDAY',
    'CORPORATE_EVENT',
    'GRADUATION',
    'PARTY',
    'BABY_SHOWER',
    'ENGAGEMENT',
    'OTHER'
);


--
-- Name: event_visibility; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.event_visibility AS ENUM (
    'PUBLIC',
    'PRIVATE',
    'UNLISTED'
);


--
-- Name: invitation_channel; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.invitation_channel AS ENUM (
    'EMAIL',
    'SMS',
    'WHATSAPP',
    'LINK'
);


--
-- Name: invitation_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.invitation_status AS ENUM (
    'PENDING',
    'SENT',
    'DELIVERED',
    'FAILED',
    'OPENED'
);


--
-- Name: media_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.media_type AS ENUM (
    'IMAGE',
    'VIDEO',
    'DOCUMENT',
    'AUDIO'
);


--
-- Name: message_provider; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.message_provider AS ENUM (
    'BREVO',
    'TWILIO',
    'WHATSAPP_CLOUD',
    'INTERNAL',
    'OTHER'
);


--
-- Name: notification_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.notification_type AS ENUM (
    'SYSTEM',
    'EVENT',
    'PAYMENT',
    'INVITATION',
    'CHECKIN',
    'MARKETPLACE'
);


--
-- Name: order_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.order_status AS ENUM (
    'PENDING',
    'PAID',
    'CANCELLED',
    'REFUNDED',
    'COMPLETED'
);


--
-- Name: org_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.org_role AS ENUM (
    'OWNER',
    'ADMIN',
    'MANAGER',
    'STAFF',
    'VIEWER'
);


--
-- Name: payment_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.payment_status AS ENUM (
    'PENDING',
    'SUCCEEDED',
    'FAILED',
    'REFUNDED',
    'CANCELLED',
    'PAID'
);


--
-- Name: qr_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.qr_status AS ENUM (
    'ACTIVE',
    'USED',
    'REVOKED',
    'EXPIRED'
);


--
-- Name: reminder_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.reminder_type AS ENUM (
    'RSVP_REMINDER',
    'EVENT_REMINDER',
    'PAYMENT_REMINDER'
);


--
-- Name: rsvp_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.rsvp_status AS ENUM (
    'PENDING',
    'GOING',
    'MAYBE',
    'DECLINED'
);


--
-- Name: subscription_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.subscription_status AS ENUM (
    'TRIALING',
    'ACTIVE',
    'PAST_DUE',
    'CANCELLED',
    'EXPIRED'
);


--
-- Name: ticket_type_kind; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.ticket_type_kind AS ENUM (
    'FREE',
    'PAID',
    'DONATION'
);


--
-- Name: upload_owner_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.upload_owner_type AS ENUM (
    'USER',
    'ORGANIZATION',
    'EVENT',
    'VENDOR'
);


--
-- Name: user_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.user_status AS ENUM (
    'ACTIVE',
    'PENDING',
    'SUSPENDED',
    'DELETED'
);


--
-- Name: vendor_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.vendor_status AS ENUM (
    'PENDING',
    'APPROVED',
    'REJECTED',
    'SUSPENDED'
);


--
-- Name: assign_ticket_number(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.assign_ticket_number() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
    BEGIN
      IF NEW.ticket_number IS NULL THEN
        NEW.ticket_number := 'TKT-' || LPAD(nextval('ticket_number_seq')::text, 6, '0');
      END IF;
      RETURN NEW;
    END;
    $$;


--
-- Name: set_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.set_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: activities; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.activities (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    organization_id uuid,
    event_id uuid,
    actor_user_id uuid,
    activity_type character varying(100) NOT NULL,
    activity_level public.activity_level DEFAULT 'INFO'::public.activity_level NOT NULL,
    entity_type character varying(100),
    entity_id uuid,
    message text,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_activity_type_not_blank CHECK ((btrim((activity_type)::text) <> ''::text))
);


--
-- Name: ai_chatbot_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ai_chatbot_sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    event_id uuid NOT NULL,
    session_token text NOT NULL,
    visitor_id text,
    messages jsonb DEFAULT '[]'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: ai_generation_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ai_generation_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    organization_id text,
    user_id uuid,
    event_id uuid,
    feature text NOT NULL,
    input_tokens integer DEFAULT 0,
    output_tokens integer DEFAULT 0,
    input_snapshot text,
    output_snapshot text,
    latency_ms integer,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: api_keys; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.api_keys (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    organization_id uuid NOT NULL,
    name character varying(100) NOT NULL,
    key_hash text NOT NULL,
    last_used_at timestamp with time zone,
    expires_at timestamp with time zone,
    revoked_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    organization_id uuid,
    actor_user_id uuid,
    entity_type character varying(100) NOT NULL,
    entity_id uuid,
    action character varying(100) NOT NULL,
    changes jsonb DEFAULT '{}'::jsonb NOT NULL,
    ip_address inet,
    user_agent text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    admin_email text,
    resource_id text
);


--
-- Name: auth_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.auth_sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    refresh_token_hash text NOT NULL,
    device_name character varying(150),
    user_agent text,
    ip_address inet,
    expires_at timestamp with time zone NOT NULL,
    revoked_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    session_status character varying(30) DEFAULT 'ACTIVE'::character varying NOT NULL,
    replaced_by_session_id uuid,
    last_used_at timestamp with time zone,
    revoked_reason character varying(100),
    CONSTRAINT chk_auth_session_hash_not_blank CHECK ((btrim(refresh_token_hash) <> ''::text))
);


--
-- Name: billing_invoices; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.billing_invoices (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    organization_id uuid NOT NULL,
    subscription_id uuid,
    invoice_number character varying(100) NOT NULL,
    amount numeric(12,2) NOT NULL,
    currency character varying(10) DEFAULT 'USD'::character varying NOT NULL,
    payment_status public.payment_status DEFAULT 'PENDING'::public.payment_status NOT NULL,
    issued_at timestamp with time zone DEFAULT now() NOT NULL,
    due_at timestamp with time zone,
    paid_at timestamp with time zone,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    CONSTRAINT chk_invoice_amount_non_negative CHECK ((amount >= (0)::numeric))
);


--
-- Name: broadcast_notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.broadcast_notifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    body text NOT NULL,
    image_url text,
    deep_link text,
    audience text DEFAULT 'all'::text NOT NULL,
    status text DEFAULT 'draft'::text NOT NULL,
    scheduled_at timestamp with time zone,
    sent_at timestamp with time zone,
    sent_count integer DEFAULT 0,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: checkin_devices; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.checkin_devices (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    organization_id uuid,
    event_id uuid,
    device_name character varying(150) NOT NULL,
    device_code character varying(100) NOT NULL,
    last_seen_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_checkin_device_name_not_blank CHECK ((btrim((device_name)::text) <> ''::text))
);


--
-- Name: conversation_participants; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.conversation_participants (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    conversation_id uuid NOT NULL,
    user_id uuid NOT NULL,
    role character varying(20) DEFAULT 'member'::character varying NOT NULL,
    last_read_at timestamp with time zone,
    muted boolean DEFAULT false NOT NULL,
    archived boolean DEFAULT false NOT NULL,
    joined_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


--
-- Name: conversations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.conversations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    type character varying(20) DEFAULT 'direct'::character varying NOT NULL,
    title text,
    event_id uuid,
    created_by uuid,
    direct_key text,
    last_message_at timestamp with time zone,
    last_message_preview text,
    last_message_sender uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: discount_codes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.discount_codes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    event_id uuid NOT NULL,
    code character varying(50) NOT NULL,
    discount_type public.discount_type NOT NULL,
    discount_value numeric(12,2) NOT NULL,
    usage_limit integer,
    usage_count integer DEFAULT 0 NOT NULL,
    starts_at timestamp with time zone,
    ends_at timestamp with time zone,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_discount_code_not_blank CHECK ((btrim((code)::text) <> ''::text)),
    CONSTRAINT chk_discount_usage_count_non_negative CHECK ((usage_count >= 0)),
    CONSTRAINT chk_discount_usage_limit_positive CHECK (((usage_limit IS NULL) OR (usage_limit > 0))),
    CONSTRAINT chk_discount_value_positive CHECK ((discount_value > (0)::numeric))
);


--
-- Name: email_verification_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.email_verification_tokens (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    token_hash text NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    used boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_email_verification_hash_not_blank CHECK ((btrim(token_hash) <> ''::text))
);


--
-- Name: event_activity_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.event_activity_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    event_id uuid,
    user_id uuid,
    action character varying(100),
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: event_dashboard_widgets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.event_dashboard_widgets (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    event_id uuid NOT NULL,
    widget_key character varying(100) NOT NULL,
    widget_title character varying(150) NOT NULL,
    position_order integer DEFAULT 0 NOT NULL,
    is_enabled boolean DEFAULT true NOT NULL,
    config jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: event_donation_config; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.event_donation_config (
    event_id uuid NOT NULL,
    amounts jsonb DEFAULT '[]'::jsonb NOT NULL,
    updated_at timestamp with time zone DEFAULT now(),
    message text
);


--
-- Name: event_donations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.event_donations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    event_id uuid NOT NULL,
    donor_name character varying(150),
    donor_email public.citext,
    donor_phone character varying(30),
    amount numeric(12,2) NOT NULL,
    currency character varying(10) DEFAULT 'USD'::character varying NOT NULL,
    payment_status public.payment_status DEFAULT 'PENDING'::public.payment_status NOT NULL,
    message text,
    is_anonymous boolean DEFAULT false NOT NULL,
    provider character varying(50),
    provider_transaction_id character varying(255),
    donated_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    frequency character varying(10) DEFAULT 'once'::character varying,
    subscription_id text,
    CONSTRAINT chk_donation_amount_positive CHECK ((amount > (0)::numeric))
);


--
-- Name: event_invitations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.event_invitations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    event_id uuid NOT NULL,
    email text NOT NULL,
    invited_by uuid NOT NULL,
    token uuid DEFAULT gen_random_uuid() NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    expires_at timestamp with time zone DEFAULT (now() + '7 days'::interval),
    accepted_at timestamp with time zone,
    invite_code_hash text,
    invited_name text,
    role text DEFAULT 'ADMIN'::text,
    user_id uuid
);


--
-- Name: event_media; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.event_media (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    event_id uuid NOT NULL,
    uploaded_by uuid,
    upload_id uuid,
    media_type public.media_type NOT NULL,
    file_url text NOT NULL,
    file_name character varying(255),
    mime_type character varying(100),
    file_size bigint,
    caption text,
    is_public boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    CONSTRAINT chk_event_media_url_not_blank CHECK ((btrim(file_url) <> ''::text))
);


--
-- Name: event_members; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.event_members (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    event_id uuid NOT NULL,
    user_id uuid,
    role public.event_member_role DEFAULT 'STAFF'::public.event_member_role NOT NULL,
    invited_by uuid,
    joined_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    email text
);


--
-- Name: event_page_sections; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.event_page_sections (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    event_id uuid NOT NULL,
    section_type character varying(100) NOT NULL,
    title character varying(150),
    body text,
    position_order integer DEFAULT 0 NOT NULL,
    is_visible boolean DEFAULT true NOT NULL,
    config jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


--
-- Name: event_pages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.event_pages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    event_id uuid NOT NULL,
    public_url text,
    seo_title character varying(255),
    seo_description text,
    published_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    page_status character varying(20) DEFAULT 'DRAFT'::character varying NOT NULL,
    draft_version integer DEFAULT 1 NOT NULL,
    published_version integer DEFAULT 0 NOT NULL,
    preview_token text,
    draft_updated_at timestamp with time zone
);


--
-- Name: event_schedule_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.event_schedule_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    event_id uuid NOT NULL,
    title character varying(200) NOT NULL,
    description text,
    starts_at timestamp with time zone NOT NULL,
    ends_at timestamp with time zone,
    location character varying(200),
    position_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    CONSTRAINT chk_schedule_time_range CHECK (((ends_at IS NULL) OR (ends_at >= starts_at))),
    CONSTRAINT chk_schedule_title_not_blank CHECK ((btrim((title)::text) <> ''::text))
);


--
-- Name: event_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.event_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    event_id uuid NOT NULL,
    theme_name character varying(100),
    primary_color character varying(20),
    secondary_color character varying(20),
    font_family character varying(100),
    show_guest_count boolean DEFAULT true NOT NULL,
    show_schedule boolean DEFAULT true NOT NULL,
    show_gallery boolean DEFAULT false NOT NULL,
    show_donation_widget boolean DEFAULT false NOT NULL,
    show_vendor_widget boolean DEFAULT false NOT NULL,
    show_speakers_widget boolean DEFAULT false NOT NULL,
    show_seating_widget boolean DEFAULT false NOT NULL,
    show_memorial_widget boolean DEFAULT false NOT NULL,
    show_gift_registry boolean DEFAULT false NOT NULL,
    custom_settings jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: event_speakers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.event_speakers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    event_id uuid NOT NULL,
    full_name character varying(150) NOT NULL,
    title character varying(150),
    bio text,
    avatar_url text,
    social_links jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    CONSTRAINT chk_speaker_name_not_blank CHECK ((btrim((full_name)::text) <> ''::text))
);


--
-- Name: event_tag_map; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.event_tag_map (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    event_id uuid NOT NULL,
    tag_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: event_tags; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.event_tags (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    organization_id uuid,
    name character varying(100) NOT NULL,
    slug public.citext NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_event_tag_name_not_blank CHECK ((btrim((name)::text) <> ''::text))
);


--
-- Name: event_types; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.event_types (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    organization_id uuid,
    name character varying(100) NOT NULL,
    slug character varying(100) NOT NULL,
    is_default boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: event_volunteers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.event_volunteers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    event_id uuid NOT NULL,
    full_name character varying(150) NOT NULL,
    email public.citext,
    phone character varying(30),
    role_name character varying(100),
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    CONSTRAINT chk_volunteer_name_not_blank CHECK ((btrim((full_name)::text) <> ''::text))
);


--
-- Name: events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    organization_id uuid NOT NULL,
    created_by uuid NOT NULL,
    event_type text DEFAULT 'OTHER'::public.event_type NOT NULL,
    title character varying(200) NOT NULL,
    slug public.citext NOT NULL,
    description text,
    short_description character varying(500),
    banner_url text,
    cover_image_url text,
    status public.event_status DEFAULT 'DRAFT'::public.event_status NOT NULL,
    visibility public.event_visibility DEFAULT 'PRIVATE'::public.event_visibility NOT NULL,
    venue_name character varying(200),
    venue_address text,
    city character varying(100),
    state character varying(100),
    country character varying(100),
    latitude numeric(10,7),
    longitude numeric(10,7),
    timezone character varying(80) DEFAULT 'UTC'::character varying NOT NULL,
    starts_at timestamp with time zone NOT NULL,
    ends_at timestamp with time zone,
    allow_rsvp boolean DEFAULT true NOT NULL,
    allow_plus_ones boolean DEFAULT false NOT NULL,
    allow_manual_attendance boolean DEFAULT true NOT NULL,
    allow_qr_checkin boolean DEFAULT false NOT NULL,
    allow_ticketing boolean DEFAULT false NOT NULL,
    allow_donations boolean DEFAULT false NOT NULL,
    require_creator_verification boolean DEFAULT false NOT NULL,
    creator_verified boolean DEFAULT false NOT NULL,
    dashboard_mode character varying(50),
    custom_domain character varying(255),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    seating_enabled boolean DEFAULT false,
    send_seat_email boolean DEFAULT false,
    open_rsvp boolean DEFAULT false NOT NULL,
    zip_code character varying(20) DEFAULT NULL::character varying,
    CONSTRAINT chk_event_latitude CHECK (((latitude IS NULL) OR ((latitude >= ('-90'::integer)::numeric) AND (latitude <= (90)::numeric)))),
    CONSTRAINT chk_event_longitude CHECK (((longitude IS NULL) OR ((longitude >= ('-180'::integer)::numeric) AND (longitude <= (180)::numeric)))),
    CONSTRAINT chk_event_slug_not_blank CHECK ((btrim((slug)::text) <> ''::text)),
    CONSTRAINT chk_event_time_range CHECK (((ends_at IS NULL) OR (ends_at >= starts_at))),
    CONSTRAINT chk_event_title_not_blank CHECK ((btrim((title)::text) <> ''::text))
);


--
-- Name: feature_flags; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.feature_flags (
    key text NOT NULL,
    name text NOT NULL,
    description text,
    enabled boolean DEFAULT false NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb,
    updated_by text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: gift_registry_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.gift_registry_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    event_id uuid NOT NULL,
    title character varying(150) NOT NULL,
    description text,
    external_url text,
    price_estimate numeric(12,2),
    currency character varying(10) DEFAULT 'USD'::character varying NOT NULL,
    is_reserved boolean DEFAULT false NOT NULL,
    reserved_by_name character varying(150),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    CONSTRAINT chk_gift_title_not_blank CHECK ((btrim((title)::text) <> ''::text))
);


--
-- Name: guest_attendance; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.guest_attendance (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    guest_id uuid NOT NULL,
    event_id uuid NOT NULL,
    attendance_status public.attendance_status DEFAULT 'NOT_MARKED'::public.attendance_status NOT NULL,
    marked_by_user_id uuid,
    marked_via public.checkin_method DEFAULT 'MANUAL'::public.checkin_method NOT NULL,
    marked_at timestamp with time zone,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: guest_groups; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.guest_groups (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    event_id uuid NOT NULL,
    group_name character varying(150) NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    CONSTRAINT chk_guest_group_name_not_blank CHECK ((btrim((group_name)::text) <> ''::text))
);


--
-- Name: guest_invitations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.guest_invitations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    guest_id uuid NOT NULL,
    event_id uuid NOT NULL,
    channel public.invitation_channel NOT NULL,
    recipient_value character varying(255) NOT NULL,
    invitation_token character varying(255) NOT NULL,
    invitation_status public.invitation_status DEFAULT 'PENDING'::public.invitation_status NOT NULL,
    sent_at timestamp with time zone,
    delivered_at timestamp with time zone,
    opened_at timestamp with time zone,
    failed_reason text,
    provider_message_id character varying(255),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


--
-- Name: guest_qr_passes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.guest_qr_passes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    guest_id uuid NOT NULL,
    event_id uuid NOT NULL,
    qr_token character varying(255) NOT NULL,
    qr_status public.qr_status DEFAULT 'ACTIVE'::public.qr_status NOT NULL,
    expires_at timestamp with time zone,
    used_at timestamp with time zone,
    revoked_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: guest_rsvps; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.guest_rsvps (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    guest_id uuid NOT NULL,
    event_id uuid NOT NULL,
    rsvp_status public.rsvp_status DEFAULT 'PENDING'::public.rsvp_status NOT NULL,
    response_message text,
    responded_at timestamp with time zone,
    plus_one_count integer DEFAULT 0 NOT NULL,
    meal_preference character varying(100),
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_guest_rsvp_plus_one_non_negative CHECK ((plus_one_count >= 0))
);


--
-- Name: guests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.guests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    event_id uuid NOT NULL,
    group_id uuid,
    full_name character varying(150) NOT NULL,
    email public.citext,
    phone character varying(30),
    guest_tag character varying(100),
    side_label character varying(100),
    notes text,
    plus_one_allowed boolean DEFAULT false NOT NULL,
    plus_one_count integer DEFAULT 0 NOT NULL,
    is_vip boolean DEFAULT false NOT NULL,
    manual_presence_marked boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    CONSTRAINT chk_guest_name_not_blank CHECK ((btrim((full_name)::text) <> ''::text)),
    CONSTRAINT chk_guest_plus_one_non_negative CHECK ((plus_one_count >= 0))
);


--
-- Name: issued_tickets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.issued_tickets (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    event_id uuid NOT NULL,
    order_id uuid NOT NULL,
    order_item_id uuid,
    ticket_type_id uuid NOT NULL,
    holder_name character varying(150),
    holder_email public.citext,
    qr_token character varying(255) NOT NULL,
    qr_status public.qr_status DEFAULT 'ACTIVE'::public.qr_status NOT NULL,
    checked_in_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    ticket_number character varying(20)
);


--
-- Name: legal_pages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.legal_pages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    slug character varying(80) NOT NULL,
    title text NOT NULL,
    content text DEFAULT ''::text NOT NULL,
    version character varying(20) DEFAULT '1.0'::character varying NOT NULL,
    effective_date date DEFAULT CURRENT_DATE NOT NULL,
    is_published boolean DEFAULT true NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_by uuid
);


--
-- Name: memorial_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.memorial_messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    event_id uuid NOT NULL,
    author_name character varying(150) NOT NULL,
    author_email public.citext,
    message text NOT NULL,
    is_approved boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    CONSTRAINT chk_memorial_author_not_blank CHECK ((btrim((author_name)::text) <> ''::text)),
    CONSTRAINT chk_memorial_message_not_blank CHECK ((btrim(message) <> ''::text))
);


--
-- Name: messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    conversation_id uuid NOT NULL,
    sender_id uuid,
    body text,
    attachment_url text,
    attachment_type character varying(40),
    kind character varying(20) DEFAULT 'text'::character varying NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    edited_at timestamp with time zone,
    deleted_at timestamp with time zone
);


--
-- Name: moderation_reports; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.moderation_reports (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    reporter_id uuid,
    resource_type text NOT NULL,
    resource_id text NOT NULL,
    reason text NOT NULL,
    details text,
    status text DEFAULT 'pending'::text NOT NULL,
    resolved_by uuid,
    resolved_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: notification_templates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notification_templates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    template_key character varying(100) NOT NULL,
    channel public.invitation_channel NOT NULL,
    subject character varying(255),
    body text NOT NULL,
    variables jsonb DEFAULT '[]'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    type character varying(64) NOT NULL,
    title character varying(255) NOT NULL,
    body text,
    link character varying(512),
    metadata jsonb DEFAULT '{}'::jsonb,
    read_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: organization_members; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.organization_members (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    organization_id uuid NOT NULL,
    user_id uuid NOT NULL,
    role public.org_role DEFAULT 'VIEWER'::public.org_role NOT NULL,
    invited_by uuid,
    joined_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    status character varying(20) DEFAULT 'ACTIVE'::character varying,
    email text
);


--
-- Name: organization_subscriptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.organization_subscriptions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    organization_id uuid NOT NULL,
    plan_id uuid NOT NULL,
    provider character varying(50) DEFAULT 'STRIPE'::character varying NOT NULL,
    provider_customer_id character varying(255),
    provider_subscription_id character varying(255),
    status public.subscription_status DEFAULT 'TRIALING'::public.subscription_status NOT NULL,
    starts_at timestamp with time zone DEFAULT now() NOT NULL,
    ends_at timestamp with time zone,
    trial_ends_at timestamp with time zone,
    cancelled_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


--
-- Name: organizations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.organizations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(150) NOT NULL,
    slug public.citext NOT NULL,
    logo_url text,
    website_url text,
    country character varying(80),
    timezone character varying(80) DEFAULT 'UTC'::character varying NOT NULL,
    default_currency character varying(10) DEFAULT 'USD'::character varying NOT NULL,
    owner_user_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    is_personal boolean DEFAULT false NOT NULL,
    CONSTRAINT chk_org_name_not_blank CHECK ((btrim((name)::text) <> ''::text)),
    CONSTRAINT chk_org_slug_not_blank CHECK ((btrim((slug)::text) <> ''::text))
);


--
-- Name: organizer_saved_vendors; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.organizer_saved_vendors (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    organizer_id uuid NOT NULL,
    vendor_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: organizers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.organizers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    password_hash text NOT NULL,
    company character varying(255),
    phone character varying(50),
    city character varying(100),
    country character varying(100),
    website character varying(512),
    event_types text[] DEFAULT '{}'::text[],
    avatar_url text,
    bio text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: outbound_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.outbound_messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    organization_id uuid,
    event_id uuid,
    guest_id uuid,
    channel public.invitation_channel NOT NULL,
    recipient character varying(255) NOT NULL,
    template_id uuid,
    subject character varying(255),
    body text,
    provider public.message_provider,
    provider_message_id character varying(255),
    status public.invitation_status DEFAULT 'PENDING'::public.invitation_status NOT NULL,
    error_message text,
    scheduled_at timestamp with time zone,
    sent_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    CONSTRAINT chk_outbound_recipient_not_blank CHECK ((btrim((recipient)::text) <> ''::text))
);


--
-- Name: page_themes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.page_themes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(100) NOT NULL,
    slug public.citext NOT NULL,
    is_paid boolean DEFAULT false NOT NULL,
    price numeric(12,2) DEFAULT 0,
    config jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: password_reset_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.password_reset_tokens (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    token_hash text NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    used boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_password_reset_hash_not_blank CHECK ((btrim(token_hash) <> ''::text))
);


--
-- Name: payments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    organization_id uuid,
    event_id uuid,
    order_id uuid,
    payer_user_id uuid,
    provider character varying(50) DEFAULT 'STRIPE'::character varying NOT NULL,
    provider_payment_id character varying(255),
    provider_customer_id character varying(255),
    amount numeric(12,2) NOT NULL,
    currency character varying(10) DEFAULT 'USD'::character varying NOT NULL,
    payment_status public.payment_status DEFAULT 'PENDING'::public.payment_status NOT NULL,
    payment_method character varying(50),
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    paid_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_payment_amount_non_negative CHECK ((amount >= (0)::numeric))
);


--
-- Name: pgmigrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pgmigrations (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    run_on timestamp without time zone NOT NULL
);


--
-- Name: pgmigrations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.pgmigrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: pgmigrations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.pgmigrations_id_seq OWNED BY public.pgmigrations.id;


--
-- Name: planner_activity_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.planner_activity_log (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    project_id uuid NOT NULL,
    user_id uuid,
    actor_name character varying(150),
    action character varying(100) NOT NULL,
    entity_type character varying(50),
    entity_id uuid,
    entity_title character varying(255),
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: planner_budget_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.planner_budget_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    project_id uuid NOT NULL,
    title character varying(255) NOT NULL,
    category character varying(100),
    vendor_name character varying(255),
    estimated_cost numeric(14,2) DEFAULT 0,
    actual_cost numeric(14,2) DEFAULT 0,
    paid_amount numeric(14,2) DEFAULT 0,
    currency character varying(10) DEFAULT 'USD'::character varying,
    payment_status character varying(32) DEFAULT 'UNPAID'::character varying,
    due_date date,
    notes text,
    receipt_url text,
    ai_suggested boolean DEFAULT false,
    position_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: planner_files; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.planner_files (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    project_id uuid NOT NULL,
    user_id uuid NOT NULL,
    folder character varying(100) DEFAULT 'general'::character varying,
    file_name character varying(255) NOT NULL,
    file_url text NOT NULL,
    file_size bigint,
    mime_type character varying(100),
    tags text[] DEFAULT '{}'::text[],
    is_public boolean DEFAULT false,
    uploaded_at timestamp with time zone DEFAULT now()
);


--
-- Name: planner_notes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.planner_notes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    project_id uuid NOT NULL,
    user_id uuid NOT NULL,
    title character varying(255),
    content text,
    content_json jsonb,
    tags text[] DEFAULT '{}'::text[],
    is_pinned boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: planner_projects; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.planner_projects (
    id uuid DEFAULT gen_random_uuid() CONSTRAINT event_planner_projects_id_not_null NOT NULL,
    organization_id text CONSTRAINT event_planner_projects_organization_id_not_null NOT NULL,
    event_id uuid,
    title text CONSTRAINT event_planner_projects_title_not_null NOT NULL,
    event_type text,
    event_date date,
    guest_count integer,
    total_budget numeric(12,2),
    currency text DEFAULT 'USD'::text,
    venue text,
    style_notes text,
    ai_brief text,
    status text DEFAULT 'active'::text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    user_id uuid,
    event_end_date date,
    city text,
    country text,
    health_score integer DEFAULT 0,
    color character varying(16) DEFAULT '#6366f1'::character varying,
    cover_image_url text
);


--
-- Name: planner_tasks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.planner_tasks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    project_id uuid NOT NULL,
    title text NOT NULL,
    category text,
    due_date date,
    status text DEFAULT 'todo'::text,
    priority text DEFAULT 'medium'::text,
    assignee text,
    estimated_cost numeric(12,2),
    actual_cost numeric(12,2),
    ai_generated boolean DEFAULT false,
    position_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    parent_task_id uuid,
    description text,
    reminder_at timestamp with time zone,
    assignee_name character varying(150),
    assignee_email character varying(255),
    assignee_avatar text,
    labels text[] DEFAULT '{}'::text[],
    attachments jsonb DEFAULT '[]'::jsonb,
    comments jsonb DEFAULT '[]'::jsonb,
    progress integer DEFAULT 0,
    completed_at timestamp with time zone
);


--
-- Name: planner_team_members; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.planner_team_members (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    project_id uuid NOT NULL,
    user_id uuid,
    name character varying(150) NOT NULL,
    email character varying(255) NOT NULL,
    role character varying(50) DEFAULT 'VIEWER'::character varying,
    avatar_url text,
    permissions jsonb DEFAULT '{}'::jsonb,
    invited_at timestamp with time zone DEFAULT now(),
    accepted_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: planner_timeline_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.planner_timeline_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    project_id uuid NOT NULL,
    title text NOT NULL,
    item_time time without time zone,
    duration_minutes integer DEFAULT 30,
    category text,
    position_order integer DEFAULT 0,
    ai_generated boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    description text,
    event_date date,
    start_time time without time zone,
    end_time time without time zone,
    color character varying(16),
    location text,
    assignee_name character varying(150),
    is_milestone boolean DEFAULT false,
    is_public boolean DEFAULT false
);


--
-- Name: planner_vendors; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.planner_vendors (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    project_id uuid NOT NULL,
    name text NOT NULL,
    category text,
    contact_name text,
    contact_email text,
    contact_phone text,
    quoted_price numeric(12,2),
    confirmed_price numeric(12,2),
    booking_status text DEFAULT 'researching'::text,
    notes text,
    ai_suggested boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    website_url character varying(512),
    currency character varying(10) DEFAULT 'USD'::character varying,
    rating integer,
    contract_url text,
    files jsonb DEFAULT '[]'::jsonb,
    confirmed_at timestamp with time zone,
    image_url text,
    google_place_id text
);


--
-- Name: push_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.push_tokens (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    token text NOT NULL,
    platform text DEFAULT 'unknown'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: qr_checkins; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.qr_checkins (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    qr_pass_id uuid NOT NULL,
    guest_id uuid NOT NULL,
    event_id uuid NOT NULL,
    checked_in_by uuid,
    device_id uuid,
    app_platform character varying(50),
    location_json jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: reminders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reminders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    event_id uuid NOT NULL,
    reminder_type public.reminder_type NOT NULL,
    channel public.invitation_channel NOT NULL,
    send_at timestamp with time zone NOT NULL,
    audience_filter jsonb DEFAULT '{}'::jsonb NOT NULL,
    is_sent boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: seating_assignments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.seating_assignments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    event_id uuid NOT NULL,
    guest_id uuid NOT NULL,
    seating_table_id uuid NOT NULL,
    seat_number character varying(20),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: seating_tables; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.seating_tables (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    event_id uuid NOT NULL,
    table_name character varying(100) NOT NULL,
    capacity integer NOT NULL,
    shape character varying(50),
    position_x numeric(10,2),
    position_y numeric(10,2),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    CONSTRAINT chk_seating_capacity_positive CHECK ((capacity > 0)),
    CONSTRAINT chk_seating_table_name_not_blank CHECK ((btrim((table_name)::text) <> ''::text))
);


--
-- Name: subscription_plans; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.subscription_plans (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    code character varying(50) NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    price_monthly numeric(12,2) DEFAULT 0 NOT NULL,
    price_yearly numeric(12,2) DEFAULT 0 NOT NULL,
    guest_limit integer,
    active_event_limit integer,
    team_member_limit integer,
    includes_qr boolean DEFAULT false NOT NULL,
    includes_sms boolean DEFAULT false NOT NULL,
    includes_whatsapp boolean DEFAULT false NOT NULL,
    includes_custom_domain boolean DEFAULT false NOT NULL,
    includes_marketplace boolean DEFAULT false NOT NULL,
    includes_advanced_analytics boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    CONSTRAINT chk_plan_code_not_blank CHECK ((btrim((code)::text) <> ''::text)),
    CONSTRAINT chk_plan_name_not_blank CHECK ((btrim((name)::text) <> ''::text)),
    CONSTRAINT chk_plan_price_monthly_non_negative CHECK ((price_monthly >= (0)::numeric)),
    CONSTRAINT chk_plan_price_yearly_non_negative CHECK ((price_yearly >= (0)::numeric))
);


--
-- Name: ticket_number_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.ticket_number_seq
    START WITH 1000
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: ticket_order_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ticket_order_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    order_id uuid NOT NULL,
    ticket_type_id uuid NOT NULL,
    quantity integer NOT NULL,
    unit_price numeric(12,2) NOT NULL,
    line_total numeric(12,2) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_ticket_order_item_math CHECK ((line_total = ((quantity)::numeric * unit_price))),
    CONSTRAINT chk_ticket_order_item_quantity_positive CHECK ((quantity > 0)),
    CONSTRAINT chk_ticket_order_item_unit_price_non_negative CHECK ((unit_price >= (0)::numeric))
);


--
-- Name: ticket_orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ticket_orders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    event_id uuid NOT NULL,
    buyer_user_id uuid,
    discount_code_id uuid,
    buyer_name character varying(150),
    buyer_email public.citext,
    buyer_phone character varying(30),
    order_status public.order_status DEFAULT 'PENDING'::public.order_status NOT NULL,
    subtotal numeric(12,2) DEFAULT 0 NOT NULL,
    discount_amount numeric(12,2) DEFAULT 0 NOT NULL,
    fees numeric(12,2) DEFAULT 0 NOT NULL,
    total numeric(12,2) DEFAULT 0 NOT NULL,
    currency character varying(10) DEFAULT 'USD'::character varying NOT NULL,
    provider character varying(50) DEFAULT 'STRIPE'::character varying NOT NULL,
    provider_payment_intent_id character varying(255),
    payment_status public.payment_status DEFAULT 'PENDING'::public.payment_status NOT NULL,
    paid_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    CONSTRAINT chk_ticket_order_discount_non_negative CHECK ((discount_amount >= (0)::numeric)),
    CONSTRAINT chk_ticket_order_fees_non_negative CHECK ((fees >= (0)::numeric)),
    CONSTRAINT chk_ticket_order_math CHECK ((total = ((subtotal - discount_amount) + fees))),
    CONSTRAINT chk_ticket_order_subtotal_non_negative CHECK ((subtotal >= (0)::numeric)),
    CONSTRAINT chk_ticket_order_total_non_negative CHECK ((total >= (0)::numeric))
);


--
-- Name: ticket_scans; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ticket_scans (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    issued_ticket_id uuid NOT NULL,
    event_id uuid NOT NULL,
    scanned_by uuid,
    device_id text,
    scan_result character varying(50) DEFAULT 'SUCCESS'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: ticket_types; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ticket_types (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    event_id uuid NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    kind public.ticket_type_kind DEFAULT 'FREE'::public.ticket_type_kind NOT NULL,
    price numeric(12,2) DEFAULT 0 NOT NULL,
    currency character varying(10) DEFAULT 'USD'::character varying NOT NULL,
    quantity_total integer,
    quantity_sold integer DEFAULT 0 NOT NULL,
    sale_starts_at timestamp with time zone,
    sale_ends_at timestamp with time zone,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    CONSTRAINT chk_ticket_free_zero CHECK (((kind <> 'FREE'::public.ticket_type_kind) OR (price = (0)::numeric))),
    CONSTRAINT chk_ticket_price_non_negative CHECK ((price >= (0)::numeric)),
    CONSTRAINT chk_ticket_quantity_sold_limit CHECK (((quantity_total IS NULL) OR (quantity_sold <= quantity_total))),
    CONSTRAINT chk_ticket_quantity_sold_non_negative CHECK ((quantity_sold >= 0)),
    CONSTRAINT chk_ticket_quantity_total_positive CHECK (((quantity_total IS NULL) OR (quantity_total > 0))),
    CONSTRAINT chk_ticket_sales_window CHECK (((sale_ends_at IS NULL) OR (sale_starts_at IS NULL) OR (sale_ends_at >= sale_starts_at))),
    CONSTRAINT chk_ticket_type_name_not_blank CHECK ((btrim((name)::text) <> ''::text))
);


--
-- Name: uploads; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.uploads (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    uploaded_by uuid,
    owner_type public.upload_owner_type NOT NULL,
    organization_id uuid,
    event_id uuid,
    vendor_id uuid,
    file_url text NOT NULL,
    file_name character varying(255),
    mime_type character varying(100),
    file_size bigint,
    storage_provider character varying(50) DEFAULT 'S3'::character varying NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_upload_file_size_non_negative CHECK (((file_size IS NULL) OR (file_size >= 0))),
    CONSTRAINT chk_upload_file_url_not_blank CHECK ((btrim(file_url) <> ''::text))
);


--
-- Name: user_notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_notifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    notification_type public.notification_type NOT NULL,
    title character varying(200) NOT NULL,
    body text,
    data jsonb DEFAULT '{}'::jsonb NOT NULL,
    read_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_user_notification_title_not_blank CHECK ((btrim((title)::text) <> ''::text))
);


--
-- Name: user_oauth_accounts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_oauth_accounts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    provider character varying(50) NOT NULL,
    provider_user_id character varying(255) NOT NULL,
    access_token text,
    refresh_token text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_oauth_provider_not_blank CHECK ((btrim((provider)::text) <> ''::text)),
    CONSTRAINT chk_oauth_provider_user_not_blank CHECK ((btrim((provider_user_id)::text) <> ''::text))
);


--
-- Name: user_terms_acceptance; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_terms_acceptance (
    user_id uuid NOT NULL,
    accepted_at timestamp with time zone DEFAULT now() NOT NULL,
    terms_version character varying(20) NOT NULL,
    ip_address text,
    user_agent text
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email public.citext NOT NULL,
    password_hash text,
    full_name character varying(150) NOT NULL,
    phone character varying(30),
    avatar_url text,
    status public.user_status DEFAULT 'PENDING'::public.user_status NOT NULL,
    email_verified boolean DEFAULT false NOT NULL,
    phone_verified boolean DEFAULT false NOT NULL,
    last_login_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    default_organization_id uuid,
    stripe_customer_id character varying(255) DEFAULT NULL::character varying,
    subscription_id character varying(255) DEFAULT NULL::character varying,
    subscription_status character varying(50) DEFAULT NULL::character varying,
    subscription_plan character varying(50) DEFAULT '''free'''::character varying,
    subscription_current_period_end timestamp with time zone,
    is_subscribed boolean DEFAULT false NOT NULL,
    is_super_admin boolean DEFAULT false NOT NULL,
    terms_accepted_at timestamp with time zone,
    terms_version_accepted character varying(20),
    CONSTRAINT chk_users_full_name_not_blank CHECK ((btrim((full_name)::text) <> ''::text))
);


--
-- Name: vendor_bookings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vendor_bookings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    event_id uuid NOT NULL,
    vendor_id uuid NOT NULL,
    service_id uuid,
    booked_by_user_id uuid,
    booking_status public.booking_status DEFAULT 'REQUESTED'::public.booking_status NOT NULL,
    requested_date timestamp with time zone,
    agreed_price numeric(12,2),
    currency character varying(10) DEFAULT 'USD'::character varying NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


--
-- Name: vendor_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vendor_categories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(100) NOT NULL,
    slug public.citext NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


--
-- Name: vendor_inquiries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vendor_inquiries (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    vendor_id uuid NOT NULL,
    sender_name character varying(200) NOT NULL,
    sender_email character varying(255) NOT NULL,
    event_type character varying(100),
    event_date date,
    guest_count integer,
    budget numeric(12,2),
    message text NOT NULL,
    status character varying(30) DEFAULT 'new'::character varying,
    vendor_reply text,
    replied_at timestamp with time zone,
    is_read boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: vendor_reviews; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vendor_reviews (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    vendor_id uuid NOT NULL,
    booking_id uuid,
    reviewer_user_id uuid,
    rating integer NOT NULL,
    review_text text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    CONSTRAINT vendor_reviews_rating_check CHECK (((rating >= 1) AND (rating <= 5)))
);


--
-- Name: vendor_services; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vendor_services (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    vendor_id uuid NOT NULL,
    title character varying(150) NOT NULL,
    description text,
    price_from numeric(12,2),
    currency character varying(10) DEFAULT 'USD'::character varying NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    CONSTRAINT chk_vendor_service_title_not_blank CHECK ((btrim((title)::text) <> ''::text))
);


--
-- Name: vendors; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vendors (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    organization_id uuid,
    owner_user_id uuid,
    category_id uuid,
    business_name character varying(150) NOT NULL,
    slug public.citext NOT NULL,
    description text,
    email public.citext,
    phone character varying(30),
    website_url text,
    logo_url text,
    city character varying(100),
    state character varying(100),
    country character varying(100),
    status public.vendor_status DEFAULT 'PENDING'::public.vendor_status NOT NULL,
    average_rating numeric(3,2) DEFAULT 0 NOT NULL,
    total_reviews integer DEFAULT 0 NOT NULL,
    verified boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    is_active boolean DEFAULT true,
    is_featured boolean DEFAULT false,
    category character varying(100) DEFAULT 'General'::character varying,
    subcategories text[],
    tagline character varying(300),
    bio text,
    cover_url text,
    service_area character varying(500),
    base_price numeric(12,2),
    currency character varying(10) DEFAULT 'USD'::character varying,
    price_label character varying(100) DEFAULT 'Starting from'::character varying,
    verification_status character varying(30) DEFAULT 'pending'::character varying,
    verification_score integer DEFAULT 0,
    tier character varying(20) DEFAULT 'bronze'::character varying,
    rating numeric(3,2) DEFAULT 0,
    review_count integer DEFAULT 0,
    booking_count integer DEFAULT 0,
    profile_views integer DEFAULT 0,
    inquiry_count integer DEFAULT 0,
    response_time_hours integer,
    portfolio jsonb DEFAULT '[]'::jsonb,
    services jsonb DEFAULT '[]'::jsonb,
    social_links jsonb DEFAULT '{}'::jsonb,
    password_hash text,
    CONSTRAINT chk_vendor_business_name_not_blank CHECK ((btrim((business_name)::text) <> ''::text)),
    CONSTRAINT chk_vendor_rating_range CHECK (((average_rating >= (0)::numeric) AND (average_rating <= (5)::numeric))),
    CONSTRAINT chk_vendor_slug_not_blank CHECK ((btrim((slug)::text) <> ''::text)),
    CONSTRAINT chk_vendor_total_reviews_non_negative CHECK ((total_reviews >= 0))
);


--
-- Name: webhook_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.webhook_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    provider character varying(50) NOT NULL,
    event_type character varying(100) NOT NULL,
    external_event_id character varying(255),
    payload jsonb NOT NULL,
    processed boolean DEFAULT false NOT NULL,
    processed_at timestamp with time zone,
    error_message text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: pgmigrations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pgmigrations ALTER COLUMN id SET DEFAULT nextval('public.pgmigrations_id_seq'::regclass);


--
-- Name: activities activities_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activities
    ADD CONSTRAINT activities_pkey PRIMARY KEY (id);


--
-- Name: ai_chatbot_sessions ai_chatbot_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_chatbot_sessions
    ADD CONSTRAINT ai_chatbot_sessions_pkey PRIMARY KEY (id);


--
-- Name: ai_chatbot_sessions ai_chatbot_sessions_session_token_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_chatbot_sessions
    ADD CONSTRAINT ai_chatbot_sessions_session_token_key UNIQUE (session_token);


--
-- Name: ai_generation_logs ai_generation_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_generation_logs
    ADD CONSTRAINT ai_generation_logs_pkey PRIMARY KEY (id);


--
-- Name: api_keys api_keys_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.api_keys
    ADD CONSTRAINT api_keys_pkey PRIMARY KEY (id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: auth_sessions auth_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.auth_sessions
    ADD CONSTRAINT auth_sessions_pkey PRIMARY KEY (id);


--
-- Name: billing_invoices billing_invoices_invoice_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.billing_invoices
    ADD CONSTRAINT billing_invoices_invoice_number_key UNIQUE (invoice_number);


--
-- Name: billing_invoices billing_invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.billing_invoices
    ADD CONSTRAINT billing_invoices_pkey PRIMARY KEY (id);


--
-- Name: broadcast_notifications broadcast_notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.broadcast_notifications
    ADD CONSTRAINT broadcast_notifications_pkey PRIMARY KEY (id);


--
-- Name: checkin_devices checkin_devices_device_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.checkin_devices
    ADD CONSTRAINT checkin_devices_device_code_key UNIQUE (device_code);


--
-- Name: checkin_devices checkin_devices_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.checkin_devices
    ADD CONSTRAINT checkin_devices_pkey PRIMARY KEY (id);


--
-- Name: conversation_participants conversation_participants_conversation_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversation_participants
    ADD CONSTRAINT conversation_participants_conversation_id_user_id_key UNIQUE (conversation_id, user_id);


--
-- Name: conversation_participants conversation_participants_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversation_participants
    ADD CONSTRAINT conversation_participants_pkey PRIMARY KEY (id);


--
-- Name: conversations conversations_direct_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_direct_key_key UNIQUE (direct_key);


--
-- Name: conversations conversations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_pkey PRIMARY KEY (id);


--
-- Name: discount_codes discount_codes_event_id_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.discount_codes
    ADD CONSTRAINT discount_codes_event_id_code_key UNIQUE (event_id, code);


--
-- Name: discount_codes discount_codes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.discount_codes
    ADD CONSTRAINT discount_codes_pkey PRIMARY KEY (id);


--
-- Name: email_verification_tokens email_verification_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_verification_tokens
    ADD CONSTRAINT email_verification_tokens_pkey PRIMARY KEY (id);


--
-- Name: event_activity_logs event_activity_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_activity_logs
    ADD CONSTRAINT event_activity_logs_pkey PRIMARY KEY (id);


--
-- Name: event_dashboard_widgets event_dashboard_widgets_event_id_widget_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_dashboard_widgets
    ADD CONSTRAINT event_dashboard_widgets_event_id_widget_key_key UNIQUE (event_id, widget_key);


--
-- Name: event_dashboard_widgets event_dashboard_widgets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_dashboard_widgets
    ADD CONSTRAINT event_dashboard_widgets_pkey PRIMARY KEY (id);


--
-- Name: event_donation_config event_donation_config_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_donation_config
    ADD CONSTRAINT event_donation_config_pkey PRIMARY KEY (event_id);


--
-- Name: event_donations event_donations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_donations
    ADD CONSTRAINT event_donations_pkey PRIMARY KEY (id);


--
-- Name: event_invitations event_invitations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_invitations
    ADD CONSTRAINT event_invitations_pkey PRIMARY KEY (id);


--
-- Name: event_invitations event_invitations_token_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_invitations
    ADD CONSTRAINT event_invitations_token_key UNIQUE (token);


--
-- Name: event_media event_media_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_media
    ADD CONSTRAINT event_media_pkey PRIMARY KEY (id);


--
-- Name: event_members event_members_event_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_members
    ADD CONSTRAINT event_members_event_id_user_id_key UNIQUE (event_id, user_id);


--
-- Name: event_members event_members_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_members
    ADD CONSTRAINT event_members_pkey PRIMARY KEY (id);


--
-- Name: event_page_sections event_page_sections_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_page_sections
    ADD CONSTRAINT event_page_sections_pkey PRIMARY KEY (id);


--
-- Name: event_pages event_pages_event_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_pages
    ADD CONSTRAINT event_pages_event_id_key UNIQUE (event_id);


--
-- Name: event_pages event_pages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_pages
    ADD CONSTRAINT event_pages_pkey PRIMARY KEY (id);


--
-- Name: planner_projects event_planner_projects_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.planner_projects
    ADD CONSTRAINT event_planner_projects_pkey PRIMARY KEY (id);


--
-- Name: event_schedule_items event_schedule_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_schedule_items
    ADD CONSTRAINT event_schedule_items_pkey PRIMARY KEY (id);


--
-- Name: event_settings event_settings_event_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_settings
    ADD CONSTRAINT event_settings_event_id_key UNIQUE (event_id);


--
-- Name: event_settings event_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_settings
    ADD CONSTRAINT event_settings_pkey PRIMARY KEY (id);


--
-- Name: event_speakers event_speakers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_speakers
    ADD CONSTRAINT event_speakers_pkey PRIMARY KEY (id);


--
-- Name: event_tag_map event_tag_map_event_id_tag_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_tag_map
    ADD CONSTRAINT event_tag_map_event_id_tag_id_key UNIQUE (event_id, tag_id);


--
-- Name: event_tag_map event_tag_map_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_tag_map
    ADD CONSTRAINT event_tag_map_pkey PRIMARY KEY (id);


--
-- Name: event_tags event_tags_organization_id_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_tags
    ADD CONSTRAINT event_tags_organization_id_slug_key UNIQUE (organization_id, slug);


--
-- Name: event_tags event_tags_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_tags
    ADD CONSTRAINT event_tags_pkey PRIMARY KEY (id);


--
-- Name: event_types event_types_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_types
    ADD CONSTRAINT event_types_pkey PRIMARY KEY (id);


--
-- Name: event_volunteers event_volunteers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_volunteers
    ADD CONSTRAINT event_volunteers_pkey PRIMARY KEY (id);


--
-- Name: events events_organization_id_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_organization_id_slug_key UNIQUE (organization_id, slug);


--
-- Name: events events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_pkey PRIMARY KEY (id);


--
-- Name: feature_flags feature_flags_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feature_flags
    ADD CONSTRAINT feature_flags_pkey PRIMARY KEY (key);


--
-- Name: gift_registry_items gift_registry_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gift_registry_items
    ADD CONSTRAINT gift_registry_items_pkey PRIMARY KEY (id);


--
-- Name: guest_attendance guest_attendance_guest_id_event_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.guest_attendance
    ADD CONSTRAINT guest_attendance_guest_id_event_id_key UNIQUE (guest_id, event_id);


--
-- Name: guest_attendance guest_attendance_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.guest_attendance
    ADD CONSTRAINT guest_attendance_pkey PRIMARY KEY (id);


--
-- Name: guest_groups guest_groups_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.guest_groups
    ADD CONSTRAINT guest_groups_pkey PRIMARY KEY (id);


--
-- Name: guest_invitations guest_invitations_invitation_token_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.guest_invitations
    ADD CONSTRAINT guest_invitations_invitation_token_key UNIQUE (invitation_token);


--
-- Name: guest_invitations guest_invitations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.guest_invitations
    ADD CONSTRAINT guest_invitations_pkey PRIMARY KEY (id);


--
-- Name: guest_qr_passes guest_qr_passes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.guest_qr_passes
    ADD CONSTRAINT guest_qr_passes_pkey PRIMARY KEY (id);


--
-- Name: guest_qr_passes guest_qr_passes_qr_token_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.guest_qr_passes
    ADD CONSTRAINT guest_qr_passes_qr_token_key UNIQUE (qr_token);


--
-- Name: guest_rsvps guest_rsvps_guest_id_event_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.guest_rsvps
    ADD CONSTRAINT guest_rsvps_guest_id_event_id_key UNIQUE (guest_id, event_id);


--
-- Name: guest_rsvps guest_rsvps_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.guest_rsvps
    ADD CONSTRAINT guest_rsvps_pkey PRIMARY KEY (id);


--
-- Name: guests guests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.guests
    ADD CONSTRAINT guests_pkey PRIMARY KEY (id);


--
-- Name: issued_tickets issued_tickets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.issued_tickets
    ADD CONSTRAINT issued_tickets_pkey PRIMARY KEY (id);


--
-- Name: issued_tickets issued_tickets_qr_token_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.issued_tickets
    ADD CONSTRAINT issued_tickets_qr_token_key UNIQUE (qr_token);


--
-- Name: legal_pages legal_pages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.legal_pages
    ADD CONSTRAINT legal_pages_pkey PRIMARY KEY (id);


--
-- Name: legal_pages legal_pages_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.legal_pages
    ADD CONSTRAINT legal_pages_slug_key UNIQUE (slug);


--
-- Name: memorial_messages memorial_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.memorial_messages
    ADD CONSTRAINT memorial_messages_pkey PRIMARY KEY (id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- Name: moderation_reports moderation_reports_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.moderation_reports
    ADD CONSTRAINT moderation_reports_pkey PRIMARY KEY (id);


--
-- Name: notification_templates notification_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_templates
    ADD CONSTRAINT notification_templates_pkey PRIMARY KEY (id);


--
-- Name: notification_templates notification_templates_template_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_templates
    ADD CONSTRAINT notification_templates_template_key_key UNIQUE (template_key);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: organization_members organization_members_organization_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organization_members
    ADD CONSTRAINT organization_members_organization_id_user_id_key UNIQUE (organization_id, user_id);


--
-- Name: organization_members organization_members_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organization_members
    ADD CONSTRAINT organization_members_pkey PRIMARY KEY (id);


--
-- Name: organization_subscriptions organization_subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organization_subscriptions
    ADD CONSTRAINT organization_subscriptions_pkey PRIMARY KEY (id);


--
-- Name: organizations organizations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_pkey PRIMARY KEY (id);


--
-- Name: organizations organizations_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_slug_key UNIQUE (slug);


--
-- Name: organizer_saved_vendors organizer_saved_vendors_organizer_id_vendor_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organizer_saved_vendors
    ADD CONSTRAINT organizer_saved_vendors_organizer_id_vendor_id_key UNIQUE (organizer_id, vendor_id);


--
-- Name: organizer_saved_vendors organizer_saved_vendors_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organizer_saved_vendors
    ADD CONSTRAINT organizer_saved_vendors_pkey PRIMARY KEY (id);


--
-- Name: organizers organizers_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organizers
    ADD CONSTRAINT organizers_email_key UNIQUE (email);


--
-- Name: organizers organizers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organizers
    ADD CONSTRAINT organizers_pkey PRIMARY KEY (id);


--
-- Name: outbound_messages outbound_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.outbound_messages
    ADD CONSTRAINT outbound_messages_pkey PRIMARY KEY (id);


--
-- Name: page_themes page_themes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.page_themes
    ADD CONSTRAINT page_themes_pkey PRIMARY KEY (id);


--
-- Name: page_themes page_themes_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.page_themes
    ADD CONSTRAINT page_themes_slug_key UNIQUE (slug);


--
-- Name: password_reset_tokens password_reset_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_pkey PRIMARY KEY (id);


--
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- Name: pgmigrations pgmigrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pgmigrations
    ADD CONSTRAINT pgmigrations_pkey PRIMARY KEY (id);


--
-- Name: planner_activity_log planner_activity_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.planner_activity_log
    ADD CONSTRAINT planner_activity_log_pkey PRIMARY KEY (id);


--
-- Name: planner_budget_items planner_budget_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.planner_budget_items
    ADD CONSTRAINT planner_budget_items_pkey PRIMARY KEY (id);


--
-- Name: planner_files planner_files_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.planner_files
    ADD CONSTRAINT planner_files_pkey PRIMARY KEY (id);


--
-- Name: planner_notes planner_notes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.planner_notes
    ADD CONSTRAINT planner_notes_pkey PRIMARY KEY (id);


--
-- Name: planner_tasks planner_tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.planner_tasks
    ADD CONSTRAINT planner_tasks_pkey PRIMARY KEY (id);


--
-- Name: planner_team_members planner_team_members_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.planner_team_members
    ADD CONSTRAINT planner_team_members_pkey PRIMARY KEY (id);


--
-- Name: planner_timeline_items planner_timeline_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.planner_timeline_items
    ADD CONSTRAINT planner_timeline_items_pkey PRIMARY KEY (id);


--
-- Name: planner_vendors planner_vendors_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.planner_vendors
    ADD CONSTRAINT planner_vendors_pkey PRIMARY KEY (id);


--
-- Name: push_tokens push_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.push_tokens
    ADD CONSTRAINT push_tokens_pkey PRIMARY KEY (id);


--
-- Name: push_tokens push_tokens_user_id_token_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.push_tokens
    ADD CONSTRAINT push_tokens_user_id_token_key UNIQUE (user_id, token);


--
-- Name: qr_checkins qr_checkins_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.qr_checkins
    ADD CONSTRAINT qr_checkins_pkey PRIMARY KEY (id);


--
-- Name: reminders reminders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reminders
    ADD CONSTRAINT reminders_pkey PRIMARY KEY (id);


--
-- Name: seating_assignments seating_assignments_event_id_guest_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.seating_assignments
    ADD CONSTRAINT seating_assignments_event_id_guest_id_key UNIQUE (event_id, guest_id);


--
-- Name: seating_assignments seating_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.seating_assignments
    ADD CONSTRAINT seating_assignments_pkey PRIMARY KEY (id);


--
-- Name: seating_tables seating_tables_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.seating_tables
    ADD CONSTRAINT seating_tables_pkey PRIMARY KEY (id);


--
-- Name: subscription_plans subscription_plans_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscription_plans
    ADD CONSTRAINT subscription_plans_code_key UNIQUE (code);


--
-- Name: subscription_plans subscription_plans_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscription_plans
    ADD CONSTRAINT subscription_plans_pkey PRIMARY KEY (id);


--
-- Name: ticket_order_items ticket_order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ticket_order_items
    ADD CONSTRAINT ticket_order_items_pkey PRIMARY KEY (id);


--
-- Name: ticket_orders ticket_orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ticket_orders
    ADD CONSTRAINT ticket_orders_pkey PRIMARY KEY (id);


--
-- Name: ticket_scans ticket_scans_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ticket_scans
    ADD CONSTRAINT ticket_scans_pkey PRIMARY KEY (id);


--
-- Name: ticket_types ticket_types_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ticket_types
    ADD CONSTRAINT ticket_types_pkey PRIMARY KEY (id);


--
-- Name: seating_assignments unique_seat_per_location; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.seating_assignments
    ADD CONSTRAINT unique_seat_per_location UNIQUE (seating_table_id, seat_number);


--
-- Name: seating_assignments unique_seat_per_table; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.seating_assignments
    ADD CONSTRAINT unique_seat_per_table UNIQUE (seating_table_id, seat_number);


--
-- Name: seating_tables unique_table_name_per_event; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.seating_tables
    ADD CONSTRAINT unique_table_name_per_event UNIQUE (event_id, table_name);


--
-- Name: password_reset_tokens unique_token_hash; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT unique_token_hash UNIQUE (token_hash);


--
-- Name: uploads uploads_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.uploads
    ADD CONSTRAINT uploads_pkey PRIMARY KEY (id);


--
-- Name: user_notifications user_notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_notifications
    ADD CONSTRAINT user_notifications_pkey PRIMARY KEY (id);


--
-- Name: user_oauth_accounts user_oauth_accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_oauth_accounts
    ADD CONSTRAINT user_oauth_accounts_pkey PRIMARY KEY (id);


--
-- Name: user_oauth_accounts user_oauth_accounts_provider_provider_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_oauth_accounts
    ADD CONSTRAINT user_oauth_accounts_provider_provider_user_id_key UNIQUE (provider, provider_user_id);


--
-- Name: user_terms_acceptance user_terms_acceptance_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_terms_acceptance
    ADD CONSTRAINT user_terms_acceptance_pkey PRIMARY KEY (user_id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_stripe_customer_id_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_stripe_customer_id_unique UNIQUE (stripe_customer_id);


--
-- Name: vendor_bookings vendor_bookings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vendor_bookings
    ADD CONSTRAINT vendor_bookings_pkey PRIMARY KEY (id);


--
-- Name: vendor_categories vendor_categories_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vendor_categories
    ADD CONSTRAINT vendor_categories_name_key UNIQUE (name);


--
-- Name: vendor_categories vendor_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vendor_categories
    ADD CONSTRAINT vendor_categories_pkey PRIMARY KEY (id);


--
-- Name: vendor_categories vendor_categories_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vendor_categories
    ADD CONSTRAINT vendor_categories_slug_key UNIQUE (slug);


--
-- Name: vendor_inquiries vendor_inquiries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vendor_inquiries
    ADD CONSTRAINT vendor_inquiries_pkey PRIMARY KEY (id);


--
-- Name: vendor_reviews vendor_reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vendor_reviews
    ADD CONSTRAINT vendor_reviews_pkey PRIMARY KEY (id);


--
-- Name: vendor_services vendor_services_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vendor_services
    ADD CONSTRAINT vendor_services_pkey PRIMARY KEY (id);


--
-- Name: vendors vendors_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vendors
    ADD CONSTRAINT vendors_pkey PRIMARY KEY (id);


--
-- Name: vendors vendors_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vendors
    ADD CONSTRAINT vendors_slug_key UNIQUE (slug);


--
-- Name: webhook_events webhook_events_external_event_id_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.webhook_events
    ADD CONSTRAINT webhook_events_external_event_id_unique UNIQUE (external_event_id);


--
-- Name: webhook_events webhook_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.webhook_events
    ADD CONSTRAINT webhook_events_pkey PRIMARY KEY (id);


--
-- Name: ai_chatbot_sessions_event_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ai_chatbot_sessions_event_id_idx ON public.ai_chatbot_sessions USING btree (event_id);


--
-- Name: ai_chatbot_sessions_session_token_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ai_chatbot_sessions_session_token_idx ON public.ai_chatbot_sessions USING btree (session_token);


--
-- Name: ai_generation_logs_event_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ai_generation_logs_event_id_idx ON public.ai_generation_logs USING btree (event_id);


--
-- Name: ai_generation_logs_feature_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ai_generation_logs_feature_idx ON public.ai_generation_logs USING btree (feature);


--
-- Name: ai_generation_logs_organization_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ai_generation_logs_organization_id_idx ON public.ai_generation_logs USING btree (organization_id);


--
-- Name: ai_generation_logs_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ai_generation_logs_user_id_idx ON public.ai_generation_logs USING btree (user_id);


--
-- Name: audit_logs_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX audit_logs_created_at_idx ON public.audit_logs USING btree (created_at DESC);


--
-- Name: event_planner_projects_event_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX event_planner_projects_event_id_idx ON public.planner_projects USING btree (event_id);


--
-- Name: event_planner_projects_organization_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX event_planner_projects_organization_id_idx ON public.planner_projects USING btree (organization_id);


--
-- Name: idx_activities_actor_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_activities_actor_id ON public.activities USING btree (actor_user_id);


--
-- Name: idx_activities_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_activities_created_at ON public.activities USING btree (created_at);


--
-- Name: idx_activities_event_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_activities_event_id ON public.activities USING btree (event_id);


--
-- Name: idx_activities_org_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_activities_org_id ON public.activities USING btree (organization_id);


--
-- Name: idx_api_keys_org_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_api_keys_org_id ON public.api_keys USING btree (organization_id);


--
-- Name: idx_audit_logs_action; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_logs_action ON public.audit_logs USING btree (action);


--
-- Name: idx_audit_logs_actor; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_logs_actor ON public.audit_logs USING btree (actor_user_id);


--
-- Name: idx_audit_logs_actor_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_logs_actor_user_id ON public.audit_logs USING btree (actor_user_id);


--
-- Name: idx_audit_logs_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_logs_created_at ON public.audit_logs USING btree (created_at);


--
-- Name: idx_audit_logs_entity_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_logs_entity_type ON public.audit_logs USING btree (entity_type);


--
-- Name: idx_audit_logs_org_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_logs_org_id ON public.audit_logs USING btree (organization_id);


--
-- Name: idx_audit_logs_resource_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_logs_resource_id ON public.audit_logs USING btree (resource_id);


--
-- Name: idx_auth_sessions_expires_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_auth_sessions_expires_at ON public.auth_sessions USING btree (expires_at);


--
-- Name: idx_auth_sessions_last_used; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_auth_sessions_last_used ON public.auth_sessions USING btree (last_used_at);


--
-- Name: idx_auth_sessions_revoked_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_auth_sessions_revoked_at ON public.auth_sessions USING btree (revoked_at);


--
-- Name: idx_auth_sessions_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_auth_sessions_user_id ON public.auth_sessions USING btree (user_id);


--
-- Name: idx_billing_invoices_org_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_billing_invoices_org_id ON public.billing_invoices USING btree (organization_id);


--
-- Name: idx_checkin_devices_event_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_checkin_devices_event_id ON public.checkin_devices USING btree (event_id);


--
-- Name: idx_conv_event; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_conv_event ON public.conversations USING btree (event_id) WHERE (event_id IS NOT NULL);


--
-- Name: idx_discount_codes_code; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_discount_codes_code ON public.discount_codes USING btree (code);


--
-- Name: idx_discount_codes_event_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_discount_codes_event_id ON public.discount_codes USING btree (event_id);


--
-- Name: idx_email_verification_tokens_expires_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_email_verification_tokens_expires_at ON public.email_verification_tokens USING btree (expires_at);


--
-- Name: idx_email_verification_tokens_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_email_verification_tokens_user_id ON public.email_verification_tokens USING btree (user_id);


--
-- Name: idx_event_donations_event_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_event_donations_event_id ON public.event_donations USING btree (event_id);


--
-- Name: idx_event_donations_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_event_donations_status ON public.event_donations USING btree (payment_status);


--
-- Name: idx_event_media_event_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_event_media_event_id ON public.event_media USING btree (event_id);


--
-- Name: idx_event_members_event_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_event_members_event_id ON public.event_members USING btree (event_id);


--
-- Name: idx_event_members_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_event_members_user_id ON public.event_members USING btree (user_id);


--
-- Name: idx_event_page_sections_event_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_event_page_sections_event_id ON public.event_page_sections USING btree (event_id);


--
-- Name: idx_event_pages_preview_token; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_event_pages_preview_token ON public.event_pages USING btree (preview_token);


--
-- Name: idx_event_schedule_items_event_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_event_schedule_items_event_id ON public.event_schedule_items USING btree (event_id);


--
-- Name: idx_event_speakers_event_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_event_speakers_event_id ON public.event_speakers USING btree (event_id);


--
-- Name: idx_event_volunteers_event_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_event_volunteers_event_id ON public.event_volunteers USING btree (event_id);


--
-- Name: idx_events_created_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_events_created_by ON public.events USING btree (created_by);


--
-- Name: idx_events_deleted_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_events_deleted_at ON public.events USING btree (deleted_at);


--
-- Name: idx_events_org_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_events_org_id ON public.events USING btree (organization_id);


--
-- Name: idx_events_starts_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_events_starts_at ON public.events USING btree (starts_at);


--
-- Name: idx_events_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_events_status ON public.events USING btree (status);


--
-- Name: idx_events_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_events_type ON public.events USING btree (event_type);


--
-- Name: idx_gift_registry_items_event_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_gift_registry_items_event_id ON public.gift_registry_items USING btree (event_id);


--
-- Name: idx_guest_attendance_event_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_guest_attendance_event_id ON public.guest_attendance USING btree (event_id);


--
-- Name: idx_guest_attendance_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_guest_attendance_status ON public.guest_attendance USING btree (attendance_status);


--
-- Name: idx_guest_groups_event_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_guest_groups_event_id ON public.guest_groups USING btree (event_id);


--
-- Name: idx_guest_invitations_event_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_guest_invitations_event_id ON public.guest_invitations USING btree (event_id);


--
-- Name: idx_guest_invitations_guest_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_guest_invitations_guest_id ON public.guest_invitations USING btree (guest_id);


--
-- Name: idx_guest_invitations_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_guest_invitations_status ON public.guest_invitations USING btree (invitation_status);


--
-- Name: idx_guest_qr_passes_event_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_guest_qr_passes_event_id ON public.guest_qr_passes USING btree (event_id);


--
-- Name: idx_guest_qr_passes_guest_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_guest_qr_passes_guest_id ON public.guest_qr_passes USING btree (guest_id);


--
-- Name: idx_guest_rsvps_event_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_guest_rsvps_event_id ON public.guest_rsvps USING btree (event_id);


--
-- Name: idx_guest_rsvps_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_guest_rsvps_status ON public.guest_rsvps USING btree (rsvp_status);


--
-- Name: idx_guests_deleted_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_guests_deleted_at ON public.guests USING btree (deleted_at);


--
-- Name: idx_guests_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_guests_email ON public.guests USING btree (email);


--
-- Name: idx_guests_event_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_guests_event_id ON public.guests USING btree (event_id);


--
-- Name: idx_guests_group_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_guests_group_id ON public.guests USING btree (group_id);


--
-- Name: idx_issued_tickets_event_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_issued_tickets_event_id ON public.issued_tickets USING btree (event_id);


--
-- Name: idx_memorial_messages_event_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_memorial_messages_event_id ON public.memorial_messages USING btree (event_id);


--
-- Name: idx_msg_conv_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_msg_conv_created ON public.messages USING btree (conversation_id, created_at DESC);


--
-- Name: idx_org_members_org_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_org_members_org_id ON public.organization_members USING btree (organization_id);


--
-- Name: idx_org_members_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_org_members_user_id ON public.organization_members USING btree (user_id);


--
-- Name: idx_org_subscriptions_org_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_org_subscriptions_org_id ON public.organization_subscriptions USING btree (organization_id);


--
-- Name: idx_org_subscriptions_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_org_subscriptions_status ON public.organization_subscriptions USING btree (status);


--
-- Name: idx_organizers_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_organizers_active ON public.organizers USING btree (is_active);


--
-- Name: idx_organizers_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_organizers_email ON public.organizers USING btree (email);


--
-- Name: idx_outbound_messages_event_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_outbound_messages_event_id ON public.outbound_messages USING btree (event_id);


--
-- Name: idx_outbound_messages_guest_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_outbound_messages_guest_id ON public.outbound_messages USING btree (guest_id);


--
-- Name: idx_outbound_messages_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_outbound_messages_status ON public.outbound_messages USING btree (status);


--
-- Name: idx_part_conv; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_part_conv ON public.conversation_participants USING btree (conversation_id);


--
-- Name: idx_part_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_part_user ON public.conversation_participants USING btree (user_id) WHERE (deleted_at IS NULL);


--
-- Name: idx_password_reset_token_lookup; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_password_reset_token_lookup ON public.password_reset_tokens USING btree (token_hash) WHERE (used = false);


--
-- Name: idx_password_reset_tokens_expires_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_password_reset_tokens_expires_at ON public.password_reset_tokens USING btree (expires_at);


--
-- Name: idx_password_reset_tokens_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_password_reset_tokens_user_id ON public.password_reset_tokens USING btree (user_id);


--
-- Name: idx_payments_event_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payments_event_id ON public.payments USING btree (event_id);


--
-- Name: idx_payments_order_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payments_order_id ON public.payments USING btree (order_id);


--
-- Name: idx_payments_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payments_status ON public.payments USING btree (payment_status);


--
-- Name: idx_planner_activity_project; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_planner_activity_project ON public.planner_activity_log USING btree (project_id, created_at DESC);


--
-- Name: idx_planner_budget_project; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_planner_budget_project ON public.planner_budget_items USING btree (project_id, category);


--
-- Name: idx_planner_files_project; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_planner_files_project ON public.planner_files USING btree (project_id, folder);


--
-- Name: idx_planner_notes_project; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_planner_notes_project ON public.planner_notes USING btree (project_id);


--
-- Name: idx_planner_projects_event; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_planner_projects_event ON public.planner_projects USING btree (event_id);


--
-- Name: idx_planner_projects_org; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_planner_projects_org ON public.planner_projects USING btree (organization_id);


--
-- Name: idx_planner_tasks_parent; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_planner_tasks_parent ON public.planner_tasks USING btree (parent_task_id);


--
-- Name: idx_planner_tasks_project; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_planner_tasks_project ON public.planner_tasks USING btree (project_id, status);


--
-- Name: idx_planner_team_project; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_planner_team_project ON public.planner_team_members USING btree (project_id);


--
-- Name: idx_planner_timeline_project; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_planner_timeline_project ON public.planner_timeline_items USING btree (project_id);


--
-- Name: idx_planner_vendors_project; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_planner_vendors_project ON public.planner_vendors USING btree (project_id, booking_status);


--
-- Name: idx_qr_checkins_event_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_qr_checkins_event_id ON public.qr_checkins USING btree (event_id);


--
-- Name: idx_qr_checkins_guest_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_qr_checkins_guest_id ON public.qr_checkins USING btree (guest_id);


--
-- Name: idx_reminders_event_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reminders_event_id ON public.reminders USING btree (event_id);


--
-- Name: idx_reminders_send_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reminders_send_at ON public.reminders USING btree (send_at);


--
-- Name: idx_saved_vendors_org; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_saved_vendors_org ON public.organizer_saved_vendors USING btree (organizer_id);


--
-- Name: idx_seating_assignments_event_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_seating_assignments_event_id ON public.seating_assignments USING btree (event_id);


--
-- Name: idx_seating_assignments_table_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_seating_assignments_table_id ON public.seating_assignments USING btree (seating_table_id);


--
-- Name: idx_seating_tables_event_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_seating_tables_event_id ON public.seating_tables USING btree (event_id);


--
-- Name: idx_ticket_order_items_order_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ticket_order_items_order_id ON public.ticket_order_items USING btree (order_id);


--
-- Name: idx_ticket_orders_event_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ticket_orders_event_id ON public.ticket_orders USING btree (event_id);


--
-- Name: idx_ticket_orders_payment_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ticket_orders_payment_status ON public.ticket_orders USING btree (payment_status);


--
-- Name: idx_ticket_scans_event_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ticket_scans_event_id ON public.ticket_scans USING btree (event_id);


--
-- Name: idx_ticket_types_event_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ticket_types_event_id ON public.ticket_types USING btree (event_id);


--
-- Name: idx_uploads_event_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_uploads_event_id ON public.uploads USING btree (event_id);


--
-- Name: idx_uploads_org_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_uploads_org_id ON public.uploads USING btree (organization_id);


--
-- Name: idx_uploads_uploaded_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_uploads_uploaded_by ON public.uploads USING btree (uploaded_by);


--
-- Name: idx_user_notifications_read_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_notifications_read_at ON public.user_notifications USING btree (read_at);


--
-- Name: idx_user_notifications_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_notifications_user_id ON public.user_notifications USING btree (user_id);


--
-- Name: idx_users_deleted_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_deleted_at ON public.users USING btree (deleted_at);


--
-- Name: idx_users_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_status ON public.users USING btree (status);


--
-- Name: idx_vendor_bookings_event_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vendor_bookings_event_id ON public.vendor_bookings USING btree (event_id);


--
-- Name: idx_vendor_bookings_vendor_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vendor_bookings_vendor_id ON public.vendor_bookings USING btree (vendor_id);


--
-- Name: idx_vendor_inquiries_vendor; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vendor_inquiries_vendor ON public.vendor_inquiries USING btree (vendor_id, status);


--
-- Name: idx_vendor_reviews_vendor; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vendor_reviews_vendor ON public.vendor_reviews USING btree (vendor_id);


--
-- Name: idx_vendor_reviews_vendor_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vendor_reviews_vendor_id ON public.vendor_reviews USING btree (vendor_id);


--
-- Name: idx_vendor_services_vendor_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vendor_services_vendor_id ON public.vendor_services USING btree (vendor_id);


--
-- Name: idx_vendors_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vendors_active ON public.vendors USING btree (is_active);


--
-- Name: idx_vendors_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vendors_category ON public.vendors USING btree (category);


--
-- Name: idx_vendors_category_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vendors_category_id ON public.vendors USING btree (category_id);


--
-- Name: idx_vendors_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vendors_email ON public.vendors USING btree (email);


--
-- Name: idx_vendors_rating; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vendors_rating ON public.vendors USING btree (rating DESC);


--
-- Name: idx_vendors_slug; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vendors_slug ON public.vendors USING btree (slug);


--
-- Name: idx_vendors_slug_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_vendors_slug_unique ON public.vendors USING btree (slug);


--
-- Name: idx_vendors_slug_uq; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_vendors_slug_uq ON public.vendors USING btree (slug) WHERE (slug IS NOT NULL);


--
-- Name: idx_vendors_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vendors_status ON public.vendors USING btree (status);


--
-- Name: idx_webhook_events_processed; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_webhook_events_processed ON public.webhook_events USING btree (processed);


--
-- Name: notifications_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX notifications_created_at_idx ON public.notifications USING btree (created_at);


--
-- Name: notifications_unread_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX notifications_unread_idx ON public.notifications USING btree (user_id, read_at) WHERE (read_at IS NULL);


--
-- Name: notifications_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX notifications_user_id_idx ON public.notifications USING btree (user_id);


--
-- Name: planner_tasks_project_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX planner_tasks_project_id_idx ON public.planner_tasks USING btree (project_id);


--
-- Name: planner_tasks_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX planner_tasks_status_idx ON public.planner_tasks USING btree (status);


--
-- Name: planner_timeline_items_position_order_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX planner_timeline_items_position_order_idx ON public.planner_timeline_items USING btree (position_order);


--
-- Name: planner_timeline_items_project_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX planner_timeline_items_project_id_idx ON public.planner_timeline_items USING btree (project_id);


--
-- Name: planner_vendors_project_google_place_uniq; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX planner_vendors_project_google_place_uniq ON public.planner_vendors USING btree (project_id, google_place_id) WHERE (google_place_id IS NOT NULL);


--
-- Name: planner_vendors_project_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX planner_vendors_project_id_idx ON public.planner_vendors USING btree (project_id);


--
-- Name: users_stripe_customer_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX users_stripe_customer_id_idx ON public.users USING btree (stripe_customer_id);


--
-- Name: ux_webhook_events_provider_external; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ux_webhook_events_provider_external ON public.webhook_events USING btree (provider, external_event_id) WHERE (external_event_id IS NOT NULL);


--
-- Name: webhook_events_external_event_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX webhook_events_external_event_id_idx ON public.webhook_events USING btree (external_event_id);


--
-- Name: webhook_events_processed_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX webhook_events_processed_idx ON public.webhook_events USING btree (processed);


--
-- Name: issued_tickets trg_assign_ticket_number; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_assign_ticket_number BEFORE INSERT ON public.issued_tickets FOR EACH ROW EXECUTE FUNCTION public.assign_ticket_number();


--
-- Name: billing_invoices trg_billing_invoices_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_billing_invoices_updated_at BEFORE UPDATE ON public.billing_invoices FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: discount_codes trg_discount_codes_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_discount_codes_updated_at BEFORE UPDATE ON public.discount_codes FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: event_dashboard_widgets trg_event_dashboard_widgets_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_event_dashboard_widgets_updated_at BEFORE UPDATE ON public.event_dashboard_widgets FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: event_donations trg_event_donations_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_event_donations_updated_at BEFORE UPDATE ON public.event_donations FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: event_media trg_event_media_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_event_media_updated_at BEFORE UPDATE ON public.event_media FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: event_members trg_event_members_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_event_members_updated_at BEFORE UPDATE ON public.event_members FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: event_page_sections trg_event_page_sections_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_event_page_sections_updated_at BEFORE UPDATE ON public.event_page_sections FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: event_pages trg_event_pages_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_event_pages_updated_at BEFORE UPDATE ON public.event_pages FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: event_schedule_items trg_event_schedule_items_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_event_schedule_items_updated_at BEFORE UPDATE ON public.event_schedule_items FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: event_settings trg_event_settings_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_event_settings_updated_at BEFORE UPDATE ON public.event_settings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: event_speakers trg_event_speakers_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_event_speakers_updated_at BEFORE UPDATE ON public.event_speakers FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: event_volunteers trg_event_volunteers_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_event_volunteers_updated_at BEFORE UPDATE ON public.event_volunteers FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: events trg_events_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_events_updated_at BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: gift_registry_items trg_gift_registry_items_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_gift_registry_items_updated_at BEFORE UPDATE ON public.gift_registry_items FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: guest_attendance trg_guest_attendance_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_guest_attendance_updated_at BEFORE UPDATE ON public.guest_attendance FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: guest_groups trg_guest_groups_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_guest_groups_updated_at BEFORE UPDATE ON public.guest_groups FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: guest_invitations trg_guest_invitations_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_guest_invitations_updated_at BEFORE UPDATE ON public.guest_invitations FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: guest_qr_passes trg_guest_qr_passes_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_guest_qr_passes_updated_at BEFORE UPDATE ON public.guest_qr_passes FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: guest_rsvps trg_guest_rsvps_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_guest_rsvps_updated_at BEFORE UPDATE ON public.guest_rsvps FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: guests trg_guests_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_guests_updated_at BEFORE UPDATE ON public.guests FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: memorial_messages trg_memorial_messages_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_memorial_messages_updated_at BEFORE UPDATE ON public.memorial_messages FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: notification_templates trg_notification_templates_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_notification_templates_updated_at BEFORE UPDATE ON public.notification_templates FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: organization_subscriptions trg_organization_subscriptions_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_organization_subscriptions_updated_at BEFORE UPDATE ON public.organization_subscriptions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: organizations trg_organizations_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_organizations_updated_at BEFORE UPDATE ON public.organizations FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: outbound_messages trg_outbound_messages_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_outbound_messages_updated_at BEFORE UPDATE ON public.outbound_messages FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: payments trg_payments_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_payments_updated_at BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: reminders trg_reminders_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_reminders_updated_at BEFORE UPDATE ON public.reminders FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: seating_assignments trg_seating_assignments_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_seating_assignments_updated_at BEFORE UPDATE ON public.seating_assignments FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: seating_tables trg_seating_tables_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_seating_tables_updated_at BEFORE UPDATE ON public.seating_tables FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: subscription_plans trg_subscription_plans_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_subscription_plans_updated_at BEFORE UPDATE ON public.subscription_plans FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: ticket_orders trg_ticket_orders_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_ticket_orders_updated_at BEFORE UPDATE ON public.ticket_orders FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: ticket_types trg_ticket_types_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_ticket_types_updated_at BEFORE UPDATE ON public.ticket_types FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: users trg_users_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: vendor_bookings trg_vendor_bookings_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_vendor_bookings_updated_at BEFORE UPDATE ON public.vendor_bookings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: vendor_categories trg_vendor_categories_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_vendor_categories_updated_at BEFORE UPDATE ON public.vendor_categories FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: vendor_reviews trg_vendor_reviews_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_vendor_reviews_updated_at BEFORE UPDATE ON public.vendor_reviews FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: vendor_services trg_vendor_services_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_vendor_services_updated_at BEFORE UPDATE ON public.vendor_services FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: vendors trg_vendors_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_vendors_updated_at BEFORE UPDATE ON public.vendors FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: activities activities_actor_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activities
    ADD CONSTRAINT activities_actor_user_id_fkey FOREIGN KEY (actor_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: activities activities_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activities
    ADD CONSTRAINT activities_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;


--
-- Name: activities activities_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activities
    ADD CONSTRAINT activities_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: ai_chatbot_sessions ai_chatbot_sessions_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_chatbot_sessions
    ADD CONSTRAINT ai_chatbot_sessions_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;


--
-- Name: ai_generation_logs ai_generation_logs_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_generation_logs
    ADD CONSTRAINT ai_generation_logs_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE SET NULL;


--
-- Name: ai_generation_logs ai_generation_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_generation_logs
    ADD CONSTRAINT ai_generation_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: api_keys api_keys_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.api_keys
    ADD CONSTRAINT api_keys_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: audit_logs audit_logs_actor_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_actor_user_id_fkey FOREIGN KEY (actor_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: audit_logs audit_logs_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: auth_sessions auth_sessions_replaced_by_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.auth_sessions
    ADD CONSTRAINT auth_sessions_replaced_by_session_id_fkey FOREIGN KEY (replaced_by_session_id) REFERENCES public.auth_sessions(id) ON DELETE SET NULL;


--
-- Name: auth_sessions auth_sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.auth_sessions
    ADD CONSTRAINT auth_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: billing_invoices billing_invoices_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.billing_invoices
    ADD CONSTRAINT billing_invoices_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: billing_invoices billing_invoices_subscription_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.billing_invoices
    ADD CONSTRAINT billing_invoices_subscription_id_fkey FOREIGN KEY (subscription_id) REFERENCES public.organization_subscriptions(id) ON DELETE SET NULL;


--
-- Name: broadcast_notifications broadcast_notifications_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.broadcast_notifications
    ADD CONSTRAINT broadcast_notifications_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: checkin_devices checkin_devices_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.checkin_devices
    ADD CONSTRAINT checkin_devices_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;


--
-- Name: checkin_devices checkin_devices_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.checkin_devices
    ADD CONSTRAINT checkin_devices_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: conversation_participants conversation_participants_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversation_participants
    ADD CONSTRAINT conversation_participants_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE;


--
-- Name: discount_codes discount_codes_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.discount_codes
    ADD CONSTRAINT discount_codes_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;


--
-- Name: email_verification_tokens email_verification_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_verification_tokens
    ADD CONSTRAINT email_verification_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: event_activity_logs event_activity_logs_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_activity_logs
    ADD CONSTRAINT event_activity_logs_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id);


--
-- Name: event_activity_logs event_activity_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_activity_logs
    ADD CONSTRAINT event_activity_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: event_dashboard_widgets event_dashboard_widgets_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_dashboard_widgets
    ADD CONSTRAINT event_dashboard_widgets_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;


--
-- Name: event_donations event_donations_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_donations
    ADD CONSTRAINT event_donations_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;


--
-- Name: event_media event_media_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_media
    ADD CONSTRAINT event_media_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;


--
-- Name: event_media event_media_upload_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_media
    ADD CONSTRAINT event_media_upload_id_fkey FOREIGN KEY (upload_id) REFERENCES public.uploads(id) ON DELETE SET NULL;


--
-- Name: event_media event_media_uploaded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_media
    ADD CONSTRAINT event_media_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: event_members event_members_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_members
    ADD CONSTRAINT event_members_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;


--
-- Name: event_members event_members_invited_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_members
    ADD CONSTRAINT event_members_invited_by_fkey FOREIGN KEY (invited_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: event_members event_members_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_members
    ADD CONSTRAINT event_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: event_page_sections event_page_sections_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_page_sections
    ADD CONSTRAINT event_page_sections_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;


--
-- Name: event_pages event_pages_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_pages
    ADD CONSTRAINT event_pages_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;


--
-- Name: planner_projects event_planner_projects_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.planner_projects
    ADD CONSTRAINT event_planner_projects_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE SET NULL;


--
-- Name: event_schedule_items event_schedule_items_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_schedule_items
    ADD CONSTRAINT event_schedule_items_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;


--
-- Name: event_settings event_settings_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_settings
    ADD CONSTRAINT event_settings_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;


--
-- Name: event_speakers event_speakers_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_speakers
    ADD CONSTRAINT event_speakers_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;


--
-- Name: event_tag_map event_tag_map_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_tag_map
    ADD CONSTRAINT event_tag_map_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;


--
-- Name: event_tag_map event_tag_map_tag_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_tag_map
    ADD CONSTRAINT event_tag_map_tag_id_fkey FOREIGN KEY (tag_id) REFERENCES public.event_tags(id) ON DELETE CASCADE;


--
-- Name: event_tags event_tags_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_tags
    ADD CONSTRAINT event_tags_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: event_volunteers event_volunteers_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_volunteers
    ADD CONSTRAINT event_volunteers_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;


--
-- Name: events events_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE RESTRICT;


--
-- Name: events events_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: uploads fk_uploads_vendor; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.uploads
    ADD CONSTRAINT fk_uploads_vendor FOREIGN KEY (vendor_id) REFERENCES public.vendors(id) ON DELETE CASCADE;


--
-- Name: gift_registry_items gift_registry_items_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gift_registry_items
    ADD CONSTRAINT gift_registry_items_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;


--
-- Name: guest_attendance guest_attendance_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.guest_attendance
    ADD CONSTRAINT guest_attendance_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;


--
-- Name: guest_attendance guest_attendance_guest_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.guest_attendance
    ADD CONSTRAINT guest_attendance_guest_id_fkey FOREIGN KEY (guest_id) REFERENCES public.guests(id) ON DELETE CASCADE;


--
-- Name: guest_attendance guest_attendance_marked_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.guest_attendance
    ADD CONSTRAINT guest_attendance_marked_by_user_id_fkey FOREIGN KEY (marked_by_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: guest_groups guest_groups_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.guest_groups
    ADD CONSTRAINT guest_groups_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;


--
-- Name: guest_invitations guest_invitations_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.guest_invitations
    ADD CONSTRAINT guest_invitations_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;


--
-- Name: guest_invitations guest_invitations_guest_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.guest_invitations
    ADD CONSTRAINT guest_invitations_guest_id_fkey FOREIGN KEY (guest_id) REFERENCES public.guests(id) ON DELETE CASCADE;


--
-- Name: guest_qr_passes guest_qr_passes_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.guest_qr_passes
    ADD CONSTRAINT guest_qr_passes_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;


--
-- Name: guest_qr_passes guest_qr_passes_guest_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.guest_qr_passes
    ADD CONSTRAINT guest_qr_passes_guest_id_fkey FOREIGN KEY (guest_id) REFERENCES public.guests(id) ON DELETE CASCADE;


--
-- Name: guest_rsvps guest_rsvps_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.guest_rsvps
    ADD CONSTRAINT guest_rsvps_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;


--
-- Name: guest_rsvps guest_rsvps_guest_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.guest_rsvps
    ADD CONSTRAINT guest_rsvps_guest_id_fkey FOREIGN KEY (guest_id) REFERENCES public.guests(id) ON DELETE CASCADE;


--
-- Name: guests guests_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.guests
    ADD CONSTRAINT guests_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;


--
-- Name: guests guests_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.guests
    ADD CONSTRAINT guests_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.guest_groups(id) ON DELETE SET NULL;


--
-- Name: issued_tickets issued_tickets_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.issued_tickets
    ADD CONSTRAINT issued_tickets_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;


--
-- Name: issued_tickets issued_tickets_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.issued_tickets
    ADD CONSTRAINT issued_tickets_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.ticket_orders(id) ON DELETE CASCADE;


--
-- Name: issued_tickets issued_tickets_order_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.issued_tickets
    ADD CONSTRAINT issued_tickets_order_item_id_fkey FOREIGN KEY (order_item_id) REFERENCES public.ticket_order_items(id) ON DELETE SET NULL;


--
-- Name: issued_tickets issued_tickets_ticket_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.issued_tickets
    ADD CONSTRAINT issued_tickets_ticket_type_id_fkey FOREIGN KEY (ticket_type_id) REFERENCES public.ticket_types(id) ON DELETE RESTRICT;


--
-- Name: memorial_messages memorial_messages_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.memorial_messages
    ADD CONSTRAINT memorial_messages_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;


--
-- Name: messages messages_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE;


--
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: organization_members organization_members_invited_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organization_members
    ADD CONSTRAINT organization_members_invited_by_fkey FOREIGN KEY (invited_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: organization_members organization_members_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organization_members
    ADD CONSTRAINT organization_members_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: organization_members organization_members_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organization_members
    ADD CONSTRAINT organization_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: organization_subscriptions organization_subscriptions_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organization_subscriptions
    ADD CONSTRAINT organization_subscriptions_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: organization_subscriptions organization_subscriptions_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organization_subscriptions
    ADD CONSTRAINT organization_subscriptions_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.subscription_plans(id);


--
-- Name: organizations organizations_owner_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_owner_user_id_fkey FOREIGN KEY (owner_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: organizer_saved_vendors organizer_saved_vendors_organizer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organizer_saved_vendors
    ADD CONSTRAINT organizer_saved_vendors_organizer_id_fkey FOREIGN KEY (organizer_id) REFERENCES public.organizers(id) ON DELETE CASCADE;


--
-- Name: organizer_saved_vendors organizer_saved_vendors_vendor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organizer_saved_vendors
    ADD CONSTRAINT organizer_saved_vendors_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.vendors(id) ON DELETE CASCADE;


--
-- Name: outbound_messages outbound_messages_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.outbound_messages
    ADD CONSTRAINT outbound_messages_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;


--
-- Name: outbound_messages outbound_messages_guest_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.outbound_messages
    ADD CONSTRAINT outbound_messages_guest_id_fkey FOREIGN KEY (guest_id) REFERENCES public.guests(id) ON DELETE SET NULL;


--
-- Name: outbound_messages outbound_messages_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.outbound_messages
    ADD CONSTRAINT outbound_messages_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: outbound_messages outbound_messages_template_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.outbound_messages
    ADD CONSTRAINT outbound_messages_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.notification_templates(id) ON DELETE SET NULL;


--
-- Name: password_reset_tokens password_reset_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: payments payments_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;


--
-- Name: payments payments_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.ticket_orders(id) ON DELETE SET NULL;


--
-- Name: payments payments_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: payments payments_payer_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_payer_user_id_fkey FOREIGN KEY (payer_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: planner_activity_log planner_activity_log_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.planner_activity_log
    ADD CONSTRAINT planner_activity_log_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.planner_projects(id) ON DELETE CASCADE;


--
-- Name: planner_activity_log planner_activity_log_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.planner_activity_log
    ADD CONSTRAINT planner_activity_log_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: planner_budget_items planner_budget_items_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.planner_budget_items
    ADD CONSTRAINT planner_budget_items_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.planner_projects(id) ON DELETE CASCADE;


--
-- Name: planner_files planner_files_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.planner_files
    ADD CONSTRAINT planner_files_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.planner_projects(id) ON DELETE CASCADE;


--
-- Name: planner_files planner_files_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.planner_files
    ADD CONSTRAINT planner_files_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: planner_notes planner_notes_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.planner_notes
    ADD CONSTRAINT planner_notes_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.planner_projects(id) ON DELETE CASCADE;


--
-- Name: planner_notes planner_notes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.planner_notes
    ADD CONSTRAINT planner_notes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: planner_projects planner_projects_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.planner_projects
    ADD CONSTRAINT planner_projects_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: planner_tasks planner_tasks_parent_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.planner_tasks
    ADD CONSTRAINT planner_tasks_parent_task_id_fkey FOREIGN KEY (parent_task_id) REFERENCES public.planner_tasks(id) ON DELETE CASCADE;


--
-- Name: planner_tasks planner_tasks_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.planner_tasks
    ADD CONSTRAINT planner_tasks_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.planner_projects(id) ON DELETE CASCADE;


--
-- Name: planner_team_members planner_team_members_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.planner_team_members
    ADD CONSTRAINT planner_team_members_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.planner_projects(id) ON DELETE CASCADE;


--
-- Name: planner_team_members planner_team_members_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.planner_team_members
    ADD CONSTRAINT planner_team_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: planner_timeline_items planner_timeline_items_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.planner_timeline_items
    ADD CONSTRAINT planner_timeline_items_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.planner_projects(id) ON DELETE CASCADE;


--
-- Name: planner_vendors planner_vendors_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.planner_vendors
    ADD CONSTRAINT planner_vendors_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.planner_projects(id) ON DELETE CASCADE;


--
-- Name: push_tokens push_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.push_tokens
    ADD CONSTRAINT push_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: qr_checkins qr_checkins_checked_in_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.qr_checkins
    ADD CONSTRAINT qr_checkins_checked_in_by_fkey FOREIGN KEY (checked_in_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: qr_checkins qr_checkins_device_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.qr_checkins
    ADD CONSTRAINT qr_checkins_device_id_fkey FOREIGN KEY (device_id) REFERENCES public.checkin_devices(id) ON DELETE SET NULL;


--
-- Name: qr_checkins qr_checkins_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.qr_checkins
    ADD CONSTRAINT qr_checkins_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;


--
-- Name: qr_checkins qr_checkins_guest_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.qr_checkins
    ADD CONSTRAINT qr_checkins_guest_id_fkey FOREIGN KEY (guest_id) REFERENCES public.guests(id) ON DELETE CASCADE;


--
-- Name: qr_checkins qr_checkins_qr_pass_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.qr_checkins
    ADD CONSTRAINT qr_checkins_qr_pass_id_fkey FOREIGN KEY (qr_pass_id) REFERENCES public.guest_qr_passes(id) ON DELETE CASCADE;


--
-- Name: reminders reminders_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reminders
    ADD CONSTRAINT reminders_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;


--
-- Name: seating_assignments seating_assignments_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.seating_assignments
    ADD CONSTRAINT seating_assignments_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;


--
-- Name: seating_assignments seating_assignments_guest_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.seating_assignments
    ADD CONSTRAINT seating_assignments_guest_id_fkey FOREIGN KEY (guest_id) REFERENCES public.guests(id) ON DELETE CASCADE;


--
-- Name: seating_assignments seating_assignments_seating_table_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.seating_assignments
    ADD CONSTRAINT seating_assignments_seating_table_id_fkey FOREIGN KEY (seating_table_id) REFERENCES public.seating_tables(id) ON DELETE CASCADE;


--
-- Name: seating_tables seating_tables_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.seating_tables
    ADD CONSTRAINT seating_tables_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;


--
-- Name: ticket_order_items ticket_order_items_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ticket_order_items
    ADD CONSTRAINT ticket_order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.ticket_orders(id) ON DELETE CASCADE;


--
-- Name: ticket_order_items ticket_order_items_ticket_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ticket_order_items
    ADD CONSTRAINT ticket_order_items_ticket_type_id_fkey FOREIGN KEY (ticket_type_id) REFERENCES public.ticket_types(id) ON DELETE RESTRICT;


--
-- Name: ticket_orders ticket_orders_buyer_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ticket_orders
    ADD CONSTRAINT ticket_orders_buyer_user_id_fkey FOREIGN KEY (buyer_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: ticket_orders ticket_orders_discount_code_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ticket_orders
    ADD CONSTRAINT ticket_orders_discount_code_id_fkey FOREIGN KEY (discount_code_id) REFERENCES public.discount_codes(id) ON DELETE SET NULL;


--
-- Name: ticket_orders ticket_orders_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ticket_orders
    ADD CONSTRAINT ticket_orders_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;


--
-- Name: ticket_scans ticket_scans_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ticket_scans
    ADD CONSTRAINT ticket_scans_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;


--
-- Name: ticket_scans ticket_scans_issued_ticket_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ticket_scans
    ADD CONSTRAINT ticket_scans_issued_ticket_id_fkey FOREIGN KEY (issued_ticket_id) REFERENCES public.issued_tickets(id) ON DELETE CASCADE;


--
-- Name: ticket_scans ticket_scans_scanned_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ticket_scans
    ADD CONSTRAINT ticket_scans_scanned_by_fkey FOREIGN KEY (scanned_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: ticket_types ticket_types_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ticket_types
    ADD CONSTRAINT ticket_types_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;


--
-- Name: uploads uploads_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.uploads
    ADD CONSTRAINT uploads_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;


--
-- Name: uploads uploads_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.uploads
    ADD CONSTRAINT uploads_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: uploads uploads_uploaded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.uploads
    ADD CONSTRAINT uploads_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: user_notifications user_notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_notifications
    ADD CONSTRAINT user_notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_oauth_accounts user_oauth_accounts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_oauth_accounts
    ADD CONSTRAINT user_oauth_accounts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: users users_default_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_default_organization_id_fkey FOREIGN KEY (default_organization_id) REFERENCES public.organizations(id) ON DELETE SET NULL;


--
-- Name: vendor_bookings vendor_bookings_booked_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vendor_bookings
    ADD CONSTRAINT vendor_bookings_booked_by_user_id_fkey FOREIGN KEY (booked_by_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: vendor_bookings vendor_bookings_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vendor_bookings
    ADD CONSTRAINT vendor_bookings_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;


--
-- Name: vendor_bookings vendor_bookings_service_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vendor_bookings
    ADD CONSTRAINT vendor_bookings_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.vendor_services(id) ON DELETE SET NULL;


--
-- Name: vendor_bookings vendor_bookings_vendor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vendor_bookings
    ADD CONSTRAINT vendor_bookings_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.vendors(id) ON DELETE CASCADE;


--
-- Name: vendor_inquiries vendor_inquiries_vendor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vendor_inquiries
    ADD CONSTRAINT vendor_inquiries_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.vendors(id) ON DELETE CASCADE;


--
-- Name: vendor_reviews vendor_reviews_booking_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vendor_reviews
    ADD CONSTRAINT vendor_reviews_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.vendor_bookings(id) ON DELETE SET NULL;


--
-- Name: vendor_reviews vendor_reviews_reviewer_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vendor_reviews
    ADD CONSTRAINT vendor_reviews_reviewer_user_id_fkey FOREIGN KEY (reviewer_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: vendor_reviews vendor_reviews_vendor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vendor_reviews
    ADD CONSTRAINT vendor_reviews_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.vendors(id) ON DELETE CASCADE;


--
-- Name: vendor_services vendor_services_vendor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vendor_services
    ADD CONSTRAINT vendor_services_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.vendors(id) ON DELETE CASCADE;


--
-- Name: vendors vendors_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vendors
    ADD CONSTRAINT vendors_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.vendor_categories(id) ON DELETE SET NULL;


--
-- Name: vendors vendors_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vendors
    ADD CONSTRAINT vendors_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE SET NULL;


--
-- Name: vendors vendors_owner_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vendors
    ADD CONSTRAINT vendors_owner_user_id_fkey FOREIGN KEY (owner_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--

\unrestrict NRZJlaNS0XCfyHkp27DxpvMqJmert6n9gAv7w2LeCK6II3ghtCSLudwp79kfSsp

