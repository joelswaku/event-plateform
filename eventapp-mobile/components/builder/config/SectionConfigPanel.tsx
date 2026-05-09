import React from 'react';
import type { BuilderSection } from '@/types';
import HeroConfigFields      from './fields/HeroConfigFields';
import GalleryConfigFields   from './fields/GalleryConfigFields';
import VenueConfigFields     from './fields/VenueConfigFields';
import CountdownConfigFields from './fields/CountdownConfigFields';
import FAQConfigFields       from './fields/FAQConfigFields';
import CoupleConfigFields    from './fields/CoupleConfigFields';
import StoryConfigFields     from './fields/StoryConfigFields';
import GenericConfigFields   from './fields/GenericConfigFields';

interface Props {
  section: BuilderSection;
  eventId: string;
  iosKeyboardInsets?: boolean;
}

export default function SectionConfigPanel({ section, eventId, iosKeyboardInsets }: Props) {
  const p = { section, eventId, iosKeyboardInsets };
  switch (section.section_type) {
    case 'HERO':      return <HeroConfigFields      {...p} />;
    case 'GALLERY':   return <GalleryConfigFields   {...p} />;
    case 'VENUE':     return <VenueConfigFields     {...p} />;
    case 'COUNTDOWN': return <CountdownConfigFields {...p} />;
    case 'FAQ':       return <FAQConfigFields       {...p} />;
    case 'COUPLE':    return <CoupleConfigFields    {...p} />;
    case 'STORY':     return <StoryConfigFields     {...p} />;
    default:          return <GenericConfigFields   {...p} />;
  }
}
