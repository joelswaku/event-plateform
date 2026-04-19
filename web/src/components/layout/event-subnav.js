"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Ticket,
  BarChart3,
  WandSparkles,
  Armchair,
  Settings,
} from "lucide-react";

export default function EventSubnav() {
  const { eventId } = useParams();
  const pathname = usePathname();

  const items = [
    {
      label: "Overview",
      href: `/events/${eventId}`,
      icon: LayoutDashboard,
      exact: true,
    },
    {
      label: "Guests",
      href: `/events/${eventId}/guests`,
      icon: Users,
    },
    {
      label: "Tickets",
      href: `/events/${eventId}/tickets`,
      icon: Ticket,
    },
    {
      label: "Analytics",
      href: `/events/${eventId}/analytics`,
      icon: BarChart3,
    },
    {
      label: "Builder",
      href: `/events/${eventId}/builder`,
      icon: WandSparkles,
    },
    {
      label: "Seating",
      href: `/events/${eventId}/seating`,
      icon: Armchair,
    },
    {
      label: "Settings",
      href: `/events/${eventId}/settings`,
      icon: Settings,
    },
  ];

  return (
    <div className="overflow-x-auto rounded-3xl border border-[#e5e7eb] bg-white p-2">
      <div className="flex min-w-max items-center gap-2">
        {items.map((item) => {
          const Icon = item.icon;
          const active = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium transition ${
                active
                  ? "bg-[#111827] text-white"
                  : "text-gray-600 hover:bg-gray-50 hover:text-black"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}