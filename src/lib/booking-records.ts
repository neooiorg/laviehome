import "server-only";

import {
  formatDateLabelFromIso,
  getDateFromTimeslotIds,
  getRoomIdFromTimeslotIds,
  inferTimeslotIds,
  normalizeDateLabelToIso,
  type RoomSlot,
} from "@/lib/booking-slots";
import { query } from "@/lib/postgres";
import { getBookingHoldMinutes } from "@/lib/settings-actions";

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
  time_slots?: RoomSlot[] | null;
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

/** Status persisted when an online booking stayed unpaid past the hold window. */
export const EXPIRED_UNPAID_STATUS = "Đã hết hạn - Không thanh toán";

const CANCELLED_STATUSES = new Set(["Đã hủy", "Hủy", "Cancelled", EXPIRED_UNPAID_STATUS]);

export function isCancelledStatus(status: string | null | undefined) {
  return status ? CANCELLED_STATUSES.has(status) : false;
}

/** The auto-assigned status for an online booking awaiting a bank transfer. */
export const PENDING_PAYMENT_STATUS = "Chờ thanh toán";

/**
 * An unpaid online booking only holds its timeslot for a limited window. Past
 * that window (`holdMinutes`, configurable in admin) the hold is treated as
 * released so the slot frees up for other guests. `holdMinutes <= 0` disables
 * expiry entirely. Only `Chờ thanh toán` bookings expire — deposit/confirmed
 * statuses set by staff are never auto-released.
 */
export function isExpiredPendingHold(
  raw: Pick<RawBookingRecord, "status" | "created_at">,
  holdMinutes: number,
  now: number = Date.now()
): boolean {
  if (holdMinutes <= 0) return false;
  if (raw.status !== PENDING_PAYMENT_STATUS) return false;
  const createdAt = new Date(raw.created_at).getTime();
  if (!Number.isFinite(createdAt)) return false;
  return now - createdAt > holdMinutes * 60_000;
}

/** Whether a booking still blocks its timeslot: not cancelled and not an expired unpaid hold. */
export function holdsSlot(
  raw: Pick<RawBookingRecord, "status" | "created_at">,
  holdMinutes: number,
  now: number = Date.now()
): boolean {
  return !isCancelledStatus(raw.status) && !isExpiredPendingHold(raw, holdMinutes, now);
}

export async function expireStalePendingBookings(holdMinutes?: number) {
  const minutes = holdMinutes ?? await getBookingHoldMinutes();
  if (minutes <= 0) return [];

  return query<{ id: string }>(
    `
    update bookings
    set status = $1, updated_at = now()
    where status = $2
      and created_at < now() - ($3::int * interval '1 minute')
    returning id
    `,
    [EXPIRED_UNPAID_STATUS, PENDING_PAYMENT_STATUS, minutes]
  );
}

export async function fetchRawBookings(options?: {
  limit?: number;
  id?: string;
  branchId?: number;
  status?: string;
  /**
   * Include the CCCD images (base64, up to several MB each). Off by default so
   * list views don't drag megabytes of images into the RSC payload — only the
   * single-booking detail needs them.
   */
  includeImages?: boolean;
}) {
  const { limit = 1000, id, branchId, status, includeImages = false } = options ?? {};
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
  const cccdColumns = includeImages
    ? "cccd_front,\n      cccd_back,"
    : "null::text as cccd_front,\n      null::text as cccd_back,";

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
      ${cccdColumns}
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
      timeSlots: room?.time_slots,
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
      null::text as cccd_front,
      null::text as cccd_back,
      created_at::text
    from bookings
    where status not in ('Đã hủy', 'Hủy', 'Cancelled', 'Đã hết hạn - Không thanh toán')
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

  const holdMinutes = await getBookingHoldMinutes();
  const now = Date.now();

  return matches
    .map((row) => normalizeBookingRecord(row, input.rooms, input.branches))
    .filter((booking) => holdsSlot(booking.raw, holdMinutes, now))
    .filter((booking) => booking.roomId === input.roomId && booking.stayDate === input.dateIso);
}
