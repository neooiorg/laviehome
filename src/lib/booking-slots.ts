export type RoomSlot = {
  label: string;
  duration: string;
  isOvernight?: boolean;
};

const ROOM_SLOT_PRESETS: Record<string, RoomSlot[]> = {
  Honey: [
    { label: "9:00 - 12:00", duration: "3T" },
    { label: "12:30 - 15:30", duration: "3T" },
    { label: "16:00 - 19:00", duration: "3T" },
    { label: "19:30 - 8:20", duration: "12T 50", isOvernight: true },
  ],
  Squid: [
    { label: "9:30 - 12:30", duration: "3T" },
    { label: "13:00 - 16:00", duration: "3T" },
    { label: "16:30 - 19:30", duration: "3T" },
    { label: "20:00 - 8:50", duration: "12T 50", isOvernight: true },
  ],
  default: [
    { label: "9:00 - 12:00", duration: "3T" },
    { label: "12:30 - 15:30", duration: "3T" },
    { label: "16:00 - 19:00", duration: "3T" },
    { label: "19:30 - 8:20", duration: "12T 50", isOvernight: true },
  ],
};

export function getRoomSlots(roomName: string): RoomSlot[] {
  if (roomName.includes("Honey")) return ROOM_SLOT_PRESETS.Honey;
  if (roomName.includes("Squid")) return ROOM_SLOT_PRESETS.Squid;
  return ROOM_SLOT_PRESETS.default;
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

export function getSlotIndexesFromTimeRange(roomName: string, timeRange: string | null | undefined): number[] {
  if (!timeRange) return [];

  const slots = getRoomSlots(roomName);
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
}) {
  const existing = parseTimeslotIds(input.timeslotIds);
  if (existing.length > 0) return existing;

  if (!input.roomId || !input.roomName) return [];

  const stayDate = normalizeDateLabelToIso(input.stayDate) ?? normalizeDateLabelToIso(input.dateLabel);
  if (!stayDate) return [];

  return getSlotIndexesFromTimeRange(input.roomName, input.timeRange).map((slotIndex) =>
    buildTimeslotId(input.roomId as number, stayDate, slotIndex)
  );
}
