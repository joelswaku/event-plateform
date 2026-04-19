import { DateTime } from "luxon";

/**
 * Convert local event time to UTC before saving
 */
export function convertEventTimeToUTC(date, timezone) {
  return DateTime
    .fromISO(date, { zone: timezone })
    .toUTC()
    .toISO();
}

/**
 * Convert stored UTC time back to event timezone
 */
export function convertUTCToEventTime(date, timezone) {

  if (!date) return null;

  const iso = typeof date === "string"
    ? date
    : new Date(date).toISOString();

  const dt = DateTime.fromISO(iso, { zone: "utc" }).setZone(timezone);

  if (!dt.isValid) {
    return null;
  }

  return dt.toISO();
}
