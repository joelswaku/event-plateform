"use client";

import { useState } from "react";
import { PanelLeft, PanelRight } from "lucide-react";

export default function BuilderLayout({
  children,
  sidebar,
  rightPanel,
}) {
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">

      {/* ================= LEFT SIDEBAR ================= */}
      <div
        className={`relative border-r bg-white transition-all duration-300
        ${leftOpen ? "w-[300px]" : "w-0"} overflow-hidden`}
      >
        {/* CONTENT */}
        {leftOpen && (
          <div className="h-full p-4 overflow-y-auto">
            {sidebar}
          </div>
        )}

        {/* CLOSE BUTTON */}
        {leftOpen && (
          <button
            onClick={() => setLeftOpen(false)}
            className="absolute top-4 right-[-16px] z-10 bg-white border rounded-full p-1 shadow"
          >
            <PanelLeft className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* ================= MAIN ================= */}
      <div className="flex-1 relative flex flex-col">

        {/* OPEN LEFT BUTTON */}
        {!leftOpen && (
          <button
            onClick={() => setLeftOpen(true)}
            className="absolute top-4 left-4 z-20 bg-white border rounded-full p-2 shadow"
          >
            <PanelLeft className="w-4 h-4" />
          </button>
        )}

        {/* OPEN RIGHT BUTTON */}
        {!rightOpen && rightPanel && (
          <button
            onClick={() => setRightOpen(true)}
            className="absolute top-4 right-4 z-20 bg-white border rounded-full p-2 shadow"
          >
            <PanelRight className="w-4 h-4" />
          </button>
        )}

        {/* MAIN CONTENT */}
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </div>

      {/* ================= RIGHT PANEL ================= */}
      {rightPanel && (
        <div
          className={`relative border-l bg-white transition-all duration-300
          ${rightOpen ? "w-[360px]" : "w-0"} overflow-hidden`}
        >
          {/* CONTENT */}
          {rightOpen && (
            <div className="h-full overflow-y-auto">
              {rightPanel}
            </div>
          )}

          {/* CLOSE BUTTON */}
          {rightOpen && (
            <button
              onClick={() => setRightOpen(false)}
              className="absolute top-4 left-[-16px] z-10 bg-white border rounded-full p-1 shadow"
            >
              <PanelRight className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}