"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, X, CheckCheck, Ticket, Heart, Users, ScanLine, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const TYPE_META = {
  new_rsvp:    { Icon: Users,    color: "text-indigo-500",  bg: "bg-indigo-50 dark:bg-indigo-950/40" },
  ticket_sold: { Icon: Ticket,   color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-950/40" },
  new_donation:{ Icon: Heart,    color: "text-rose-500",    bg: "bg-rose-50 dark:bg-rose-950/40"  },
  checkin:     { Icon: ScanLine, color: "text-cyan-500",    bg: "bg-cyan-50 dark:bg-cyan-950/40"   },
};
const DEFAULT_META = { Icon: Zap, color: "text-gray-400", bg: "bg-gray-100 dark:bg-gray-800" };

function fmtTime(iso) {
  if (!iso) return "";
  const d   = new Date(iso);
  const now = new Date();
  const diffMs = now - d;
  const mins   = Math.floor(diffMs / 60_000);
  if (mins < 1)  return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function NotificationPanel({ notifications, unreadCount, onClose, onMarkRead, onMarkAllRead }) {
  const router   = useRouter();
  const panelRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    function handleClick(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) onClose();
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  function handleNotifClick(n) {
    if (!n.read_at) onMarkRead(n.id);
    if (n.link) router.push(n.link);
    onClose();
  }

  return (
    <motion.div
      ref={panelRef}
      initial={{ opacity: 0, y: -8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0,  scale: 1 }}
      exit={{  opacity: 0, y: -8, scale: 0.97 }}
      transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
      className="absolute right-0 top-full mt-2 w-80 rounded-2xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-900 z-50 overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 px-4 py-3">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          <span className="text-sm font-bold text-gray-900 dark:text-white">Notifications</span>
          {unreadCount > 0 && (
            <span className="rounded-full bg-indigo-600 px-1.5 py-0.5 text-[10px] font-bold text-white leading-none">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {unreadCount > 0 && (
            <button
              onClick={onMarkAllRead}
              title="Mark all as read"
              className="rounded-lg p-1.5 text-xs text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300 transition-colors"
            >
              <CheckCheck className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300 transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* List */}
      <div className="max-h-[380px] overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-10">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-800">
              <Bell className="h-5 w-5 text-gray-300 dark:text-gray-600" />
            </div>
            <p className="text-sm font-medium text-gray-400 dark:text-gray-500">No notifications yet</p>
          </div>
        ) : (
          <ul>
            {notifications.map((n) => {
              const { Icon, color, bg } = TYPE_META[n.type] ?? DEFAULT_META;
              const isUnread = !n.read_at;
              return (
                <li key={n.id}>
                  <button
                    onClick={() => handleNotifClick(n)}
                    className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/60 ${isUnread ? "bg-indigo-50/40 dark:bg-indigo-950/20" : ""}`}
                  >
                    <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${bg}`}>
                      <Icon className={`h-4 w-4 ${color}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm leading-snug ${isUnread ? "font-semibold text-gray-900 dark:text-white" : "font-medium text-gray-700 dark:text-gray-300"}`}>
                        {n.title}
                      </p>
                      {n.body && (
                        <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500 line-clamp-1">{n.body}</p>
                      )}
                      <p className="mt-1 text-[10px] font-medium text-gray-300 dark:text-gray-600">{fmtTime(n.created_at)}</p>
                    </div>
                    {isUnread && (
                      <div className="mt-2 h-2 w-2 shrink-0 rounded-full bg-indigo-500" />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="border-t border-gray-100 dark:border-gray-800 px-4 py-2.5">
          <p className="text-center text-xs text-gray-400 dark:text-gray-500">
            Showing {notifications.length} most recent
          </p>
        </div>
      )}
    </motion.div>
  );
}
