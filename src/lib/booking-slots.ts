export type RoomSlot = {
  label: string;
  duration: string;
  // Start/end as "HH:MM" (24h). Present on dynamic (per-room) slots and on the
  // presets below; used to auto-generate labels and detect overlaps.
  start?: string;
  end?: string;
  isOvernight?: boolean;
};

export type BookingDateRange = {
  from: string;
  to: string;
};

const ROOM_SLOT_PRESETS: Record<string, RoomSlot[]> = {
  Honey: [
    { label: "9:00 - 12:00", duration: "3T", start: "09:00", end: "12:00" },
    { label: "12:30 - 15:30", duration: "3T", start: "12:30", end: "15:30" },
    { label: "16:00 - 19:00", duration: "3T", start: "16:00", end: "19:00" },
    { label: "19:30 - 8:20", duration: "12T 50", start: "19:30", end: "08:20", isOvernight: true },
  ],
  Squid: [
    { label: "9:30 - 12:30", duration: "3T", start: "09:30", end: "12:30" },
    { label: "13:00 - 16:00", duration: "3T", start: "13:00", end: "16:00" },
    { label: "16:30 - 19:30", duration: "3T", start: "16:30", end: "19:30" },
    { label: "20:00 - 8:50", duration: "12T 50", start: "20:00", end: "08:50", isOvernight: true },
  ],
  default: [
    { label: "9:00 - 12:00", duration: "3T", start: "09:00", end: "12:00" },
    { label: "12:30 - 15:30", duration: "3T", start: "12:30", end: "15:30" },
    { label: "16:00 - 19:00", duration: "3T", start: "16:00", end: "19:00" },
    { label: "19:30 - 8:20", duration: "12T 50", start: "19:30", end: "08:20", isOvernight: true },
  ],
};

/** Preset slots chosen by room name — the fallback for rooms without custom slots. */
export function getPresetSlots(roomName: string): RoomSlot[] {
  if (roomName.includes("Honey")) return ROOM_SLOT_PRESETS.Honey;
  if (roomName.includes("Squid")) return ROOM_SLOT_PRESETS.Squid;
  return ROOM_SLOT_PRESETS.default;
}

/**
 * Resolve the slots for a room. When the room has custom `time_slots` stored,
 * those win; otherwise fall back to the name-based presets so pre-existing
 * rooms (and their booking slotIndex references) keep working unchanged.
 */
export function getRoomSlots(roomName: string, storedSlots?: RoomSlot[] | null): RoomSlot[] {
  if (storedSlots && storedSlots.length > 0) return storedSlots;
  return getPresetSlots(roomName);
}

/** Parse "HH:MM" into minutes from midnight, or null if malformed. */
export function timeToMinutes(value: string | null | undefined): number | null {
  if (!value) return null;
  const match = value.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const h = Number(match[1]);
  const m = Number(match[2]);
  if (h < 0 || h > 23 || m < 0 || m > 59) return null;
  return h * 60 + m;
}

/** A slot is overnight when its end time is at or before its start time (wraps past midnight). */
export function isOvernightRange(start: string, end: string): boolean {
  const s = timeToMinutes(start);
  const e = timeToMinutes(end);
  if (s === null || e === null) return false;
  return e <= s;
}

/** Auto-generate the display label from start/end (e.g. "9:00 - 12:00"). */
export function makeSlotLabel(start: string, end: string): string {
  const strip = (t: string) => t.replace(/^0(\d):/, "$1:");
  return `${strip(start)} - ${strip(end)}`;
}

/** Auto-generate the Vietnamese duration string, e.g. "3T" or "12T 50". */
export function computeDuration(start: string, end: string): string {
  const s = timeToMinutes(start);
  let e = timeToMinutes(end);
  if (s === null || e === null) return "";
  if (e <= s) e += 24 * 60; // overnight wrap
  const total = e - s;
  const hours = Math.floor(total / 60);
  const mins = total % 60;
  return mins > 0 ? `${hours}T ${mins}` : `${hours}T`;
}

