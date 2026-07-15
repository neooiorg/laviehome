import "server-only";

import {
  formatDateLabelFromIso,
  getDateFromTimeslotIds,
  getRoomIdFromTimeslotIds,
  inferTimeslotIds,
  normalizeDateLabelToIso,
} from "@/lib/booking-slots";
import { query } from "@/lib/postgres";

export type RawBookingRecord = {
  id: string;
  room_id: number | null;
  room_name: string | null;
  branch_id: number | null;
  branch_name: string | null;
  guest_name: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  stay_date: string | null;
  date_label: string | null;
  time_range: string | null;
  timeslot_ids: string | null;
  channel: string | null;
  status: string;
  amount: number;
  menu_items_total: number | null;
  guest_count: number | null;
  has_car: boolean | null;
  has_decoration: boolean | null;
  discount_code: string | null;
  notes: string | null;
  cccd_front: string | null;
  cccd_back: string | null;
  created_at: string;
};

type CatalogRoom = {
  id: number;
  branch_id: number;
  card_name: string;
  branch_name: string;
  room_amenities: string[];
  price_from: number;
  price_to: number;
  full_day_price: number;
  main_image: string;
  is_classic: number;
  images: string[];
};

type CatalogBranch = {
  id: number;
  name: string;
  active: number;
  hotline: string;
  google_maps_link: string;
  classic_booking_enabled: number;
};

export type NormalizedBookingRecord = {
  raw: RawBookingRecord;
  roomId: number | null;
  branchId: number | null;
  roomName: string;
  branchName: string;
  stayDate: string | null;
  dateLabel: string | null;
  guestName: string;
  channel: string;
  timeslotIds: string[];
  room: CatalogRoom | null;
  branch: CatalogBranch | null;
};

const CANCELLED_STATUSES = new Set(["Đã hủy", "Hủy", "Cancelled"]);

export function isCancelledStatus(status: string | null | undefined) {
  return status ? CANCELLED_STATUSES.has(status) : false;
}

export async function fetchRawBookings(options?: {
  limit?: number;
  id?: string;
  branchId?: number;
  status?: string;
}) {
  const { limit = 1000, id, branchId, status } = options ?? {};
  const where: string[] = [];
  const params: unknown[] = [];

  if (id) {
    params.push(id);
    where.push(`upper(id) = upper($${params.length})`);
  }

  if (branchId) {
    params.push(branchId);
    where.push(`branch_id = $${params.length}`);
  }

  if (status) {
    params.push(status);
    where.push(`status = $${params.length}`);
  }

  params.push(limit);
  const whereClause = where.length > 0 ? `where ${where.join(" and ")}` : "";

  return query<RawBookingRecord>(
    `
    select
      id,
      room_id,
      room_name,
      branch_id,
      branch_name,
      guest_name,
      customer_name,
      customer_phone,
      stay_date::text,
      date_label,
      time_range,
      timeslot_ids,
      channel,
      status,
      amount,
      coalesce(menu_items_total, 0) as menu_items_total,
      guest_count,
      has_car,
      has_decoration,
      discount_code,
      notes,
      cccd_front,
      cccd_back,
      created_at::text
    from bookings
    ${whereClause}
    order by created_at desc
    limit $${params.length}
    `,
    params
  );
}

export function normalizeBookingRecord(
  raw: RawBookingRecord,
  rooms: CatalogRoom[],
  branches: CatalogBranch[]
): NormalizedBookingRecord {
  const resolvedRoomId =
    raw.room_id ??
    getRoomIdFromTimeslotIds(raw.timeslot_ids) ??
    rooms.find((room) => room.card_name === raw.room_name && (!raw.branch_id || room.branch_id === raw.branch_id))?.id ??
    null;

  const room = rooms.find((item) => item.id === resolvedRoomId) ?? null;
  const resolvedBranchId = raw.branch_id ?? room?.branch_id ?? null;
  const branch = branches.find((item) => item.id === resolvedBranchId) ?? null;
  const stayDate =
    normalizeDateLabelToIso(raw.stay_date) ??
    normalizeDateLabelToIso(raw.date_label) ??
    getDateFromTimeslotIds(raw.timeslot_ids);
  const dateLabel = raw.date_label ?? formatDateLabelFromIso(stayDate);
  const roomName = room?.card_name ?? raw.room_name ?? "";
  const branchName = branch?.name ?? room?.branch_name ?? raw.branch_name ?? "";

  return {
    raw,
    roomId: resolvedRoomId,
    branchId: resolvedBranchId,
    roomName,
    branchName,
    stayDate,
    dateLabel,
    guestName: raw.guest_name || raw.customer_name || "",
    channel: raw.channel ?? "Online",
    timeslotIds: inferTimeslotIds({
      roomId: resolvedRoomId,
      roomName,
      stayDate,
      dateLabel,
      timeRange: raw.time_range,
      timeslotIds: raw.timeslot_ids,
    }),
    room,
    branch,
  };
}

export async function getActiveBookingsForRoomDate(input: {
  roomId: number;
  roomName: string;
  dateIso: string;
  rooms: CatalogRoom[];
  branches: CatalogBranch[];
}) {
  const dateLabel = formatDateLabelFromIso(input.dateIso);
  const matches = await query<RawBookingRecord>(
    `
    select
      id,
      room_id,
      room_name,
      branch_id,
      branch_name,
      guest_name,
      customer_name,
      customer_phone,
      stay_date::text,
      date_label,
      time_range,
      timeslot_ids,
      channel,
      status,
      amount,
      coalesce(menu_items_total, 0) as menu_items_total,
      guest_count,
      has_car,
      has_decoration,
      discount_code,
      notes,
      cccd_front,
      cccd_back,
      created_at::text
    from bookings
    where status not in ('Đã hủy', 'Hủy', 'Cancelled')
      and (
        room_id = $1
        or room_name = $2
        or timeslot_ids like $5
      )
      and (
        stay_date::text = $3
        or date_label = $4
        or timeslot_ids like $6
      )
    order by created_at desc
    `,
    [
      input.roomId,
      input.roomName,
      input.dateIso,
      dateLabel,
      `%${input.roomId}-${input.dateIso}-%`,
      `%${input.dateIso}%`,
    ]
  );

  return matches
    .map((row) => normalizeBookingRecord(row, input.rooms, input.branches))
    .filter((booking) => !isCancelledStatus(booking.raw.status))
    .filter((booking) => booking.roomId === input.roomId && booking.stayDate === input.dateIso);
}
