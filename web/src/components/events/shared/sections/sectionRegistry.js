



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
  TicketsSection,
  DonationsSection,
  FAQSection,
  CTASection,
}  from "./SharedSections";


/**
 * Single source of truth for section type → component mapping.
 * Used by BOTH the builder preview and the public event page.
 */
export const SECTION_REGISTRY = {
  HERO: HeroSection,
  ABOUT: AboutSection,
  STORY: StorySection,
  COUPLE: CoupleSection,
  COUNTDOWN: CountdownSection,
  VENUE: VenueSection,
  REGISTRY: RegistrySection,
  GALLERY: GallerySection,
  SCHEDULE: ScheduleSection,
  SPEAKERS: SpeakersSection,
  TICKETS: TicketsSection,
  DONATIONS: DonationsSection,
  FAQ: FAQSection,
  CTA: CTASection,
};

export default SECTION_REGISTRY;
