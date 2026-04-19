import EventSubnav from "@/components/layout/event-subnav";

export default function SingleEventLayout({ children }) {
  return (
    <div className="space-y-6">
      <EventSubnav />
      {children}
    </div>
  );
}