/** Build a fully-derived slot from raw start/end input. */
export function makeSlot(start: string, end: string): RoomSlot {
  return {
    start,
    end,
    label: makeSlotLabel(start, end),
    duration: computeDuration(start, end),
    isOvernight: isOvernightRange(start, end),
  };
}

/** Break a slot into linear minute intervals on a 0..1440 axis (overnight splits in two). */
function slotIntervals(slot: RoomSlot): Array<[number, number]> {
  const s = timeToMinutes(slot.start);
  const e = timeToMinutes(slot.end);
  if (s === null || e === null) return [];
  if (e > s) return [[s, e]];
  // Overnight: [start, midnight] plus [midnight, end]
  const parts: Array<[number, number]> = [];
  if (s < 1440) parts.push([s, 1440]);
  if (e > 0) parts.push([0, e]);
  return parts;
}

function intervalsIntersect(a: [number, number], b: [number, number]): boolean {
  return a[0] < b[1] && b[0] < a[1];
}

/**
 * Find every pair of slots whose times overlap. Returns pairs of indexes,
 * e.g. [[0, 2]] means slot 0 and slot 2 conflict.
 */
export function findSlotOverlaps(slots: RoomSlot[]): Array<[number, number]> {
  const conflicts: Array<[number, number]> = [];
  for (let i = 0; i < slots.length; i++) {
    for (let j = i + 1; j < slots.length; j++) {
      const a = slotIntervals(slots[i]);
      const b = slotIntervals(slots[j]);
      const overlap = a.some((ia) => b.some((ib) => intervalsIntersect(ia, ib)));
      if (overlap) conflicts.push([i, j]);
    }
  }
  return conflicts;
}

export function makeBookingDates(total = 9) {
  return makeBookingDatesFromOffset(0, total);
}

export function makeBookingDatesFromOffset(startOffsetDays = 0, total = 9) {
  const weekdays = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
  // Base the calendar on Vietnam's local date, not the device/UTC date: shift the
  // epoch by +7h and read it with UTC getters so "Hôm nay" is correct even at 2am
  // (when toISOString() would still report the previous UTC day).
  const base = Date.now() + VN_UTC_OFFSET_MINUTES * 60_000;

  return Array.from({ length: total }, (_, index) => {
    const date = new Date(base);
    date.setUTCDate(date.getUTCDate() + startOffsetDays + index);
    const day = String(date.getUTCDate()).padStart(2, "0");
    const month = String(date.getUTCMonth() + 1).padStart(2, "0");

    return {
      iso: `${date.getUTCFullYear()}-${month}-${day}`,
      label: index === 0 ? "Hôm nay" : weekdays[date.getUTCDay()],
      dateLabel: `${day}-${month}`,
    };
  });
}

