"use client";

import { usePathname } from "next/navigation";
import EventSubnav from "@/components/layout/event-subnav";

export default function SingleEventLayout({ children }) {
  const pathname = usePathname();
  if (pathname.includes("/builder")) return <>{children}</>;

  return (
    <div className="space-y-6">
      <EventSubnav />
      {children}
    </div>
  );
}
