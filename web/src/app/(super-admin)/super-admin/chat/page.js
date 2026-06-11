"use client";

import ChatWorkspace from "@/components/chat/ChatWorkspace";

export default function SuperAdminSupportPage() {
  return (
    <div>
      <div className="mb-5">
        <p style={{ color: "rgba(201,169,110,0.60)", fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em" }}>Super Admin</p>
        <h1 style={{ fontSize: 20, fontWeight: 900, color: "#fff", letterSpacing: "-0.03em" }}>Support</h1>
        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.30)", marginTop: 2 }}>
          Answer user questions and broadcast announcements. Each user has one support thread that routes to you.
        </p>
      </div>
      <div className="h-[calc(100vh-12rem)]">
        <ChatWorkspace variant="inbox" />
      </div>
    </div>
  );
}
