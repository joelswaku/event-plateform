"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { ChevronLeft, Send, Loader2, MessageSquare, Trash2 } from "lucide-react";
import { useChatStore } from "@/store/chat.store";
import { useAuthStore } from "@/store/auth.store";
import DeleteModal from "@/components/chat/DeleteModal";

const EMPTY_MESSAGES = [];

export default function ChatConversationPage() {
  const router = useRouter();
  const { id } = useParams();
  const user = useAuthStore((s) => s.user);
  const conversation = useChatStore((s) => s.conversations.find((c) => c.id === id));
  const messages = useChatStore((s) => s.messagesByConv[id]) || EMPTY_MESSAGES;
  const loadingThread = useChatStore((s) => s.loadingThread[id]);
  const fetchMessages = useChatStore((s) => s.fetchMessages);
  const sendMessage = useChatStore((s) => s.sendMessage);
  const markRead = useChatStore((s) => s.markRead);
  const getConversation = useChatStore((s) => s.getConversation);
  const deleteMessage = useChatStore((s) => s.deleteMessage);

  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [deleteModal, setDeleteModal] = useState(null);
  const scrollRef = useRef(null);
  const isSuperAdmin = !!user?.is_super_admin;

  useEffect(() => {
    if (!id) return;
    getConversation(id);
    fetchMessages(id);
    markRead(id);

    // Poll for new messages every 3 seconds
    const interval = setInterval(() => {
      fetchMessages(id);
    }, 3000);

    return () => clearInterval(interval);
  }, [id, getConversation, fetchMessages, markRead]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  async function handleSend() {
    if (!inputText.trim() || sending) return;
    setSending(true);
    const text = inputText;
    setInputText("");
    await sendMessage(id, text);
    setSending(false);
  }

  async function handleDelete(messageId) {
    setDeleteModal({ messageId });
  }

  async function confirmDelete() {
    if (!deleteModal) return;
    setDeletingId(deleteModal.messageId);
    await deleteMessage(id, deleteModal.messageId);
    setDeletingId(null);
    setDeleteModal(null);
  }

  function handleKeyPress(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  if (!user) return null;

  const initials = conversation?.counterpart?.full_name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "ST";

  const userInitials = user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || user?.email?.slice(0, 2).toUpperCase() || "ME";

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex h-screen flex-col" style={{ background: "#07070f" }}>
        {/* Header */}
        <div
          className="flex shrink-0 items-center gap-4 px-6 py-4"
          style={{
            background: "#0e0e16",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <button
            onClick={() => router.back()}
            className="flex h-10 w-10 items-center justify-center rounded-xl transition"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.10)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
          >
            <ChevronLeft size={20} style={{ color: "rgba(255,255,255,0.7)" }} />
          </button>

          {/* Avatar & Info */}
          <div className="flex flex-1 items-center gap-3">
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
              style={{
                background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
                border: "1px solid rgba(99,102,241,0.3)",
              }}
            >
              {conversation?.counterpart?.avatar_url ? (
                <img
                  src={conversation.counterpart.avatar_url}
                  alt=""
                  className="h-full w-full rounded-xl object-cover"
                />
              ) : (
                <span style={{ fontSize: 14, fontWeight: 900, color: "#fff" }}>
                  {initials}
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-base font-black text-white">
                {conversation?.title || conversation?.counterpart?.full_name || "Support Team"}
              </p>
              {conversation?.type === "support" && (
                <div className="mt-0.5 flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <p className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.45)" }}>
                    Usually replies within a few hours
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Messages */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-6 py-6"
          style={{ background: "#07070f" }}
        >
          {loadingThread ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin" style={{ color: "#6366f1" }} />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-16 text-center">
              <div
                className="flex h-16 w-16 items-center justify-center rounded-2xl"
                style={{
                  background: "rgba(99,102,241,0.12)",
                  border: "1px solid rgba(99,102,241,0.25)",
                }}
              >
                <MessageSquare size={28} style={{ color: "#818cf8" }} />
              </div>
              <div>
                <p className="text-base font-black text-white">No messages yet</p>
                <p className="mt-1 text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
                  Send a message to start the conversation
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg, idx) => {
                const isMe = msg.sender_id === user.id;
                const isSystem = msg.sender_id === "system";
                const showAvatar = idx === 0 || messages[idx - 1].sender_id !== msg.sender_id;

                // Get sender initials and avatar
                const senderInitials = isMe
                  ? userInitials
                  : msg.sender_name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "ST";
                const senderAvatar = isMe ? user?.avatar_url : msg.sender_avatar || conversation?.counterpart?.avatar_url;

                return (
                  <div
                    key={msg.id}
                    className={`flex gap-3 ${isMe ? "justify-end" : "justify-start"}`}
                  >
                    {/* Avatar (for received messages) */}
                    {!isMe && !isSystem && (
                      <div className="flex flex-col items-center" style={{ width: 36 }}>
                        {showAvatar ? (
                          <div
                            className="flex h-9 w-9 items-center justify-center rounded-lg"
                            style={{
                              background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
                              border: "1px solid rgba(99,102,241,0.3)",
                            }}
                          >
                            {senderAvatar ? (
                              <img
                                src={senderAvatar}
                                alt=""
                                className="h-full w-full rounded-lg object-cover"
                              />
                            ) : (
                              <span style={{ fontSize: 12, fontWeight: 900, color: "#fff" }}>
                                {senderInitials}
                              </span>
                            )}
                          </div>
                        ) : (
                          <div style={{ height: 8 }} />
                        )}
                      </div>
                    )}

                    {/* Message Bubble */}
                    <div className={`flex max-w-[70%] flex-col ${isMe ? "items-end" : "items-start"} group relative`}>
                      {/* Sender name (if not me and first message in group) */}
                      {!isMe && !isSystem && showAvatar && (
                        <p
                          className="mb-1 px-1 text-xs font-bold"
                          style={{ color: "rgba(255,255,255,0.5)" }}
                        >
                          {msg.sender_name}
                        </p>
                      )}

                      {/* Delete button (hover only, super admin) */}
                      {isSuperAdmin && !isSystem && !msg.deleted && (
                        <button
                          onClick={() => handleDelete(msg.id)}
                          disabled={deletingId === msg.id}
                          className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 hover:!opacity-100 transition-opacity duration-200 bg-red-500 hover:bg-red-600 rounded-full p-1.5 shadow-lg z-50"
                          title="Delete message"
                        >
                          {deletingId === msg.id ? (
                            <Loader2 className="h-3 w-3 animate-spin text-white" />
                          ) : (
                            <Trash2 className="h-3 w-3 text-white" />
                          )}
                        </button>
                      )}

                      <div
                        className="rounded-2xl px-4 py-3"
                        style={{
                          background: isSystem
                            ? "rgba(245,158,11,0.10)"
                            : isMe
                            ? "linear-gradient(135deg, #4f46e5, #6366f1)"
                            : "#14141f",
                          border: isSystem
                            ? "1px solid rgba(245,158,11,0.25)"
                            : isMe
                            ? "none"
                            : "1px solid rgba(255,255,255,0.08)",
                          boxShadow: isMe
                            ? "0 4px 12px rgba(99,102,241,0.25)"
                            : "0 2px 8px rgba(0,0,0,0.2)",
                        }}
                      >
                        <p
                          className="whitespace-pre-wrap text-sm leading-relaxed"
                          style={{
                            color: isSystem ? "#f59e0b" : isMe ? "#fff" : "rgba(255,255,255,0.9)",
                          }}
                        >
                          {msg.body}
                        </p>
                      </div>

                      {/* Time */}
                      <p
                        className="mt-1 px-1 text-[10px] font-medium"
                        style={{ color: "rgba(255,255,255,0.35)" }}
                      >
                        {new Date(msg.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>

                    {/* Avatar (for sent messages) */}
                    {isMe && (
                      <div className="flex flex-col items-center" style={{ width: 36 }}>
                        {showAvatar ? (
                          <div
                            className="flex h-9 w-9 items-center justify-center rounded-lg"
                            style={{
                              background: "linear-gradient(135deg, #4f46e5, #6366f1)",
                              border: "1px solid rgba(99,102,241,0.3)",
                            }}
                          >
                            {user?.avatar_url ? (
                              <img
                                src={user.avatar_url}
                                alt=""
                                className="h-full w-full rounded-lg object-cover"
                              />
                            ) : (
                              <span style={{ fontSize: 12, fontWeight: 900, color: "#fff" }}>
                                {userInitials}
                              </span>
                            )}
                          </div>
                        ) : (
                          <div style={{ height: 8 }} />
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Input Area */}
        <div
          className="shrink-0 px-6 py-4"
          style={{
            background: "#0e0e16",
            borderTop: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                rows={1}
                className="w-full resize-none rounded-2xl px-4 py-3 text-sm leading-relaxed focus:outline-none"
                style={{
                  background: "#14141f",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "#fff",
                  maxHeight: "120px",
                }}
                onFocus={(e) => (e.target.style.border = "1px solid rgba(99,102,241,0.5)")}
                onBlur={(e) => (e.target.style.border = "1px solid rgba(255,255,255,0.08)")}
              />
            </div>
            <button
              onClick={handleSend}
              disabled={!inputText.trim() || sending}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition-all disabled:opacity-40"
              style={{
                background: inputText.trim() && !sending
                  ? "linear-gradient(135deg, #4f46e5, #6366f1)"
                  : "rgba(99,102,241,0.3)",
                boxShadow: inputText.trim() && !sending
                  ? "0 4px 16px rgba(99,102,241,0.4)"
                  : "none",
              }}
            >
              {sending ? (
                <Loader2 size={20} className="animate-spin text-white" />
              ) : (
                <Send size={20} style={{ color: "#fff" }} />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Delete Modal */}
      <DeleteModal
        isOpen={!!deleteModal}
        onClose={() => setDeleteModal(null)}
        onConfirm={confirmDelete}
        isDeleting={!!deletingId}
        title="Delete Message"
        message="Are you sure you want to delete this message? This action cannot be undone."
        confirmText="Delete Message"
      />
    </div>
  );
}
