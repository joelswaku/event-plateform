
"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import toast from "react-hot-toast";
import {
  Plus,
  Pencil,
  Trash2,
  Users,
  QrCode,
  Mail,
  CheckSquare,
  Square,
} from "lucide-react";
import { useGuestStore } from "@/store/guest.store";

const emptyForm = {
  full_name: "",
  email: "",
  phone: "",
  plus_one_allowed: false,
  plus_one_count: 0,
  is_vip: false,
};

function rsvpBadge(status) {
  const value = String(status || "PENDING").toUpperCase();

  if (value === "GOING") {
    return "bg-green-100 text-green-700";
  }
  if (value === "MAYBE") {
    return "bg-yellow-100 text-yellow-700";
  }
  if (value === "DECLINED") {
    return "bg-red-100 text-red-700";
  }
  return "bg-gray-100 text-gray-600";
}

export default function GuestsPage() {
  const { eventId } = useParams();

  const {
    guests,
    rsvps,
    selectedGuestIds,
    getGuests,
    getRsvps,
    createGuest,
    updateGuest,
    deleteGuest,
    bulkDeleteGuests,
    bulkSendInvitations,
    bulkSubmitRsvp,
    sendGuestInvitation,
    generateQrPass,
    toggleGuestSelection,
    clearSelection,
    selectAllGuests,
    isLoading,
    isSubmitting,
  } = useGuestStore();

  const [showModal, setShowModal] = useState(false);
  const [editingGuest, setEditingGuest] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (!eventId) return;
    getGuests(eventId);
    getRsvps(eventId);
    clearSelection();
  }, [eventId, getGuests, getRsvps, clearSelection]);

  const rsvpMap = useMemo(() => {
    const map = new Map();
    (rsvps || []).forEach((item) => {
      map.set(item.guest_id, item.rsvp_status);
    });
    return map;
  }, [rsvps]);

  const selectedCount = selectedGuestIds.length;
  const allSelected = guests.length > 0 && selectedCount === guests.length;

  const openCreateModal = () => {
    setEditingGuest(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEditModal = (guest) => {
    setEditingGuest(guest);
    setForm({
      full_name: guest.full_name || "",
      email: guest.email || "",
      phone: guest.phone || "",
      plus_one_allowed: guest.plus_one_allowed || false,
      plus_one_count: guest.plus_one_count || 0,
      is_vip: guest.is_vip || false,
    });
    setShowModal(true);
  };

  const closeModal = () => {
    if (submitting) return;
    setShowModal(false);
    setEditingGuest(null);
    setForm(emptyForm);
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async () => {
    if (!form.full_name.trim()) {
      toast.error("Full name is required");
      return;
    }

    if (!form.email.trim() && !form.phone.trim()) {
      toast.error("Email or phone is required");
      return;
    }

    const payload = {
      full_name: form.full_name.trim(),
      email: form.email.trim() || null,
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

      if (!res?.success) {
        toast.error(editingGuest ? "Failed to update guest" : "Failed to create guest");
        return;
      }

      toast.success(editingGuest ? "Guest updated" : "Guest created");
      closeModal();
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDeleteGuest = async () => {
    if (!deleteTarget) return;

    try {
      setDeleting(true);

      const res = await deleteGuest(eventId, deleteTarget.id);

      if (res?.success) {
        toast.success("Guest deleted");
        setDeleteTarget(null);
      } else {
        toast.error("Failed to delete guest");
      }
    } finally {
      setDeleting(false);
    }
  };

  const handleSingleInvite = async (guest) => {
    const res = await sendGuestInvitation(eventId, guest.id, {
      channel: guest.phone ? "SMS" : "EMAIL",
    });

    if (res?.success) {
      toast.success(`Invitation sent to ${guest.full_name}`);
    } else {
      toast.error("Failed to send invitation");
    }
  };

  const handleSingleQr = async (guest) => {
    const res = await generateQrPass(eventId, guest.id);

    if (res?.success) {
      toast.success(`QR generated for ${guest.full_name}`);
    } else {
      toast.error("Failed to generate QR");
    }
  };

  const handleQuickRsvp = async (guestId, rsvpStatus) => {
    const res = await bulkSubmitRsvp(eventId, [guestId], rsvpStatus);

    if (res?.success) {
      toast.success(`RSVP updated to ${rsvpStatus}`);
    } else {
      toast.error("Failed to update RSVP");
    }
  };

  const handleBulkDelete = async () => {
    if (!selectedCount) return;

    const res = await bulkDeleteGuests(eventId, selectedGuestIds);

    if (res?.success) {
      toast.success("Selected guests deleted");
    } else {
      toast.error("Bulk delete failed");
    }
  };

  const handleBulkInvite = async () => {
    if (!selectedCount) return;

    const res = await bulkSendInvitations(eventId, selectedGuestIds, {
      channel: "EMAIL",
    });

    if (res?.success) {
      toast.success("Invitations sent");
    } else {
      toast.error("Bulk invitation failed");
    }
  };

  const handleBulkRsvp = async (status) => {
    if (!selectedCount) return;

    const res = await bulkSubmitRsvp(eventId, selectedGuestIds, status);

    if (res?.success) {
      toast.success(`RSVP updated to ${status}`);
    } else {
      toast.error("Bulk RSVP failed");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 rounded-3xl border border-[#e5e7eb] bg-white p-6 md:flex-row md:items-center">
        <div className="flex items-start gap-3">
          <div className="rounded-2xl bg-[#eef2ff] p-3">
            <Users className="h-5 w-5 text-[#4f46e5]" />
          </div>

          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Guests</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage attendees, invitations, RSVP, and QR passes for this event.
            </p>
          </div>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 rounded-2xl bg-[#111827] px-4 py-3 text-sm font-medium text-white hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          Add Guest
        </button>
      </div>

      {selectedCount > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-3xl border border-[#e5e7eb] bg-white p-4">
          <span className="text-sm font-medium">
            {selectedCount} selected
          </span>

          <button
            onClick={() => handleBulkRsvp("GOING")}
            disabled={isSubmitting}
            className="rounded-2xl bg-green-100 px-3 py-2 text-sm text-green-700 disabled:opacity-50"
          >
            Mark Going
          </button>

          <button
            onClick={() => handleBulkRsvp("DECLINED")}
            disabled={isSubmitting}
            className="rounded-2xl bg-red-100 px-3 py-2 text-sm text-red-700 disabled:opacity-50"
          >
            Mark Declined
          </button>

          <button
            onClick={handleBulkInvite}
            disabled={isSubmitting}
            className="rounded-2xl bg-blue-100 px-3 py-2 text-sm text-blue-700 disabled:opacity-50"
          >
            Send Invite
          </button>

          <button
            onClick={handleBulkDelete}
            disabled={isSubmitting}
            className="rounded-2xl bg-gray-100 px-3 py-2 text-sm text-gray-700 disabled:opacity-50"
          >
            Delete Selected
          </button>

          <button
            onClick={clearSelection}
            className="rounded-2xl px-3 py-2 text-sm text-gray-500 hover:bg-gray-100"
          >
            Clear
          </button>
        </div>
      )}

      <div className="overflow-hidden rounded-3xl border border-[#e5e7eb] bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-sm">
            <thead className="border-b border-[#e5e7eb] bg-[#f9fafb]">
              <tr className="text-left text-gray-600">
                <th className="px-5 py-4 font-medium">
                  <button
                    onClick={allSelected ? clearSelection : selectAllGuests}
                    className="inline-flex items-center justify-center"
                  >
                    {allSelected ? (
                      <CheckSquare className="h-4 w-4" />
                    ) : (
                      <Square className="h-4 w-4" />
                    )}
                  </button>
                </th>
                <th className="px-5 py-4 font-medium">Guest</th>
                <th className="px-5 py-4 font-medium">Email</th>
                <th className="px-5 py-4 font-medium">Phone</th>
                <th className="px-5 py-4 font-medium">VIP</th>
                <th className="px-5 py-4 font-medium">RSVP</th>
                <th className="px-5 py-4 text-right font-medium">Actions</th>
              </tr>
            </thead>

            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="7" className="px-5 py-10 text-center text-gray-500">
                    Loading guests...
                  </td>
                </tr>
              ) : guests.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-5 py-10 text-center text-gray-500">
                    No guests yet
                  </td>
                </tr>
              ) : (
                guests.map((guest) => {
                  const guestRsvp = rsvpMap.get(guest.id) || "PENDING";
                  const selected = selectedGuestIds.includes(guest.id);

                  return (
                    <tr
                      key={guest.id}
                      className="border-b border-[#f3f4f6] last:border-b-0 hover:bg-[#fafafa]"
                    >
                      <td className="px-5 py-4">
                        <button
                          onClick={() => toggleGuestSelection(guest.id)}
                          className="inline-flex items-center justify-center"
                        >
                          {selected ? (
                            <CheckSquare className="h-4 w-4" />
                          ) : (
                            <Square className="h-4 w-4" />
                          )}
                        </button>
                      </td>

                      <td className="px-5 py-4">
                        <div className="font-medium text-[#111827]">{guest.full_name}</div>
                      </td>

                      <td className="px-5 py-4 text-gray-600">{guest.email || "—"}</td>

                      <td className="px-5 py-4 text-gray-600">{guest.phone || "—"}</td>

                      <td className="px-5 py-4">
                        {guest.is_vip ? (
                          <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700">
                            VIP
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${rsvpBadge(
                            guestRsvp
                          )}`}
                        >
                          {guestRsvp}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleQuickRsvp(guest.id, "GOING")}
                            className="rounded-xl border px-3 py-2 text-xs text-green-700 hover:bg-green-50"
                          >
                            Going
                          </button>

                          <button
                            onClick={() => handleQuickRsvp(guest.id, "DECLINED")}
                            className="rounded-xl border px-3 py-2 text-xs text-red-700 hover:bg-red-50"
                          >
                            Decline
                          </button>

                          <button
                            onClick={() => handleSingleInvite(guest)}
                            className="inline-flex items-center gap-1 rounded-xl border border-[#e5e7eb] px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          >
                            <Mail className="h-4 w-4" />
                            Invite
                          </button>

                          <button
                            onClick={() => handleSingleQr(guest)}
                            className="inline-flex items-center gap-1 rounded-xl border border-[#e5e7eb] px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          >
                            <QrCode className="h-4 w-4" />
                            QR
                          </button>

                          <button
                            onClick={() => openEditModal(guest)}
                            className="inline-flex items-center gap-1 rounded-xl border border-[#e5e7eb] px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          >
                            <Pencil className="h-4 w-4" />
                            Edit
                          </button>

                          <button
                            onClick={() => setDeleteTarget(guest)}
                            className="inline-flex items-center gap-1 rounded-xl border border-red-200 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
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

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <div className="mb-5">
              <h2 className="text-lg font-semibold">
                {editingGuest ? "Edit Guest" : "Add Guest"}
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                {editingGuest
                  ? "Update guest information."
                  : "Create a new guest for this event."}
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium">Full name</label>
                <input
                  type="text"
                  value={form.full_name}
                  onChange={(e) => handleChange("full_name", e.target.value)}
                  placeholder="John Doe"
                  className="w-full rounded-2xl border border-[#d1d5db] px-4 py-3 outline-none focus:border-[#111827]"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  placeholder="john@email.com"
                  className="w-full rounded-2xl border border-[#d1d5db] px-4 py-3 outline-none focus:border-[#111827]"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">Phone</label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  placeholder="+1 555 123 4567"
                  className="w-full rounded-2xl border border-[#d1d5db] px-4 py-3 outline-none focus:border-[#111827]"
                />
              </div>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.is_vip}
                  onChange={(e) => handleChange("is_vip", e.target.checked)}
                />
                VIP guest
              </label>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.plus_one_allowed}
                  onChange={(e) => handleChange("plus_one_allowed", e.target.checked)}
                />
                Allow plus one
              </label>

              {form.plus_one_allowed && (
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Plus one count
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={form.plus_one_count}
                    onChange={(e) =>
                      handleChange("plus_one_count", Number(e.target.value || 0))
                    }
                    className="w-full rounded-2xl border border-[#d1d5db] px-4 py-3 outline-none focus:border-[#111827]"
                  />
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={closeModal}
                disabled={submitting}
                className="rounded-2xl px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="rounded-2xl bg-[#111827] px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
              >
                {submitting
                  ? editingGuest
                    ? "Updating..."
                    : "Creating..."
                  : editingGuest
                  ? "Update Guest"
                  : "Create Guest"}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <h2 className="text-lg font-semibold">Delete guest</h2>

            <p className="mt-2 text-sm text-gray-500">
              Are you sure you want to delete{" "}
              <span className="font-medium text-black">
                {deleteTarget.full_name}
              </span>
              ? This action cannot be undone.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="rounded-2xl px-4 py-2 text-sm text-gray-600 hover:bg-gray-100"
              >
                Cancel
              </button>

              <button
                onClick={confirmDeleteGuest}
                disabled={deleting}
                className="rounded-2xl bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}