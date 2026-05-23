"use client";

import { usePathname } from "next/navigation";
import DashboardSidebar from "./dashboard-sidebar";
import Topbar from "./topbar";
import BillingBanner from "@/components/ui/BillingBanner";

export default function AppShell({ children }) {
  const pathname = usePathname();
  const isBuilder = pathname.includes("/builder");

  return (
    <div className="min-h-screen bg-(--bg-base) text-(--text-primary)">
      <div className="flex min-h-screen">

        {!isBuilder && <DashboardSidebar />}

        <div className="flex min-h-screen flex-1 flex-col overflow-hidden">
          {/* Topbar hidden on mobile — mobile pages render their own overlay navigation */}
          {!isBuilder && <div className="hidden sm:block"><Topbar /></div>}
          {!isBuilder && <div className="hidden sm:block"><BillingBanner /></div>}

          <main className={`flex-1 ${isBuilder ? "p-0" : "p-0 sm:p-4 md:p-6"}`}>
            <div className={isBuilder ? "h-full w-full" : "mx-auto max-w-6xl"}>
              {children}
            </div>
          </main>
        </div>

      </div>
    </div>
  );
}
