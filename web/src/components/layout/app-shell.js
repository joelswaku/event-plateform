"use client";

import { usePathname } from "next/navigation";
import DashboardSidebar from "./dashboard-sidebar";
import Topbar from "./topbar";
import BillingBanner from "@/components/ui/BillingBanner";
import MobileBottomNav from "./MobileBottomNav";

export default function AppShell({ children }) {
  const pathname = usePathname();
  const isBuilder = pathname.includes("/builder");
  // Planner project pages need full-viewport treatment (no max-width, fixed height)
  const isPlannerProject = /^\/planner\/.+/.test(pathname);
  const isFullscreen = isBuilder || isPlannerProject;

  return (
    // Root div: no overflow:hidden here — iOS Safari can fail to paint position:fixed
    // children (MobileBottomNav) when a parent has overflow:hidden.
    <div
      className="bg-(--bg-base) text-(--text-primary)"
      style={isFullscreen ? { height: "100svh", display: "flex", flexDirection: "column" } : { minHeight: "100vh" }}
    >
      {/* Inner flex row: overflow:hidden lives here, not on the root */}
      <div className={`flex ${isFullscreen ? "flex-1 min-h-0 overflow-hidden" : "min-h-screen"}`}>

        {!isBuilder && !isPlannerProject && <DashboardSidebar />}

        <div className={`flex flex-1 flex-col min-w-0 ${isFullscreen ? "overflow-hidden min-h-0" : "min-h-screen"}`}>
          {!isBuilder && !isPlannerProject && <div className="hidden sm:block shrink-0"><Topbar /></div>}
          {!isBuilder && !isPlannerProject && <div className="hidden sm:block shrink-0"><BillingBanner /></div>}

          <main
            className={`flex-1 flex flex-col min-h-0 ${
              isBuilder ? "p-0 overflow-hidden"
              : isPlannerProject ? "p-0 overflow-hidden"
              : "p-0 sm:p-4 md:p-6 overflow-auto"
            }`}
          >
            <div
              className={`flex-1 flex flex-col min-h-0 ${
                isFullscreen ? "overflow-hidden" : "mx-auto max-w-6xl w-full"
              }`}
            >
              {/* On mobile+tablet, leave room for the fixed bottom nav (pb-16 ≈ 64px nav height) */}
              <div className={`flex-1 flex flex-col min-h-0 ${isFullscreen ? "overflow-hidden" : "pb-20 md:pb-0"}`}>
                {children}
              </div>
            </div>
          </main>
        </div>

      </div>

      {!isBuilder && <MobileBottomNav />}
    </div>
  );
}
