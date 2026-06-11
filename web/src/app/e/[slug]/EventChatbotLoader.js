"use client";

import dynamic from "next/dynamic";

const EventChatbot = dynamic(() => import("@/components/ai/EventChatbot"), { ssr: false });

export default function EventChatbotLoader({ eventId }) {
  return <EventChatbot eventId={eventId} />;
}