function makeVietnamLocalDate(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function dateToIso(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getTodayIso() {
  return makeBookingDatesFromOffset(0, 1)[0].iso;
}

export function addDaysToIso(iso: string, days: number) {
  const date = makeVietnamLocalDate(iso);
  date.setDate(date.getDate() + days);
  return dateToIso(date);
}

export function makeDefaultBookingDateRange(totalDays = 7): BookingDateRange {
  const from = getTodayIso();
  return {
    from,
    to: addDaysToIso(from, Math.max(totalDays - 1, 0)),
  };
}

export function makeBookingDatesFromRange(range: BookingDateRange, maxDays = 31) {
  const from = normalizeDateLabelToIso(range.from) ?? getTodayIso();
  const to = normalizeDateLabelToIso(range.to) ?? from;
  const start = makeVietnamLocalDate(from);
  const end = makeVietnamLocalDate(to);
  if (end < start) {
    return makeBookingDatesFromRange({ from: to, to: from }, maxDays);
  }

  const diffDays = Math.floor((end.getTime() - start.getTime()) / 86_400_000);
  return makeBookingDatesFromOffset(daysBetween(getTodayIso(), from), Math.min(diffDays + 1, maxDays));
}

function daysBetween(fromIso: string, toIso: string) {
  const from = makeVietnamLocalDate(fromIso);
  const to = makeVietnamLocalDate(toIso);
  return Math.floor((to.getTime() - from.getTime()) / 86_400_000);
}

export function isSlotPast(dayIndex: number, slotLabel: string): boolean {
  if (dayIndex !== 0) return false;

  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const startTime = slotLabel.split(" - ")[0];
  if (!startTime) return false;

  const [h, m] = startTime.split(":").map(Number);
  const slotStart = h * 60 + (m || 0);

  return nowMinutes > slotStart;
}

export function formatCheckoutDate(iso: string) {
  const [year, month, day] = iso.split("-");
  return `${day}/${month}/${year}`;
}

export function normalizeDateLabelToIso(value: string | null | undefined): string | null {
  if (!value) return null;

  const trimmed = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;

  const ddmmyyyy = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (ddmmyyyy) {
    const [, day, month, year] = ddmmyyyy;
    return `${year}-${month}-${day}`;
  }

  return null;
}

export function formatDateLabelFromIso(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const normalized = normalizeDateLabelToIso(iso);
  if (!normalized) return null;

  const [year, month, day] = normalized.split("-");
  return `${day}/${month}/${year}`;
}

export function slotDisplayLabel(slot: RoomSlot) {
  return `${slot.label} (${slot.duration})`;
}

export function buildTimeslotId(roomId: number, dateIso: string, slotIndex: number) {
  return `${roomId}-${dateIso}-${slotIndex}`;
}

export function parseTimeslotIds(value: string | null | undefined): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export function stringifyTimeslotIds(value: string[]) {
  return value.join(",");
}

export function parseTimeslotId(value: string) {
  const match = value.trim().match(/^(\d+)-(\d{4}-\d{2}-\d{2})-(\d+)$/);
  if (!match) {
    return {
      roomId: null,
      dateIso: null,
      slotIndex: null,
    };
  }

  return {
    roomId: Number(match[1]),
    dateIso: match[2],
    slotIndex: Number(match[3]),
  };
}

/** Vietnam has no daylight-saving; bookings are always in local time (UTC+7). */
const VN_UTC_OFFSET_MINUTES = 7 * 60;

/** UTC epoch (ms) for a Vietnam-local wall time, with an optional overnight day offset. */
function vnSlotEpoch(dateIso: string, minutesFromMidnight: number, dayOffset: number): number | null {
  const [y, m, d] = dateIso.split("-").map(Number);
  if (!y || !m || !d) return null;
  const midnightUtc = Date.UTC(y, m - 1, d) - VN_UTC_OFFSET_MINUTES * 60_000;
  return midnightUtc + (dayOffset * 24 * 60 + minutesFromMidnight) * 60_000;
}

/**
 * Whether a slot's START time (on its date, Vietnam time) is already in the past.
 * Used to stop customers picking a slot that has already begun — independent of
 * the device's clock/timezone. Returns false when the start time can't be parsed.
 */
export function isSlotStartPast(
  dateIso: string,
  slot: RoomSlot,
  now: number = Date.now()
): boolean {
  const startMin = timeToMinutes(slot.start);
  if (startMin === null) return false;
  const startEpoch = vnSlotEpoch(dateIso, startMin, 0);
  if (startEpoch === null) return false;
  return now >= startEpoch;
}

/** {@link isSlotStartPast} but reads the start time from a display label like "9:00 - 12:00". */
export function isSlotLabelStartPast(
  dateIso: string,
  slotLabel: string,
  now: number = Date.now()
): boolean {
  const start = slotLabel.split(" - ")[0]?.trim();
  const startMin = timeToMinutes(start);
  if (startMin === null) return false;
  const startEpoch = vnSlotEpoch(dateIso, startMin, 0);
  if (startEpoch === null) return false;
  return now >= startEpoch;
}

/** {@link isSlotStartPast} resolved from a timeslot id + the room's slots list. */
export function isTimeslotStartPast(
  timeslotId: string,
  slots: RoomSlot[],
  now: number = Date.now()
): boolean {
  const { dateIso, slotIndex } = parseTimeslotId(timeslotId);
  if (dateIso === null || slotIndex === null) return false;
  const slot = slots[slotIndex];
  if (!slot) return false;
  return isSlotStartPast(dateIso, slot, now);
}

/**
 * Whether a timeslot's end time has already passed, i.e. the stay is over and the
 * slot is free again. Overnight slots (end <= start) end on the following day.
 * All times are interpreted in Vietnam local time (UTC+7) regardless of server TZ.
 * Returns false when the slot/time can't be resolved (fail safe: keep it blocked).
 */
export function isTimeslotEnded(
  timeslotId: string,
  slots: RoomSlot[],
  now: number = Date.now()
): boolean {
  const { dateIso, slotIndex } = parseTimeslotId(timeslotId);
  if (dateIso === null || slotIndex === null) return false;
  const slot = slots[slotIndex];
  if (!slot) return false;
  const startMin = timeToMinutes(slot.start);
  const endMin = timeToMinutes(slot.end);
  if (endMin === null) return false;
  const overnight = startMin !== null && endMin <= startMin;
  const endEpoch = vnSlotEpoch(dateIso, endMin, overnight ? 1 : 0);
  if (endEpoch === null) return false;
  return now >= endEpoch;
}

export function getRoomIdFromTimeslotIds(value: string | null | undefined): number | null {
  const first = parseTimeslotIds(value)[0];
  if (!first) return null;
  return parseTimeslotId(first).roomId;
}

export function getRoomIdsFromTimeslotIds(value: string | null | undefined): number[] {
  const ids = new Set<number>();
  for (const timeslotId of parseTimeslotIds(value)) {
    const roomId = parseTimeslotId(timeslotId).roomId;
    if (roomId !== null) ids.add(roomId);
  }
  return [...ids];
}

export function getDateFromTimeslotIds(value: string | null | undefined): string | null {
  const first = parseTimeslotIds(value)[0];
  if (!first) return null;
  return parseTimeslotId(first).dateIso;
}

function normalizeLooseText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[–—]/g, "-")
    .replace(/\(.*?\)/g, "")
    .replace(/\s+/g, "");
}

