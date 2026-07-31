"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare, ChevronLeft, Loader2, MoreVertical, Trash2 } from "lucide-react";
import { useChatStore } from "@/store/chat.store";
import { useAuthStore } from "@/store/auth.store";
import DeleteModal from "@/components/chat/DeleteModal";

export default function ChatListPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isSuperAdmin = !!user?.is_super_admin;
  const isUserChat = !isSuperAdmin;
  const conversations = useChatStore((s) => s.conversations);
  const loadingList = useChatStore((s) => s.loadingList);
  const fetchConversations = useChatStore((s) => s.fetchConversations);
  const deleteConversation = useChatStore((s) => s.deleteConversation);
  const deleteAllConversationsWithUser = useChatStore((s) => s.deleteAllConversationsWithUser);
  const [contextMenu, setContextMenu] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteModal, setDeleteModal] = useState(null);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  async function handleDeleteConversation(convId, title) {
    setDeleteModal({ type: 'single', id: convId, title });
    setContextMenu(null);
  }

  async function handleDeleteAll(userId, userName) {
    setDeleteModal({ type: 'all', userId, userName });
    setContextMenu(null);
  }

  async function confirmDelete() {
    if (!deleteModal) return;
    setDeleting(true);

    if (deleteModal.type === 'single') {
      await deleteConversation(deleteModal.id);
    } else if (deleteModal.type === 'all') {
      await deleteAllConversationsWithUser(deleteModal.userId);
    }

    setDeleting(false);
    setDeleteModal(null);
  }

  if (!user) return null;

  return (
    <div className={`mx-auto ${isUserChat ? "max-w-4xl" : "max-w-3xl"} px-4 py-8`}>
      {/* Header */}
      <div className="mb-6 flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className={`flex h-11 w-11 shrink-0 items-center justify-center transition ${isUserChat ? "rounded-2xl" : "rounded-xl"}`}
          style={{
            background: isUserChat ? "linear-gradient(145deg, rgba(255,255,255,0.09), rgba(255,255,255,0.035))" : "rgba(255,255,255,0.06)",
            border: isUserChat ? "1px solid rgba(255,255,255,0.10)" : "1px solid rgba(255,255,255,0.08)",
            boxShadow: isUserChat ? "0 8px 24px rgba(0,0,0,0.16)" : "none",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = isUserChat ? "rgba(99,102,241,0.20)" : "rgba(255,255,255,0.10)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = isUserChat ? "linear-gradient(145deg, rgba(255,255,255,0.09), rgba(255,255,255,0.035))" : "rgba(255,255,255,0.06)")}
          aria-label="Go back"
        >
          <ChevronLeft size={20} style={{ color: "rgba(255,255,255,0.7)" }} />
        </button>
        {isUserChat && <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl" style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.28), rgba(124,58,237,0.22))", border: "1px solid rgba(129,140,248,0.24)" }}>
          <MessageSquare size={19} style={{ color: "#c7d2fe" }} />
        </div>}
        <div>
          {isUserChat && <p className="mb-0.5 text-[10px] font-black uppercase tracking-[0.18em]" style={{ color: "rgba(165,180,252,0.76)" }}>Inbox</p>}
          <h1 className={isUserChat ? "text-[26px] font-black tracking-[-0.03em] text-white" : "text-2xl font-black text-white"}>Messages</h1>
          <p className="mt-0.5 text-sm" style={{ color: isUserChat ? "rgba(255,255,255,0.48)" : "rgba(255,255,255,0.45)" }}>
            {conversations.length === 0
              ? "No conversations yet"
              : `${conversations.length} conversation${conversations.length > 1 ? "s" : ""}`}
          </p>
        </div>
      </div>

      {/* Conversations */}
      <div
        className={`overflow-hidden ${isUserChat ? "rounded-[28px] shadow-2xl" : "rounded-3xl"}`}
        style={{
          background: isUserChat ? "linear-gradient(155deg, #141422 0%, #0d0d16 48%, #0a0a12 100%)" : "#0e0e16",
          border: isUserChat ? "1px solid rgba(255,255,255,0.10)" : "1px solid rgba(255,255,255,0.08)",
          boxShadow: isUserChat ? "0 24px 70px rgba(0,0,0,0.28)" : "none",
        }}
      >
        {loadingList ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin" style={{ color: "#6366f1" }} />
          </div>
        ) : conversations.length === 0 ? (
          <div className={`flex flex-col items-center gap-4 px-8 text-center ${isUserChat ? "py-20" : "py-16"}`}>
            <div
              className={`flex h-16 w-16 items-center justify-center ${isUserChat ? "rounded-3xl" : "rounded-2xl"}`}
              style={{
                background: isUserChat ? "linear-gradient(135deg, rgba(99,102,241,0.24), rgba(124,58,237,0.16))" : "rgba(99,102,241,0.12)",
                border: isUserChat ? "1px solid rgba(129,140,248,0.30)" : "1px solid rgba(99,102,241,0.25)",
                boxShadow: isUserChat ? "0 12px 30px rgba(79,70,229,0.16)" : "none",
              }}
            >
              <MessageSquare size={28} style={{ color: "#818cf8" }} />
            </div>
            <div>
              <p className="text-base font-black text-white">No conversations yet</p>
              <p className="mt-1 text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
                Start a support chat from the Help & Support page
              </p>
            </div>
          </div>
        ) : (
          conversations.map((conv, idx) => {
            const initials = conv.counterpart?.full_name
              ?.split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2) || "ST";

            return (
              <div
                key={conv.id}
                className={`group relative flex w-full items-center gap-4 py-4 cursor-pointer ${isUserChat ? "px-5 transition-all duration-200 md:px-6" : "px-6 transition"}`}
                style={{
                  borderBottom: idx < conversations.length - 1 ? (isUserChat ? "1px solid rgba(255,255,255,0.07)" : "1px solid rgba(255,255,255,0.06)") : "none",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = isUserChat ? "linear-gradient(90deg, rgba(99,102,241,0.13), rgba(124,58,237,0.04))" : "rgba(255,255,255,0.03)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                onClick={() => router.push(`/chat/${conv.id}`)}
              >
                {/* Delete menu (super admin only) */}
                {isSuperAdmin && (
                  <div className={`absolute right-4 top-4 transition-opacity z-50 ${contextMenu === conv.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setContextMenu(contextMenu === conv.id ? null : conv.id);
                      }}
                      className="p-2 rounded-lg hover:bg-white/10 transition"
                      title="Options"
                    >
                      <MoreVertical size={16} style={{ color: "rgba(255,255,255,0.6)" }} />
                    </button>

                    {/* Context menu */}
                    {contextMenu === conv.id && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="absolute right-0 top-full mt-1 rounded-lg overflow-hidden shadow-xl z-60"
                        style={{
                          background: "#14141f",
                          border: "1px solid rgba(255,255,255,0.1)",
                          minWidth: "200px",
                        }}
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteConversation(conv.id, conv.title || conv.counterpart?.full_name);
                          }}
                          disabled={deleting}
                          className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-white/5 transition"
                        >
                          <Trash2 size={14} style={{ color: "#ef4444" }} />
                          <span className="text-sm font-medium text-white">Delete Conversation</span>
                        </button>
                        {conv.counterpart?.id && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteAll(conv.counterpart.id, conv.counterpart?.full_name);
                            }}
                            disabled={deleting}
                            className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-white/5 transition border-t"
                            style={{ borderColor: "rgba(255,255,255,0.06)" }}
                          >
                            <Trash2 size={14} style={{ color: "#ef4444" }} />
                            <span className="text-sm font-medium text-white">Delete All with User</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
                {/* Avatar */}
                <div className="relative">
                  <div
                    className={`flex h-14 w-14 shrink-0 items-center justify-center ${isUserChat ? "rounded-2xl" : "rounded-xl"}`}
                    style={{
                      background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
                      border: "1px solid rgba(99,102,241,0.3)",
                      boxShadow: isUserChat ? "0 8px 18px rgba(79,70,229,0.25)" : "none",
                    }}
                  >
                    {conv.counterpart?.avatar_url ? (
                      <img
                        src={conv.counterpart.avatar_url}
                        alt=""
                        className={`h-full w-full object-cover ${isUserChat ? "rounded-2xl" : "rounded-xl"}`}
                      />
                    ) : (
                      <span style={{ fontSize: 16, fontWeight: 900, color: "#fff" }}>
                        {initials}
                      </span>
                    )}
                  </div>
                  {conv.unread_count > 0 && (
                    <div
                      className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full"
                      style={{
                        background: "#ef4444",
                        border: isUserChat ? "2px solid #12121e" : "2px solid #0e0e16",
                      }}
                    >
                      <span style={{ fontSize: 10, fontWeight: 900, color: "#fff" }}>
                        {conv.unread_count > 9 ? "9+" : conv.unread_count}
                      </span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className={isUserChat ? "truncate text-[15px] font-black tracking-[-0.01em] text-white" : "truncate text-base font-black text-white"}>
                      {conv.title || conv.counterpart?.full_name || "Support Team"}
                    </p>
                    {conv.last_message_at && (
                      <p className="shrink-0 text-xs font-medium" style={{ color: "rgba(255,255,255,0.35)" }}>
                        {new Date(conv.last_message_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    )}
                  </div>
                  <p
                    className={isUserChat ? "mt-1 truncate text-[13px]" : "mt-1 truncate text-sm"}
                    style={{
                      color: conv.unread_count > 0 ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.45)",
                      fontWeight: conv.unread_count > 0 ? 600 : 400,
                    }}
                  >
                    {conv.last_message_preview || "No messages yet"}
                  </p>
                </div>

                {/* Chevron */}
                <ChevronLeft
                  size={18}
                  className="shrink-0 rotate-180 transition-transform group-hover:translate-x-1"
                  style={{ color: "rgba(255,255,255,0.3)" }}
                />
              </div>
            );
          })
        )}
      </div>

      {/* Delete Modal */}
      <DeleteModal
        isOpen={!!deleteModal}
        onClose={() => setDeleteModal(null)}
        onConfirm={confirmDelete}
        isDeleting={deleting}
        title={deleteModal?.type === 'single' ? 'Delete Conversation' : 'Delete All Conversations'}
        message={
          deleteModal?.type === 'single'
            ? `Are you sure you want to delete your conversation with ${deleteModal?.title || 'this user'}? This action cannot be undone.`
            : `Are you sure you want to delete ALL conversations with ${deleteModal?.userName || 'this user'}? This action cannot be undone.`
        }
        confirmText={deleteModal?.type === 'single' ? 'Delete' : 'Delete All'}
      />
    </div>
  );
}
