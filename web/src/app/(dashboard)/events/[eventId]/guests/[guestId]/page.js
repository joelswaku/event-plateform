"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, Mail, Grid, UserCheck, Hash, Calendar, Layers, Trash2, Check, Clock, CheckCircle, Edit2, Copy, ChevronRight } from "lucide-react";
import { useGuestStore } from "@/store/guest.store";
import toast from "react-hot-toast";

function getInitials(name) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

const STATUS_CFG = {
  CONFIRMED: { color: '#10b981', bg: 'rgba(16,185,129,0.12)', dot: '#10b981', label: 'Confirmed' },
  PENDING:   { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', dot: '#f59e0b', label: 'Pending' },
  DECLINED:  { color: '#ef4444', bg: 'rgba(239,68,68,0.12)', dot: '#ef4444', label: 'Declined' },
  GOING:     { color: '#10b981', bg: 'rgba(16,185,129,0.12)', dot: '#10b981', label: 'Going' },
  MAYBE:     { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', dot: '#f59e0b', label: 'Maybe' },
};

function SectionLabel({ label }) {
  return (
    <h3 className="text-[10px] font-bold uppercase tracking-widest mt-6 mb-2"
      style={{ color: 'rgba(255,255,255,0.35)' }}>
      {label}
    </h3>
  );
}

function ActionRow({ icon: Icon, label, sub, accent, loading, onClick, danger = false }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`flex items-center gap-3 px-4 py-3.5 w-full text-left transition-colors ${
        danger ? 'hover:bg-red-900/10' : 'hover:bg-white/5'
      }`}
    >
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px]"
        style={{ backgroundColor: `${accent}18` }}
      >
        {loading ? (
          <div className="h-4 w-4 animate-spin rounded-full border-2" style={{ borderColor: `${accent}40`, borderTopColor: accent }} />
        ) : (
          <Icon size={15} style={{ color: accent }} />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-bold ${danger ? 'text-red-400' : 'text-white'}`}>{label}</p>
        {sub && <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>{sub}</p>}
      </div>
      <ChevronLeft size={14} className="-rotate-180" style={{ color: danger ? 'rgba(239,68,68,0.25)' : 'rgba(255,255,255,0.12)' }} />
    </button>
  );
}

function DetailRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-2.5 px-4 py-2.5">
      <Icon size={13} style={{ color: 'rgba(255,255,255,0.35)' }} />
      <span className="text-xs font-semibold w-[70px]" style={{ color: 'rgba(255,255,255,0.35)' }}>{label}</span>
      <span className="flex-1 text-xs text-right truncate" style={{ color: 'rgba(255,255,255,0.5)' }}>{value}</span>
    </div>
  );
}

function SendQrModal({ open, onClose, onSendEmail, guest }) {
  const [sending, setSending] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSendEmail = async () => {
    setSending(true);
    await onSendEmail();
    setSending(false);
    onClose();
  };

  const handleWhatsApp = () => {
    const phone = guest?.phone?.replace(/[^0-9]/g, '');
    const qrUrl = `${window.location.origin}/qr/${guest.id}`;
    const message = `Check-in QR Code for ${guest.full_name}\n\n${qrUrl}`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
    onClose();
  };

  const handleShare = async () => {
    const qrUrl = `${window.location.origin}/qr/${guest.id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Check-in QR Code',
          text: `Check-in QR Code for ${guest.full_name}`,
          url: qrUrl,
        });
        onClose();
      } catch (err) {
        if (err.name !== 'AbortError') {
          handleCopyLink();
        }
      }
    } else {
      handleCopyLink();
    }
  };

  const handleCopyLink = async () => {
    const qrUrl = `${window.location.origin}/qr/${guest.id}`;
    await navigator.clipboard.writeText(qrUrl);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
      onClose();
    }, 1500);
  };

  if (!open) return null;

  const hasEmail = guest?.email;
  const hasPhone = guest?.phone;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}>
      <div className="w-full max-w-sm rounded-[24px] overflow-hidden"
        style={{ background: '#0e0e16', border: '1px solid rgba(255,255,255,0.08)' }}>
        {/* Header */}
        <div className="px-6 pt-6 pb-4">
          <h2 className="text-[20px] font-black text-white">Share QR Code</h2>
          <p className="text-[13px] mt-1" style={{ color: 'rgba(255,255,255,0.45)' }}>
            Share check-in QR code for {guest?.full_name}
          </p>
        </div>

        {/* Options */}
        <div className="px-4 pb-4 space-y-2">
          {/* Share */}
          <button
            onClick={handleShare}
            className="w-full flex items-center gap-3 p-4 rounded-[16px] border transition-all hover:bg-opacity-20"
            style={{
              background: 'rgba(139,92,246,0.08)',
              borderColor: 'rgba(139,92,246,0.3)',
            }}
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px]"
              style={{ background: 'rgba(139,92,246,0.15)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2">
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
                <polyline points="16 6 12 2 8 6"></polyline>
                <line x1="12" y1="2" x2="12" y2="15"></line>
              </svg>
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-bold text-white">Share QR Code</p>
              <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>
                Share via any app
              </p>
            </div>
            <ChevronRight size={16} style={{ color: '#8b5cf6' }} />
          </button>

          {/* WhatsApp */}
          {hasPhone && (
            <button
              onClick={handleWhatsApp}
              disabled={sending}
              className="w-full flex items-center gap-3 p-4 rounded-[16px] border transition-all disabled:opacity-50 hover:bg-opacity-20"
              style={{
                background: 'rgba(37,211,102,0.08)',
                borderColor: 'rgba(37,211,102,0.3)',
              }}
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px]"
                style={{ background: 'rgba(37,211,102,0.15)' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" fill="#25D366"/>
                </svg>
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-bold text-white">Send via WhatsApp</p>
                <p className="text-[11px] mt-0.5 truncate" style={{ color: 'rgba(255,255,255,0.45)' }}>
                  {guest?.phone}
                </p>
              </div>
              <ChevronRight size={16} style={{ color: '#25D366' }} />
            </button>
          )}

          {/* Email */}
          {hasEmail && (
            <button
              onClick={handleSendEmail}
              disabled={sending}
              className="w-full flex items-center gap-3 p-4 rounded-[16px] border transition-all disabled:opacity-50 hover:bg-opacity-20"
              style={{
                background: 'rgba(99,102,241,0.08)',
                borderColor: 'rgba(99,102,241,0.3)',
              }}
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px]"
                style={{ background: 'rgba(99,102,241,0.15)' }}>
                <Mail size={18} style={{ color: '#6366f1' }} />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-bold text-white">Send via Email</p>
                <p className="text-[11px] mt-0.5 truncate" style={{ color: 'rgba(255,255,255,0.45)' }}>
                  {guest?.email}
                </p>
              </div>
              {sending && <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-400/40 border-t-indigo-400" />}
            </button>
          )}

          {/* Copy Link */}
          <button
            onClick={handleCopyLink}
            className="w-full flex items-center gap-3 p-4 rounded-[16px] border transition-all hover:bg-opacity-20"
            style={{
              background: 'rgba(245,158,11,0.08)',
              borderColor: 'rgba(245,158,11,0.3)',
            }}
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px]"
              style={{ background: 'rgba(245,158,11,0.15)' }}>
              {copied ? (
                <Check size={18} style={{ color: '#f59e0b' }} />
              ) : (
                <Copy size={18} style={{ color: '#f59e0b' }} />
              )}
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-bold text-white">
                {copied ? 'Link Copied!' : 'Copy QR Link'}
              </p>
              <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>
                {copied ? 'Ready to paste' : 'Copy to clipboard'}
              </p>
            </div>
            {!copied && <ChevronRight size={16} style={{ color: '#f59e0b' }} />}
          </button>
        </div>

        {/* Cancel */}
        <div className="px-4 pb-4">
          <button
            onClick={onClose}
            disabled={sending}
            className="w-full py-3 rounded-[14px] text-sm font-bold transition-colors disabled:opacity-50"
            style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function SendInviteModal({ open, onClose, onSend, guest, eventId }) {
  const [sending, setSending] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSend = async (channel) => {
    setSending(true);
    await onSend(channel);
    setSending(false);
    onClose();
  };

  const handleWhatsApp = () => {
    const phone = guest?.phone?.replace(/[^0-9]/g, '');
    const inviteUrl = `${window.location.origin}/invite/${guest.id}`;
    const message = `You're invited to the event!\n\nRSVP here: ${inviteUrl}`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
    onClose();
  };

  const handleShare = async () => {
    const inviteUrl = `${window.location.origin}/invite/${guest.id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Event Invitation',
          text: "You're invited to the event!",
          url: inviteUrl,
        });
        onClose();
      } catch (err) {
        if (err.name !== 'AbortError') {
          handleCopyLink();
        }
      }
    } else {
      handleCopyLink();
    }
  };

  const handleCopyLink = async () => {
    const inviteUrl = `${window.location.origin}/invite/${guest.id}`;
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
      onClose();
    }, 1500);
  };

  if (!open) return null;

  const hasEmail = guest?.email;
  const hasPhone = guest?.phone;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}>
      <div className="w-full max-w-sm rounded-[24px] overflow-hidden"
        style={{ background: '#0e0e16', border: '1px solid rgba(255,255,255,0.08)' }}>
        {/* Header */}
        <div className="px-6 pt-6 pb-4">
          <h2 className="text-[20px] font-black text-white">Send Invitation</h2>
          <p className="text-[13px] mt-1" style={{ color: 'rgba(255,255,255,0.45)' }}>
            Choose how to invite {guest?.full_name}
          </p>
        </div>

        {/* Options */}
        <div className="px-4 pb-4 space-y-2">
          {/* WhatsApp */}
          {hasPhone && (
            <button
              onClick={handleWhatsApp}
              disabled={sending}
              className="w-full flex items-center gap-3 p-4 rounded-[16px] border transition-all disabled:opacity-50 hover:bg-opacity-20"
              style={{
                background: 'rgba(37,211,102,0.08)',
                borderColor: 'rgba(37,211,102,0.3)',
              }}
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px]"
                style={{ background: 'rgba(37,211,102,0.15)' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" fill="#25D366"/>
                </svg>
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-bold text-white">Send via WhatsApp</p>
                <p className="text-[11px] mt-0.5 truncate" style={{ color: 'rgba(255,255,255,0.45)' }}>
                  {guest?.phone}
                </p>
              </div>
              <ChevronRight size={16} style={{ color: '#25D366' }} />
            </button>
          )}

          {/* Email */}
          {hasEmail && (
            <button
              onClick={() => handleSend('EMAIL')}
              disabled={sending}
              className="w-full flex items-center gap-3 p-4 rounded-[16px] border transition-all disabled:opacity-50 hover:bg-opacity-20"
              style={{
                background: 'rgba(99,102,241,0.08)',
                borderColor: 'rgba(99,102,241,0.3)',
              }}
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px]"
                style={{ background: 'rgba(99,102,241,0.15)' }}>
                <Mail size={18} style={{ color: '#6366f1' }} />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-bold text-white">Send via Email</p>
                <p className="text-[11px] mt-0.5 truncate" style={{ color: 'rgba(255,255,255,0.45)' }}>
                  {guest?.email}
                </p>
              </div>
              {sending && <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-400/40 border-t-indigo-400" />}
            </button>
          )}

          {/* Share */}
          <button
            onClick={handleShare}
            className="w-full flex items-center gap-3 p-4 rounded-[16px] border transition-all hover:bg-opacity-20"
            style={{
              background: 'rgba(139,92,246,0.08)',
              borderColor: 'rgba(139,92,246,0.3)',
            }}
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px]"
              style={{ background: 'rgba(139,92,246,0.15)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2">
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
                <polyline points="16 6 12 2 8 6"></polyline>
                <line x1="12" y1="2" x2="12" y2="15"></line>
              </svg>
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-bold text-white">Share Invitation</p>
              <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>
                Share via any app
              </p>
            </div>
            <ChevronRight size={16} style={{ color: '#8b5cf6' }} />
          </button>

          {/* Copy Link */}
          <button
            onClick={handleCopyLink}
            className="w-full flex items-center gap-3 p-4 rounded-[16px] border transition-all hover:bg-opacity-20"
            style={{
              background: 'rgba(245,158,11,0.08)',
              borderColor: 'rgba(245,158,11,0.3)',
            }}
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px]"
              style={{ background: 'rgba(245,158,11,0.15)' }}>
              {copied ? (
                <Check size={18} style={{ color: '#f59e0b' }} />
              ) : (
                <Copy size={18} style={{ color: '#f59e0b' }} />
              )}
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-bold text-white">
                {copied ? 'Link Copied!' : 'Copy Invitation Link'}
              </p>
              <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>
                {copied ? 'Ready to paste' : 'Copy to clipboard'}
              </p>
            </div>
            {!copied && <ChevronRight size={16} style={{ color: '#f59e0b' }} />}
          </button>
        </div>

        {/* Cancel */}
        <div className="px-4 pb-4">
          <button
            onClick={onClose}
            disabled={sending}
            className="w-full py-3 rounded-[14px] text-sm font-bold transition-colors disabled:opacity-50"
            style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default function GuestDetailPage() {
  const { eventId, guestId } = useParams();
  const router = useRouter();
  const { guests, getGuestById, deleteGuest, sendGuestInvitation, sendQrEmail, manualCheckIn } = useGuestStore();

  const [busy, setBusy] = useState(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);

  const guest = guests.find(g => g.id === guestId);

  useEffect(() => {
    if (eventId && guestId) {
      getGuestById(eventId, guestId);
    }
  }, [eventId, guestId]);

  if (!guest) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: '#0a0a0f' }}>
        <div className="h-8 w-8 animate-spin rounded-full border-2"
          style={{ borderColor: 'rgba(255,255,255,0.08)', borderTopColor: '#6366f1' }} />
      </div>
    );
  }

  const run = async (key, fn, msg) => {
    setBusy(key);
    const res = await fn();
    setBusy(null);
    if (res?.success) {
      toast.success(msg);
    } else {
      toast.error(res?.error || 'Action failed');
    }
  };

  const handleSendInvite = async (channel) => {
    setBusy('invite');
    const res = await sendGuestInvitation(eventId, guestId, { channel });
    setBusy(null);
    if (res?.success) {
      toast.success('Invitation sent!');
    } else {
      toast.error('Failed to send invitation');
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Remove ${guest.full_name} from this event?`)) return;
    await deleteGuest(eventId, guestId);
    router.push(`/events/${eventId}/guests`);
  };

  const rsvpStatus = guest.status || 'PENDING';
  const cfg = STATUS_CFG[rsvpStatus] || STATUS_CFG.PENDING;
  const initials = getInitials(guest.full_name);
  const checkedIn = guest.checked_in_at;

  return (
    <div className="min-h-screen" style={{ background: '#0a0a0f' }}>
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3 border-b"
        style={{ background: '#0a0a0f', borderColor: 'rgba(255,255,255,0.07)' }}>
        <button
          onClick={() => router.back()}
          className="flex h-9 w-9 items-center justify-center rounded-[11px] border"
          style={{ background: '#14141f', borderColor: 'rgba(255,255,255,0.08)' }}
        >
          <ChevronLeft size={18} className="text-white" />
        </button>
        <h1 className="flex-1 text-[17px] font-black text-white truncate">{guest.full_name}</h1>
        <button
          onClick={() => router.push(`/events/${eventId}/guests`)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-[10px] border"
          style={{ background: 'rgba(99,102,241,0.12)', borderColor: 'rgba(99,102,241,0.3)' }}
        >
          <Edit2 size={12} style={{ color: '#6366f1' }} />
          <span className="text-xs font-bold" style={{ color: '#6366f1' }}>Edit</span>
        </button>
      </div>

      <div className="px-4 py-3 space-y-3 pb-20">
        {/* Profile Card */}
        <div className="relative rounded-[20px] border overflow-hidden p-5 flex flex-col items-center gap-3"
          style={{ background: `linear-gradient(135deg, ${cfg.color}08, ${cfg.color}03)`, borderColor: 'rgba(255,255,255,0.08)' }}>
          {/* Avatar */}
          <div
            className="relative flex h-[72px] w-[72px] items-center justify-center rounded-full border-2"
            style={{ backgroundColor: `${cfg.color}22`, borderColor: `${cfg.color}44` }}
          >
            {guest.is_vip && <span className="absolute -top-1 -right-1 text-sm">👑</span>}
            <span className="text-[22px] font-black" style={{ color: cfg.color }}>{initials}</span>
          </div>

          <h2 className="text-[20px] font-black text-white text-center tracking-tight">{guest.full_name}</h2>

          {/* Contact Info */}
          <div className="flex flex-wrap gap-2 justify-center">
            {guest.email && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border"
                style={{ background: '#14141f', borderColor: 'rgba(255,255,255,0.07)' }}>
                <Mail size={11} style={{ color: 'rgba(255,255,255,0.35)' }} />
                <span className="text-[11px] font-semibold" style={{ color: 'rgba(255,255,255,0.5)' }}>{guest.email}</span>
              </div>
            )}
            {guest.phone && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border"
                style={{ background: '#14141f', borderColor: 'rgba(255,255,255,0.07)' }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="2">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                </svg>
                <span className="text-[11px] font-semibold" style={{ color: 'rgba(255,255,255,0.5)' }}>{guest.phone}</span>
              </div>
            )}
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-2 justify-center">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border"
              style={{ background: cfg.bg, borderColor: `${cfg.color}35` }}>
              <div className="h-1.5 w-1.5 rounded-full" style={{ background: cfg.dot }} />
              <span className="text-[11px] font-bold" style={{ color: cfg.color }}>{cfg.label}</span>
            </div>
            {guest.is_vip && (
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-full border"
                style={{ background: 'rgba(245,158,11,0.12)', borderColor: 'rgba(245,158,11,0.35)' }}>
                <span className="text-[11px] font-bold" style={{ color: '#f59e0b' }}>👑 VIP</span>
              </div>
            )}
            {guest.plus_one_allowed && (
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-full border"
                style={{ background: 'rgba(139,92,246,0.12)', borderColor: 'rgba(139,92,246,0.35)' }}>
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
                <span className="text-[11px] font-bold" style={{ color: '#8b5cf6' }}>+{guest.plus_one_count || 1}</span>
              </div>
            )}
            {checkedIn && (
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-full border"
                style={{ background: 'rgba(6,182,212,0.12)', borderColor: 'rgba(6,182,212,0.35)' }}>
                <CheckCircle size={9} style={{ color: '#06b6d4' }} />
                <span className="text-[11px] font-bold" style={{ color: '#06b6d4' }}>Checked In</span>
              </div>
            )}
          </div>
        </div>

        {/* Check-in Status */}
        {checkedIn ? (
          <div className="flex items-center gap-3 p-4 rounded-[14px] border"
            style={{ borderColor: 'rgba(6,182,212,0.25)', background: 'rgba(6,182,212,0.07)' }}>
            <CheckCircle size={18} style={{ color: '#06b6d4' }} />
            <div>
              <p className="text-sm font-bold" style={{ color: '#06b6d4' }}>Checked In</p>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>
                {new Date(guest.checked_in_at).toLocaleString()}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 p-4 rounded-[14px] border"
            style={{ borderColor: 'rgba(245,158,11,0.25)', background: 'rgba(245,158,11,0.07)' }}>
            <Clock size={18} style={{ color: '#f59e0b' }} />
            <p className="text-sm font-bold" style={{ color: '#f59e0b' }}>Not yet checked in</p>
          </div>
        )}

        {/* Communication */}
        <SectionLabel label="COMMUNICATION" />
        <div className="rounded-[14px] border overflow-hidden divide-y"
          style={{ background: '#14141f', borderColor: 'rgba(255,255,255,0.08)', divideColor: 'rgba(255,255,255,0.07)' }}>
          <ActionRow
            icon={Mail}
            label="Send Invitation"
            sub="Email or SMS event details & RSVP link"
            accent="#6366f1"
            loading={busy === 'invite'}
            onClick={() => setShowInviteModal(true)}
          />
          <ActionRow
            icon={Grid}
            label="Share QR Code"
            sub="Share check-in QR code"
            accent="#10b981"
            loading={busy === 'qr'}
            onClick={() => setShowQrModal(true)}
          />
        </div>

        {/* Check-in */}
        {!checkedIn && (
          <>
            <SectionLabel label="CHECK-IN" />
            <div className="rounded-[14px] border overflow-hidden"
              style={{ background: '#14141f', borderColor: 'rgba(255,255,255,0.08)' }}>
              <ActionRow
                icon={UserCheck}
                label="Manual Check-In"
                sub="Mark this guest as arrived"
                accent="#f59e0b"
                loading={busy === 'checkin'}
                onClick={() => run('checkin', () => manualCheckIn(eventId, guestId), 'Checked in!')}
              />
            </div>
          </>
        )}

        {/* Details */}
        <SectionLabel label="DETAILS" />
        <div className="rounded-[14px] border overflow-hidden divide-y"
          style={{ background: '#14141f', borderColor: 'rgba(255,255,255,0.08)', divideColor: 'rgba(255,255,255,0.07)' }}>
          <DetailRow icon={Hash} label="Guest ID" value={guest.id.slice(0, 12) + '…'} />
          <DetailRow icon={Calendar} label="Added" value={new Date(guest.created_at).toLocaleDateString()} />
          {guest.group_id && <DetailRow icon={Layers} label="Group" value={guest.group_id.slice(0, 12) + '…'} />}
        </div>

        {/* Danger Zone */}
        <SectionLabel label="DANGER ZONE" />
        <div className="rounded-[14px] border overflow-hidden"
          style={{ background: '#14141f', borderColor: 'rgba(255,255,255,0.08)' }}>
          <ActionRow
            icon={Trash2}
            label="Remove Guest"
            sub="Permanently delete from this event"
            accent="#ef4444"
            danger
            onClick={handleDelete}
          />
        </div>
      </div>

      {/* Send Invite Modal */}
      <SendInviteModal
        open={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        onSend={handleSendInvite}
        guest={guest}
      />

      {/* Send QR Modal */}
      <SendQrModal
        open={showQrModal}
        onClose={() => setShowQrModal(false)}
        onSendEmail={() => run('qr', () => sendQrEmail(eventId, guestId), 'QR code sent by email!')}
        guest={guest}
      />
    </div>
  );
}
