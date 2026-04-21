"use client";

import { usePathname } from "next/navigation";
import DashboardSidebar from "./dashboard-sidebar";
import Topbar from "./topbar";

export default function AppShell({ children }) {
  const pathname = usePathname();
  const isBuilder = pathname.includes("/builder");

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      <div className="flex min-h-screen">

        {!isBuilder && <DashboardSidebar />}

        <div className="flex min-h-screen flex-1 flex-col overflow-hidden">
          {!isBuilder && <Topbar />}

          <main className={`flex-1 ${isBuilder ? "p-0" : "p-4 md:p-6"}`}>
            <div className={isBuilder ? "h-full w-full" : "mx-auto max-w-6xl"}>
              {children}
            </div>
          </main>
        </div>

      </div>
    </div>
  );
}
