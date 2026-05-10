"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";

const POLL_MS = 30_000; // 30 s

export function useNotifications() {
  const user = useAuthStore((s) => s.user);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount,   setUnreadCount]   = useState(0);
  const [loading,       setLoading]       = useState(false);
  const timerRef = useRef(null);

  const fetch = useCallback(async () => {
    if (!user) return;
    try {
      const { data } = await api.get("/notifications?limit=30");
      if (data.success) {
        setNotifications(data.notifications ?? []);
        setUnreadCount(data.unreadCount ?? 0);
      }
    } catch {
      // silent – notifications are non-critical
    }
  }, [user]);

  // Initial fetch + polling
  useEffect(() => {
    fetch();
    timerRef.current = setInterval(fetch, POLL_MS);
    return () => clearInterval(timerRef.current);
  }, [fetch]);

  const markRead = useCallback(async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {}
  }, []);

  const markAllRead = useCallback(async () => {
    try {
      await api.patch("/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })));
      setUnreadCount(0);
    } catch {}
  }, []);

  return { notifications, unreadCount, loading, refresh: fetch, markRead, markAllRead };
}