function splitTimeRangeSegments(value: string | null | undefined) {
  if (!value) return [];
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export function getSlotIndexesFromTimeRange(
  roomName: string,
  timeRange: string | null | undefined,
  storedSlots?: RoomSlot[] | null
): number[] {
  if (!timeRange) return [];

  const slots = getRoomSlots(roomName, storedSlots);
  const normalizedWhole = normalizeLooseText(timeRange);

  if (normalizedWhole.includes("cangay")) {
    return slots.map((_, index) => index);
  }

  if (normalizedWhole.includes("quadem")) {
    return slots.length > 0 ? [slots.length - 1] : [];
  }

  const indexes = new Set<number>();
  const segments = splitTimeRangeSegments(timeRange);

  for (const segment of segments) {
    const normalizedSegment = normalizeLooseText(segment);
    const slotIndex = slots.findIndex((slot) => normalizeLooseText(slot.label) === normalizedSegment);

    if (slotIndex >= 0) {
      indexes.add(slotIndex);
    }
  }

  return [...indexes].sort((a, b) => a - b);
}

export function inferTimeslotIds(input: {
  roomId: number | null | undefined;
  roomName: string | null | undefined;
  stayDate?: string | null;
  dateLabel?: string | null;
  timeRange?: string | null;
  timeslotIds?: string | null;
  timeSlots?: RoomSlot[] | null;
}) {
  const existing = parseTimeslotIds(input.timeslotIds);
  if (existing.length > 0) return existing;

  if (!input.roomId || !input.roomName) return [];

  const stayDate = normalizeDateLabelToIso(input.stayDate) ?? normalizeDateLabelToIso(input.dateLabel);
  if (!stayDate) return [];

  return getSlotIndexesFromTimeRange(input.roomName, input.timeRange, input.timeSlots).map((slotIndex) =>
    buildTimeslotId(input.roomId as number, stayDate, slotIndex)
  );
}
