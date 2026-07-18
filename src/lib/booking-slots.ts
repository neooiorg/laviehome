export type RoomSlot = {
  label: string;
  duration: string;
  // Start/end as "HH:MM" (24h). Present on dynamic (per-room) slots and on the
  // presets below; used to auto-generate labels and detect overlaps.
  start?: string;
  end?: string;
  isOvernight?: boolean;
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
  const weekdays = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

  return Array.from({ length: total }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() + index);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");

    return {
      iso: date.toISOString().slice(0, 10),
      label: index === 0 ? "Hôm nay" : weekdays[date.getDay()],
      dateLabel: `${day}-${month}`,
    };
  });
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

export function getRoomIdFromTimeslotIds(value: string | null | undefined): number | null {
  const first = parseTimeslotIds(value)[0];
  if (!first) return null;
  return parseTimeslotId(first).roomId;
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
