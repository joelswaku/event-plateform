import React from 'react';
import type { BuilderSection } from '@/types';
import HeroConfigFields      from './fields/HeroConfigFields';
import GalleryConfigFields   from './fields/GalleryConfigFields';
import VenueConfigFields     from './fields/VenueConfigFields';
import CountdownConfigFields from './fields/CountdownConfigFields';
import FAQConfigFields       from './fields/FAQConfigFields';
import CoupleConfigFields    from './fields/CoupleConfigFields';
import StoryConfigFields     from './fields/StoryConfigFields';
import SpeakersConfigFields  from './fields/SpeakersConfigFields';
import ScheduleConfigFields  from './fields/ScheduleConfigFields';
import CTAConfigFields       from './fields/CTAConfigFields';
import GenericConfigFields   from './fields/GenericConfigFields';

interface Props {
  section: BuilderSection;
  eventId: string;
  iosKeyboardInsets?: boolean;
  onOverlayPreviewChange?: (opacity: number) => void;
  onOverlayPreviewCommit?: (opacity: number) => void;
}

export default function SectionConfigPanel({
  section,
  eventId,
  iosKeyboardInsets,
  onOverlayPreviewChange,
  onOverlayPreviewCommit,
}: Props) {
  const p = { section, eventId, iosKeyboardInsets };
  switch (section.section_type) {
    case 'HERO':      return <HeroConfigFields {...p} onOverlayPreviewChange={onOverlayPreviewChange} onOverlayPreviewCommit={onOverlayPreviewCommit} />;
    case 'GALLERY':   return <GalleryConfigFields   {...p} />;
    case 'VENUE':     return <VenueConfigFields     {...p} />;
    case 'COUNTDOWN': return <CountdownConfigFields {...p} />;
    case 'FAQ':       return <FAQConfigFields       {...p} />;
    case 'COUPLE':    return <CoupleConfigFields    {...p} />;
    case 'STORY':     return <StoryConfigFields     {...p} />;
    case 'SPEAKERS':  return <SpeakersConfigFields  {...p} />;
    case 'SCHEDULE':  return <ScheduleConfigFields  {...p} />;
    case 'CTA':       return <CTAConfigFields       {...p} />;
    default:          return <GenericConfigFields   {...p} />;
  }
}
