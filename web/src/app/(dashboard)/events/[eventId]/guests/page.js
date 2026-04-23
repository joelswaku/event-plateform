"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import toast from "react-hot-toast";
import {
  Plus, Pencil, Trash2, Users, QrCode, Mail,
  CheckSquare, Square, LogIn, X, ScanLine,
} from "lucide-react";
import { useGuestStore } from "@/store/guest.store";

const API = process.env.NEXT_PUBLIC_API_URL;

const emptyForm = {
  full_name: "", email: "", phone: "",
  plus_one_allowed: false, plus_one_count: 0, is_vip: false,
};

function rsvpBadge(status) {
  const v = String(status || "PENDING").toUpperCase();
  if (v === "GOING")    return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
  if (v === "MAYBE")    return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
  if (v === "DECLINED") return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
  return "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400";
}

function attendanceBadge(status) {
  if (!status || status === "NOT_MARKED") return null;
  if (status === "CHECKED_IN") return "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400";
  if (status === "PRESENT")    return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
  if (status === "ABSENT")     return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
  if (status === "LATE")       return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400";
  return "bg-gray-100 text-gray-500";
}

export default function GuestsPage() {
  const { eventId } = useParams();

  const {
    guests, rsvps, attendance, selectedGuestIds,
    getGuests, getRsvps, getAttendance,
    createGuest, updateGuest, deleteGuest,
    bulkDeleteGuests, bulkSendInvitations, bulkSubmitRsvp,
    sendGuestInvitation, generateQrPass, manualCheckIn,
    checkInGuestByQr,
    toggleGuestSelection, clearSelection, selectAllGuests,
    isLoading, isSubmitting,
  } = useGuestStore();

  const [showModal, setShowModal]     = useState(false);
  const [editingGuest, setEditingGuest] = useState(null);
  const [submitting, setSubmitting]   = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting]       = useState(false);
  const [form, setForm]               = useState(emptyForm);

  // QR viewer modal
  const [qrModal, setQrModal]         = useState(null); // { guest, qr_token }

  // QR scanner panel
  const [scanMode, setScanMode]       = useState(false);
  const [scanToken, setScanToken]     = useState("");
  const [scanning, setScanning]       = useState(false);

  useEffect(() => {
    if (!eventId) return;
    getGuests(eventId);
    getRsvps(eventId);
    getAttendance(eventId);
    clearSelection();
  }, [eventId, getGuests, getRsvps, getAttendance, clearSelection]);

  // Sync RSVP + attendance state every 20 seconds and on tab focus
  useEffect(() => {
    if (!eventId) return;
    const refresh = () => { getRsvps(eventId); getAttendance(eventId); };
    const interval = setInterval(refresh, 20000);
    const onVisibility = () => { if (document.visibilityState === "visible") refresh(); };
    document.addEventListener("visibilitychange", onVisibility);
    return () => { clearInterval(interval); document.removeEventListener("visibilitychange", onVisibility); };
  }, [eventId, getRsvps, getAttendance]);

  const rsvpMap = useMemo(() => {
    const m = new Map();
    (rsvps || []).forEach((r) => m.set(r.guest_id, r.rsvp_status));
    return m;
  }, [rsvps]);

  const attendanceMap = useMemo(() => {
    const m = new Map();
    (attendance || []).forEach((a) => m.set(a.guest_id, a.attendance_status));
    return m;
  }, [attendance]);

  const selectedCount = selectedGuestIds.length;
  const allSelected   = guests.length > 0 && selectedCount === guests.length;

  /* ── Modal helpers ── */
  const openCreateModal = () => { setEditingGuest(null); setForm(emptyForm); setShowModal(true); };
  const openEditModal   = (g) => {
    setEditingGuest(g);
    setForm({ full_name: g.full_name || "", email: g.email || "", phone: g.phone || "",
              plus_one_allowed: g.plus_one_allowed || false, plus_one_count: g.plus_one_count || 0, is_vip: g.is_vip || false });
    setShowModal(true);
  };
  const closeModal = () => { if (submitting) return; setShowModal(false); setEditingGuest(null); setForm(emptyForm); };
  const handleChange = (field, value) => setForm((p) => ({ ...p, [field]: value }));

  /* ── Submit guest ── */
  const handleSubmit = async () => {
    if (!form.full_name.trim()) { toast.error("Full name is required"); return; }
    if (!form.email.trim() && !form.phone.trim()) { toast.error("Email or phone is required"); return; }
    const payload = {
      full_name: form.full_name.trim(), email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      plus_one_allowed: Boolean(form.plus_one_allowed),
      plus_one_count: Number(form.plus_one_count || 0),
      is_vip: Boolean(form.is_vip),
    };
    try {
      setSubmitting(true);
      const res = editingGuest
        ? await updateGuest(eventId, editingGuest.id, payload)
        : await createGuest(eventId, payload);
      if (!res?.success) { toast.error(editingGuest ? "Update failed" : "Create failed"); return; }
      toast.success(editingGuest ? "Guest updated" : "Guest added");
      closeModal();
    } finally { setSubmitting(false); }
  };

  /* ── Delete ── */
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      const res = await deleteGuest(eventId, deleteTarget.id);
      if (res?.success) { toast.success("Guest deleted"); setDeleteTarget(null); }
      else toast.error("Delete failed");
    } finally { setDeleting(false); }
  };

  /* ── Single invite ── */
  const handleSingleInvite = async (guest) => {
    const channel = guest.email ? "EMAIL" : "SMS";
    const res = await sendGuestInvitation(eventId, guest.id, { channel });
    if (res?.success) toast.success(`Invitation sent to ${guest.full_name}`);
    else toast.error(res?.error || "Failed to send invitation");
  };

  /* ── Generate & show QR ── */
  const handleQr = async (guest) => {
    const res = await generateQrPass(eventId, guest.id);
    if (res?.success) {
      setQrModal({ guest, qr_token: res.data.qr_token });
    } else toast.error("Failed to generate QR");
  };

  /* ── Manual check-in ── */
  const handleManualCheckIn = async (guest) => {
    const res = await manualCheckIn(eventId, guest.id);
    if (res?.success) toast.success(`${guest.full_name} checked in ✓`);
    else toast.error(res?.error || "Check-in failed");
  };

  /* ── QR scanner check-in ── */
  const handleScanCheckIn = async () => {
    if (!scanToken.trim()) { toast.error("Enter a QR token"); return; }
    setScanning(true);
    const res = await checkInGuestByQr(eventId, { qr_token: scanToken.trim() });
    setScanning(false);
    if (res?.success) {
      toast.success(`${res.data.guest?.full_name || "Guest"} checked in ✓`);
      setScanToken("");
    } else toast.error(res?.error || "Check-in failed");
  };

  /* ── Bulk actions ── */
  const handleBulkDelete  = async () => { const r = await bulkDeleteGuests(eventId, selectedGuestIds); r?.success ? toast.success("Deleted") : toast.error("Bulk delete failed"); };
  const handleBulkInvite  = async () => { const r = await bulkSendInvitations(eventId, selectedGuestIds, { channel: "EMAIL" }); r?.success ? toast.success("Invitations sent") : toast.error("Bulk invite failed"); };
  const handleBulkRsvp    = async (status) => { const r = await bulkSubmitRsvp(eventId, selectedGuestIds, status); r?.success ? toast.success(`RSVP → ${status}`) : toast.error("Bulk RSVP failed"); };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col justify-between gap-4 rounded-3xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 md:flex-row md:items-center">
        <div className="flex items-start gap-3">
          <div className="rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 p-3">
            <Users className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">Guests</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Manage attendees, invitations, RSVP, and check-in.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setScanMode((v) => !v)}
            className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 dark:border-gray-700 px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <ScanLine className="h-4 w-4" /> Scan QR
          </button>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 rounded-2xl bg-gray-900 dark:bg-white dark:text-gray-900 px-4 py-3 text-sm font-medium text-white hover:opacity-90"
          >
            <Plus className="h-4 w-4" /> Add Guest
          </button>
        </div>
      </div>

      {/* QR Scanner panel */}
      {scanMode && (
        <div className="rounded-3xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/30 p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <ScanLine className="h-5 w-5 text-indigo-500 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-indigo-900 dark:text-indigo-200 mb-2">Enter or paste QR token to check in a guest</p>
            <div className="flex gap-2">
              <input
                value={scanToken}
                onChange={(e) => setScanToken(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleScanCheckIn()}
                placeholder="Paste QR token here…"
                className="flex-1 border border-indigo-200 dark:border-indigo-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
              />
              <button
                onClick={handleScanCheckIn}
                disabled={scanning}
                className="rounded-xl bg-indigo-600 text-white px-4 py-2 text-sm font-medium hover:bg-indigo-700 disabled:opacity-60"
              >
                {scanning ? "Checking…" : "Check In"}
              </button>
            </div>
          </div>
          <button onClick={() => setScanMode(false)} className="text-indigo-400 hover:text-indigo-600">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Bulk action bar */}
      {selectedCount > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-3xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{selectedCount} selected</span>
          <button onClick={() => handleBulkRsvp("GOING")}    disabled={isSubmitting} className="rounded-2xl bg-green-100 dark:bg-green-900/30 px-3 py-2 text-sm text-green-700 dark:text-green-400 disabled:opacity-50">Mark Going</button>
          <button onClick={() => handleBulkRsvp("DECLINED")} disabled={isSubmitting} className="rounded-2xl bg-red-100 dark:bg-red-900/30 px-3 py-2 text-sm text-red-700 dark:text-red-400 disabled:opacity-50">Mark Declined</button>
          <button onClick={handleBulkInvite}                 disabled={isSubmitting} className="rounded-2xl bg-blue-100 dark:bg-blue-900/30 px-3 py-2 text-sm text-blue-700 dark:text-blue-400 disabled:opacity-50">Send Invite</button>
          <button onClick={handleBulkDelete}                 disabled={isSubmitting} className="rounded-2xl bg-gray-100 dark:bg-gray-700 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 disabled:opacity-50">Delete</button>
          <button onClick={clearSelection} className="rounded-2xl px-3 py-2 text-sm text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800">Clear</button>
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-3xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-300 text-sm">
            <thead className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
              <tr className="text-left text-gray-500 dark:text-gray-400">
                <th className="px-5 py-4 font-medium w-10">
                  <button onClick={allSelected ? clearSelection : selectAllGuests} className="inline-flex items-center justify-center">
                    {allSelected ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                  </button>
                </th>
                <th className="px-5 py-4 font-medium">Guest</th>
                <th className="px-5 py-4 font-medium">Email / Phone</th>
                <th className="px-5 py-4 font-medium">VIP</th>
                <th className="px-5 py-4 font-medium">RSVP</th>
                <th className="px-5 py-4 font-medium">Attendance</th>
                <th className="px-5 py-4 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan="7" className="px-5 py-12 text-center text-gray-400">Loading guests…</td></tr>
              ) : guests.length === 0 ? (
                <tr><td colSpan="7" className="px-5 py-12 text-center text-gray-400">No guests yet — add your first guest above.</td></tr>
              ) : (
                guests.map((guest) => {
                  const rsvp       = rsvpMap.get(guest.id) || "PENDING";
                  const attendance = attendanceMap.get(guest.id) || "NOT_MARKED";
                  const selected   = selectedGuestIds.includes(guest.id);
                  const checkedIn  = attendance === "CHECKED_IN" || attendance === "PRESENT";

                  return (
                    <tr key={guest.id} className="border-b border-gray-50 dark:border-gray-800 last:border-b-0 hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
                      <td className="px-5 py-4">
                        <button onClick={() => toggleGuestSelection(guest.id)} className="inline-flex items-center justify-center">
                          {selected ? <CheckSquare className="h-4 w-4 text-indigo-600" /> : <Square className="h-4 w-4 text-gray-400" />}
                        </button>
                      </td>

                      <td className="px-5 py-4">
                        <div className="font-medium text-gray-900 dark:text-gray-100">{guest.full_name}</div>
                        {guest.plus_one_allowed && (
                          <div className="text-xs text-gray-400 mt-0.5">+{guest.plus_one_count ?? 0} guest{guest.plus_one_count !== 1 ? "s" : ""}</div>
                        )}
                      </td>

                      <td className="px-5 py-4 text-gray-500 dark:text-gray-400">
                        <div>{guest.email || "—"}</div>
                        {guest.phone && <div className="text-xs text-gray-400">{guest.phone}</div>}
                      </td>

                      <td className="px-5 py-4">
                        {guest.is_vip
                          ? <span className="rounded-full bg-amber-100 dark:bg-amber-900/30 px-2.5 py-1 text-xs font-medium text-amber-700 dark:text-amber-400">⭐ VIP</span>
                          : <span className="text-gray-400">—</span>}
                      </td>

                      <td className="px-5 py-4">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${rsvpBadge(rsvp)}`}>
                          {rsvp === "GOING" ? "✓ Going" : rsvp === "DECLINED" ? "✗ Declined" : rsvp === "MAYBE" ? "? Maybe" : "Pending"}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        {attendanceBadge(attendance)
                          ? <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${attendanceBadge(attendance)}`}>{attendance.replace("_", " ")}</span>
                          : <span className="text-gray-400 text-xs">—</span>}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-1.5 flex-wrap">
                          {/* Check-in */}
                          <button
                            onClick={() => handleManualCheckIn(guest)}
                            disabled={checkedIn}
                            title={checkedIn ? "Already checked in" : "Check in"}
                            className={`inline-flex items-center gap-1 rounded-xl border px-2.5 py-1.5 text-xs font-medium transition
                              ${checkedIn
                                ? "border-green-200 bg-green-50 text-green-600 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400 cursor-default"
                                : "border-indigo-200 dark:border-indigo-700 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"}`}
                          >
                            <LogIn className="h-3.5 w-3.5" />
                            {checkedIn ? "In" : "Check In"}
                          </button>

                          {/* Invite */}
                          <button
                            onClick={() => handleSingleInvite(guest)}
                            disabled={!guest.email && !guest.phone}
                            className="inline-flex items-center gap-1 rounded-xl border border-gray-200 dark:border-gray-700 px-2.5 py-1.5 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40"
                          >
                            <Mail className="h-3.5 w-3.5" /> Invite
                          </button>

                          {/* QR */}
                          <button
                            onClick={() => handleQr(guest)}
                            className="inline-flex items-center gap-1 rounded-xl border border-gray-200 dark:border-gray-700 px-2.5 py-1.5 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                          >
                            <QrCode className="h-3.5 w-3.5" /> QR
                          </button>

                          {/* Edit */}
                          <button
                            onClick={() => openEditModal(guest)}
                            className="inline-flex items-center gap-1 rounded-xl border border-gray-200 dark:border-gray-700 px-2.5 py-1.5 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                          >
                            <Pencil className="h-3.5 w-3.5" /> Edit
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => setDeleteTarget(guest)}
                            className="inline-flex items-center gap-1 rounded-xl border border-red-200 dark:border-red-800 px-2.5 py-1.5 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{editingGuest ? "Edit Guest" : "Add Guest"}</h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{editingGuest ? "Update guest information." : "Add a new guest and optionally send an invitation."}</p>
              </div>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            </div>

            <div className="space-y-4">
              {[["Full name *", "full_name", "text", "John Doe"], ["Email", "email", "email", "john@example.com"], ["Phone", "phone", "text", "+1 555 123 4567"]].map(([label, field, type, ph]) => (
                <div key={field}>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
                  <input
                    type={type} value={form[field]} placeholder={ph}
                    onChange={(e) => handleChange(field, e.target.value)}
                    className="w-full rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-4 py-3 text-sm outline-none focus:border-indigo-500"
                  />
                </div>
              ))}

              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                  <input type="checkbox" checked={form.is_vip} onChange={(e) => handleChange("is_vip", e.target.checked)} className="accent-indigo-500" />
                  VIP guest
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                  <input type="checkbox" checked={form.plus_one_allowed} onChange={(e) => handleChange("plus_one_allowed", e.target.checked)} className="accent-indigo-500" />
                  Allow +1
                </label>
              </div>

              {form.plus_one_allowed && (
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Number of companions allowed</label>
                  <input
                    type="number" min="0" value={form.plus_one_count}
                    onChange={(e) => handleChange("plus_one_count", Number(e.target.value || 0))}
                    className="w-full rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-4 py-3 text-sm outline-none focus:border-indigo-500"
                  />
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button onClick={closeModal} disabled={submitting} className="rounded-2xl px-4 py-2.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50">Cancel</button>
              <button onClick={handleSubmit} disabled={submitting} className="rounded-2xl bg-gray-900 dark:bg-white dark:text-gray-900 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50">
                {submitting ? (editingGuest ? "Updating…" : "Adding…") : editingGuest ? "Update Guest" : "Add Guest"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR viewer modal */}
      {qrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4" onClick={() => setQrModal(null)}>
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-8 max-w-sm w-full text-center" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">QR Pass — {qrModal.guest.full_name}</h3>
              <button onClick={() => setQrModal(null)} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            </div>
            {/* Render QR via Google Chart API — no extra npm package needed */}
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(qrModal.qr_token)}`}
              alt="QR Code"
              className="mx-auto rounded-xl border border-gray-100 dark:border-gray-700"
              width={220}
              height={220}
            />
            <p className="mt-4 text-xs text-gray-400 break-all">{qrModal.qr_token}</p>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">Present this QR at the entrance for check-in.</p>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-6 shadow-2xl">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Delete guest</h2>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Are you sure you want to remove <span className="font-medium text-gray-900 dark:text-gray-100">{deleteTarget.full_name}</span>? This cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setDeleteTarget(null)} disabled={deleting} className="rounded-2xl px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">Cancel</button>
              <button onClick={confirmDelete} disabled={deleting} className="rounded-2xl bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700 disabled:opacity-50">
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
