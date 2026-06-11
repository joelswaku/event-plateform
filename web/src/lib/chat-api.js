import { api } from "@/lib/api";

/* ── REST wrappers ────────────────────────────────────────────────────────── */
export const chatApi = {
  contacts:      (search = "")        => api.get(`/chat/contacts`, { params: { search } }).then(r => r.data?.data ?? []),
  unreadCount:   ()                   => api.get(`/chat/unread-count`).then(r => r.data?.data?.total ?? 0),
  conversations: (search = "")        => api.get(`/chat/conversations`, { params: { search } }).then(r => r.data?.data ?? []),
  conversation:  (id)                 => api.get(`/chat/conversations/${id}`).then(r => r.data?.data ?? null),
  messages:      (id, before, limit=30) => api.get(`/chat/conversations/${id}/messages`, { params: { before, limit } }).then(r => r.data?.data ?? []),
  send:          (id, payload)        => api.post(`/chat/conversations/${id}/messages`, payload).then(r => r.data?.data),
  openDirect:    (recipientId)        => api.post(`/chat/conversations`, { recipient_id: recipientId }).then(r => r.data?.data),
  openSupport:   ()                   => api.post(`/chat/support`).then(r => r.data?.data),
  createGroup:   (payload)            => api.post(`/chat/conversations`, payload).then(r => r.data?.data),
  markRead:      (id)                 => api.post(`/chat/conversations/${id}/read`).then(r => r.data),
  typing:        (id)                 => api.post(`/chat/conversations/${id}/typing`).catch(() => {}),
  broadcast:     (payload)            => api.post(`/chat/broadcast`, payload).then(r => r.data?.data),
};

/* ── Real-time SSE connector ──────────────────────────────────────────────────
   Returns an object with .close(). Auto-reconnects with backoff. The browser
   EventSource can't set Authorization headers, so we pass the in-memory access
   token via ?token= (cookies are also sent as a fallback when same-site).      */
export function connectChatStream({ token, onMessage, onRead, onTyping, onOpen, onError }) {
  const base = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api").replace(/\/$/, "");
  let es = null;
  let closed = false;
  let backoff = 1000;

  const open = () => {
    if (closed) return;
    const url = `${base}/chat/stream${token ? `?token=${encodeURIComponent(token)}` : ""}`;
    es = new EventSource(url, { withCredentials: true });

    es.onopen = () => { backoff = 1000; onOpen?.(); };

    es.onmessage = (e) => {
      let payload;
      try { payload = JSON.parse(e.data); } catch { return; }
      switch (payload.event) {
        case "message:new":        onMessage?.(payload); break;
        case "conversation:read":  onRead?.(payload);    break;
        case "typing":             onTyping?.(payload);  break;
        default: break;
      }
    };

    es.onerror = () => {
      onError?.();
      es?.close();
      if (closed) return;
      // reconnect with capped exponential backoff
      setTimeout(open, backoff);
      backoff = Math.min(backoff * 2, 15000);
    };
  };

  open();

  return {
    close() { closed = true; es?.close(); },
  };
}
