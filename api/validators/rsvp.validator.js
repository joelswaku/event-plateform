import { RSVP_STATUS, ATTENDANCE_STATUS } from "../utils/enums.js";
import { AppError } from "../utils/errors.js";

export function validateRsvpPayload(payload) {
  if (!payload.guest_id) {
    throw new AppError("guest_id is required", 400);
  }

  if (!Object.values(RSVP_STATUS).includes(payload.rsvp_status)) {
    throw new AppError("Invalid RSVP status", 400);
  }
}

export function validateAttendancePayload(payload) {
  if (!payload.guest_id) {
    throw new AppError("guest_id is required", 400);
  }

  if (!Object.values(ATTENDANCE_STATUS).includes(payload.attendance_status)) {
    throw new AppError("Invalid attendance status", 400);
  }
}