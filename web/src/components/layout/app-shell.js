"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import DashboardSidebar from "./dashboard-sidebar";
import Topbar from "./topbar";

export default function AppShell({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const pathname = usePathname();

  // ✅ detect builder page
  const isBuilder = pathname.includes("/builder");

  return (
    <div className="min-h-screen bg-[#f6f7fb] text-[#111827]">
      <div className="flex min-h-screen">

        {/* ❌ HIDE SIDEBAR IN BUILDER */}
        {!isBuilder && (
          <DashboardSidebar
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
          />
        )}

        {/* MAIN */}
        <div className="flex min-h-screen flex-1 flex-col">

          {/* ❌ HIDE TOPBAR TOO (optional) */}
          {!isBuilder && (
            <Topbar
              sidebarOpen={sidebarOpen}
              setSidebarOpen={setSidebarOpen}
            />
          )}

          {/* ✅ FULL WIDTH BUILDER */}
          <main
            className={`flex-1 ${
              isBuilder ? "p-0" : "p-4 md:p-6"
            }`}
          >
            <div
              className={`${
                isBuilder ? "w-full h-full" : "mx-auto max-w-7xl"
              }`}
            >
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}



// "use client";

// import { useState } from "react";
// import DashboardSidebar from "./dashboard-sidebar";
// import Topbar from "./topbar";

// export default function AppShell({ children }) {
//   const [sidebarOpen, setSidebarOpen] = useState(true);

//   return (
//     <div className="min-h-screen bg-[#f6f7fb] text-[#111827]">
//       <div className="flex min-h-screen">
//         <DashboardSidebar
//           sidebarOpen={sidebarOpen}
//           setSidebarOpen={setSidebarOpen}
//         />

//         <div className="flex min-h-screen flex-1 flex-col">
//           <Topbar
//             sidebarOpen={sidebarOpen}
//             setSidebarOpen={setSidebarOpen}
//           />

//           <main className="flex-1 p-4 md:p-6">
//             <div className="mx-auto max-w-7xl">{children}</div>
//           </main>
//         </div>
//       </div>
//     </div>
//   );
// }
