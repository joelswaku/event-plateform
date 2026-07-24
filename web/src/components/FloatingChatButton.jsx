"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare, Loader2 } from "lucide-react";
import { useChatStore } from "@/store/chat.store";
import { useAuthStore } from "@/store/auth.store";
import toast from "react-hot-toast";

export function FloatingChatButton() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isSuperAdmin = !!user?.is_super_admin;
  const unreadTotal = useChatStore((s) => s.unreadTotal);
  const fetchUnreadCount = useChatStore((s) => s.fetchUnreadCount);
  const fetchConversations = useChatStore((s) => s.fetchConversations);
  const openSupport = useChatStore((s) => s.openSupport);

  const [opening, setOpening] = useState(false);
  const [pulse, setPulse] = useState(false);

  // Fetch unread count and conversations periodically (only for non-super-admins)
  useEffect(() => {
    if (isSuperAdmin || !user) return;

    // Initial fetch
    fetchUnreadCount();
    fetchConversations();

    // Poll every 5 seconds for real-time updates
    const interval = setInterval(() => {
      fetchUnreadCount();
      fetchConversations();
    }, 5000);

    return () => clearInterval(interval);
  }, [isSuperAdmin, user, fetchUnreadCount, fetchConversations]);

  // Pulse animation when there are new messages
  useEffect(() => {
    if (unreadTotal > 0) {
      setPulse(true);
    } else {
      setPulse(false);
    }
  }, [unreadTotal]);

  async function handleClick() {
    if (opening) return;

    if (isSuperAdmin) {
      router.push("/chat");
      return;
    }

    setOpening(true);
    try {
      const conv = await openSupport();
      if (conv) {
        router.push(`/chat/${conv.id}`);
      } else {
        toast.error("Could not open support chat. Try again later.");
      }
    } finally {
      setOpening(false);
    }
  }

  // Don't show if user is not logged in
  if (!user) return null;

  return (
    <button
      onClick={handleClick}
      disabled={opening}
      className={`group fixed bottom-6 right-6 z-50 flex h-16 w-16 items-center justify-center rounded-full shadow-2xl transition-all disabled:opacity-50 ${
        pulse ? "animate-pulse" : ""
      }`}
      style={{
        background: "linear-gradient(135deg, #4f46e5, #6366f1)",
        boxShadow: "0 8px 32px rgba(99,102,241,0.5)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "scale(1.1)";
        e.currentTarget.style.boxShadow = "0 12px 40px rgba(99,102,241,0.6)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "scale(1)";
        e.currentTarget.style.boxShadow = "0 8px 32px rgba(99,102,241,0.5)";
      }}
    >
      {/* Unread badge */}
      {!isSuperAdmin && unreadTotal > 0 && (
        <div
          className="absolute -right-1 -top-1 flex h-7 w-7 items-center justify-center rounded-full"
          style={{
            background: "#ef4444",
            border: "3px solid #07070f",
            boxShadow: "0 4px 12px rgba(239,68,68,0.6)",
          }}
        >
          <span style={{ fontSize: 11, fontWeight: 900, color: "#fff" }}>
            {unreadTotal > 9 ? "9+" : unreadTotal}
          </span>
        </div>
      )}

      {/* Icon */}
      {opening ? (
        <Loader2 size={28} className="animate-spin text-white" />
      ) : (
        <MessageSquare size={28} className="text-white" />
      )}

      {/* Tooltip on hover */}
      <div
        className="pointer-events-none absolute bottom-full right-0 mb-3 whitespace-nowrap rounded-xl px-4 py-2 opacity-0 transition-opacity group-hover:opacity-100"
        style={{
          background: "#0e0e16",
          border: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
        }}
      >
        <p className="text-sm font-bold text-white">
          {isSuperAdmin ? "View Messages" : "Need Help? Chat with us"}
        </p>
      </div>
    </button>
  );
}
