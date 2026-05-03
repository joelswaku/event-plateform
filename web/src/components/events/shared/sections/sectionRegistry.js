/**
 * web/src/components/events/shared/sections/sectionRegistry.js
 *
 * Single source of truth for section type → component mapping.
 * Used by BOTH the builder preview and the public event page.
 *
 * CHANGE vs original:
 *  - Removed TicketsSection from SharedSections import
 *  - Added PremiumTicketsSection import
 *  - TICKETS registry entry now points to PremiumTicketsSection
 */

import HeroSection from "./HeroSection";

import {
  AboutSection,
  StorySection,
  CoupleSection,
  CountdownSection,
  VenueSection,
  RegistrySection,
  GallerySection,
  ScheduleSection,
  SpeakersSection,
  DonationsSection,
  FAQSection,
  CTASection,
} from "./SharedSections";

import PremiumTicketsSection from "./PremiumTicketsSection"; // ← NEW

export const SECTION_REGISTRY = {
  HERO:      HeroSection,
  ABOUT:     AboutSection,
  STORY:     StorySection,
  COUPLE:    CoupleSection,
  COUNTDOWN: CountdownSection,
  VENUE:     VenueSection,
  REGISTRY:  RegistrySection,
  GALLERY:   GallerySection,
  SCHEDULE:  ScheduleSection,
  SPEAKERS:  SpeakersSection,
  TICKETS:   PremiumTicketsSection, // ← CHANGED
  DONATIONS: DonationsSection,
  FAQ:       FAQSection,
  CTA:       CTASection,
};

export default SECTION_REGISTRY;
