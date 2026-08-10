"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import DashboardLoadingScreen from "./DashboardLoadingScreen";

const DISPLAY_DELAY = 0;
const MIN_VISIBLE_TIME = 0;
const FAILSAFE_TIMEOUT = 12000;

function isDashboardNavigation(event) {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return false;

  const target = event.target instanceof Element ? event.target : null;
  const link = target?.closest("a[href]");
  if (!link || link.target === "_blank" || link.hasAttribute("download")) return false;

  const href = link.getAttribute("href");
  if (!href || href.startsWith("#") || /^(mailto:|tel:|javascript:)/i.test(href)) return false;

  try {
    const next = new URL(href, window.location.href);
    const current = new URL(window.location.href);
    return next.origin === current.origin && next.pathname !== current.pathname;
  } catch {
    return false;
  }
}

export default function DashboardRouteLoader() {
  const pathname = usePathname();
  const locationKey = pathname;
  const [visible, setVisible] = useState(false);
  const locationRef = useRef(locationKey);
  const pendingFromRef = useRef(null);
  const shownAtRef = useRef(0);
  const displayTimerRef = useRef(null);
  const failsafeTimerRef = useRef(null);

  const clearTimers = useCallback(() => {
    window.clearTimeout(displayTimerRef.current);
    window.clearTimeout(failsafeTimerRef.current);
    displayTimerRef.current = null;
    failsafeTimerRef.current = null;
  }, []);

  const finish = useCallback(() => {
    if (!pendingFromRef.current) return;
    pendingFromRef.current = null;
    window.clearTimeout(failsafeTimerRef.current);
    failsafeTimerRef.current = null;

    if (!shownAtRef.current) {
      window.clearTimeout(displayTimerRef.current);
      displayTimerRef.current = null;
      setVisible(false);
      return;
    }

    const remaining = Math.max(0, MIN_VISIBLE_TIME - (Date.now() - shownAtRef.current));
    window.setTimeout(() => {
      setVisible(false);
      shownAtRef.current = 0;
    }, remaining);
  }, []);

  const start = useCallback(() => {
    if (pendingFromRef.current) return;

    pendingFromRef.current = locationRef.current;
    displayTimerRef.current = window.setTimeout(() => {
      if (pendingFromRef.current) {
        shownAtRef.current = Date.now();
        setVisible(true);
      }
    }, DISPLAY_DELAY);
    failsafeTimerRef.current = window.setTimeout(finish, FAILSAFE_TIMEOUT);
  }, [finish]);

  useEffect(() => {
    locationRef.current = locationKey;
    if (pendingFromRef.current && pendingFromRef.current !== locationKey) finish();
  }, [finish, locationKey]);

  useEffect(() => {
    const onClick = (event) => {
      if (isDashboardNavigation(event)) start();
    };
    const onNavigationStart = () => start();
    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;

    const wrapHistory = (original) => function wrappedHistoryState(...args) {
      const target = args[2];
      if (target) {
        try {
          const next = new URL(String(target), window.location.href);
          if (next.pathname !== window.location.pathname) start();
        } catch {
          // Let the browser handle malformed history targets normally.
        }
      }
      return original.apply(this, args);
    };

    document.addEventListener("click", onClick, true);
    window.addEventListener("liteevent:navigation-start", onNavigationStart);
    window.history.pushState = wrapHistory(originalPushState);
    window.history.replaceState = wrapHistory(originalReplaceState);

    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("liteevent:navigation-start", onNavigationStart);
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
      clearTimers();
    };
  }, [clearTimers, start]);

  return visible ? <DashboardLoadingScreen overlay message="Opening your workspace…" /> : null;
}
