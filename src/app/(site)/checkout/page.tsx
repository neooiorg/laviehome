import Link from "next/link";

import { BottomNav } from "@/components/bottom-nav";
import { SiteHeader } from "@/components/site-header";
import { compactPhone } from "@/lib/format";
import { getActiveBookingsForRoomDate } from "@/lib/booking-records";
import { getPublicBranches, getPublicRooms } from "@/lib/homestay-dashboard";
import {
  formatDateLabelFromIso,
  getRoomIdFromTimeslotIds,
  normalizeDateLabelToIso,
  parseTimeslotIds,
  stringifyTimeslotIds,
} from "@/lib/booking-slots";
import { query } from "@/lib/postgres";
import { CheckoutExperience } from "./checkout-experience";

type CheckoutSearchParams = Record<string, string | string[] | undefined>;

type CheckoutPayload = {
  room_id?: number | string;
  timeslot_ids?: string;
  room_name?: string;
  branch_name?: string;
  branch_id?: string;
  date?: string;
  time_range?: string;
  price?: number | string;
};

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value ?? "";
}

function decodePayload(data: string): CheckoutPayload {
  if (!data) return {};
  try {
    return JSON.parse(Buffer.from(data, "base64").toString("utf8")) as CheckoutPayload;
  } catch {
    return {};
  }
}

async function resolveCheckout(
  params: CheckoutSearchParams,
  branches: Awaited<ReturnType<typeof getPublicBranches>>,
  rooms: Awaited<ReturnType<typeof getPublicRooms>>
) {
  const decoded = decodePayload(firstValue(params.data));
  const timeslotIds = decoded.timeslot_ids ?? firstValue(params.timeslot_ids) ?? "N/A";
  const inferredRoomId = getRoomIdFromTimeslotIds(timeslotIds);
  const rawRoomId = decoded.room_id ?? firstValue(params.room_id) ?? inferredRoomId;
  const roomId = Number(rawRoomId);
  const room = Number.isFinite(roomId) ? rooms.find((item) => item.id === roomId) : null;
  const branchId = decoded.branch_id ?? firstValue(params.branch_id) ?? (room ? String(room.branch_id) : "");
  const branch = branches.find((item) => String(item.id) === String(branchId));
  const price = Number(decoded.price ?? firstValue(params.price) ?? 0);
  const stayDate =
    normalizeDateLabelToIso(decoded.date ?? firstValue(params.date)) ?? normalizeDateLabelToIso(firstValue(params.date));

  return {
    roomId: room?.id ?? (Number.isFinite(roomId) ? roomId : null),
    timeslotIds,
    roomName: decoded.room_name ?? firstValue(params.room_name) ?? room?.card_name ?? "N/A",
    branchName: decoded.branch_name ?? firstValue(params.branch_name) ?? branch?.name ?? room?.branch_name ?? "N/A",
    branchId,
    date: decoded.date ?? firstValue(params.date) ?? formatDateLabelFromIso(stayDate) ?? "N/A",
    stayDate,
    timeRange: decoded.time_range ?? firstValue(params.time_range) ?? "N/A",
    price: Number.isFinite(price) ? price : 0,
    hotline: branch?.hotline ?? "0909.123.456",
    map: branch?.google_maps_link ?? "/contacts",
  };
}

async function checkTimeslotConflict(
  id: string,
  checkout: Awaited<ReturnType<typeof resolveCheckout>>,
  branches: Awaited<ReturnType<typeof getPublicBranches>>,
  rooms: Awaited<ReturnType<typeof getPublicRooms>>
) {
  if (!checkout.roomId || !checkout.stayDate || !checkout.roomName || checkout.timeslotIds === "N/A") {
    return false;
  }

  const selectedTimeslotIds = parseTimeslotIds(checkout.timeslotIds);
  if (selectedTimeslotIds.length === 0) return false;

  const activeBookings = await getActiveBookingsForRoomDate({
    roomId: checkout.roomId,
    roomName: checkout.roomName,
    dateIso: checkout.stayDate,
    rooms,
    branches,
  });

  return activeBookings.some(
    (booking) =>
      booking.raw.id !== id && booking.timeslotIds.some((timeslotId) => selectedTimeslotIds.includes(timeslotId))
  );
}

async function upsertBookingRecord(id: string, checkout: Awaited<ReturnType<typeof resolveCheckout>>) {
  try {
    await query(
      `INSERT INTO bookings (
        id, guest_name, room_id, room_name, branch_id, branch_name,
        stay_date, date_label, time_range, timeslot_ids, channel, amount
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'Online', $11)
      ON CONFLICT (id) DO UPDATE SET
        room_id = COALESCE(EXCLUDED.room_id, bookings.room_id),
        room_name = COALESCE(EXCLUDED.room_name, bookings.room_name),
        branch_id = COALESCE(EXCLUDED.branch_id, bookings.branch_id),
        branch_name = COALESCE(EXCLUDED.branch_name, bookings.branch_name),
        stay_date = COALESCE(EXCLUDED.stay_date, bookings.stay_date),
        date_label = COALESCE(EXCLUDED.date_label, bookings.date_label),
        time_range = COALESCE(EXCLUDED.time_range, bookings.time_range),
        timeslot_ids = COALESCE(EXCLUDED.timeslot_ids, bookings.timeslot_ids),
        channel = COALESCE(bookings.channel, EXCLUDED.channel),
        amount = CASE WHEN EXCLUDED.amount > 0 THEN EXCLUDED.amount ELSE bookings.amount END,
        updated_at = NOW()`,
      [
        id,
        "",
        checkout.roomId,
        checkout.roomName ?? null,
        checkout.branchId ? Number(checkout.branchId) : null,
        checkout.branchName ?? null,
        checkout.stayDate ?? null,
        checkout.date ?? null,
        checkout.timeRange ?? null,
        checkout.timeslotIds && checkout.timeslotIds !== "N/A"
          ? stringifyTimeslotIds(parseTimeslotIds(checkout.timeslotIds))
          : null,
        checkout.price ?? 0,
      ]
    );
  } catch {
    // non-blocking - booking will be completed on form submit
  }
}

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<CheckoutSearchParams>;
}) {
  const params = await searchParams;
  const [branches, rooms] = await Promise.all([getPublicBranches(), getPublicRooms()]);
  const checkout = await resolveCheckout(params, branches, rooms);
  const transferCode = `LVH${String(checkout.branchId || "00").padStart(2, "0")}${String(checkout.timeslotIds)
    .replace(/\D/g, "")
    .slice(-6) || "000000"}`;

  const hasConflict =
    checkout.timeslotIds && checkout.timeslotIds !== "N/A" && checkout.roomName && checkout.stayDate
      ? await checkTimeslotConflict(transferCode, checkout, branches, rooms)
      : false;

  if (hasConflict) {
    return (
      <main className="site-shell min-h-dvh text-white">
        <SiteHeader />
        <div className="mx-auto flex w-[min(100%-2rem,1180px)] flex-col items-center gap-6 pb-16 pt-32 text-center">
          <div className="text-5xl">⚠️</div>
          <h1 className="text-2xl font-bold">Khung giờ đã được đặt</h1>
          <p className="max-w-md text-white/70">
            Rất tiếc, khung giờ bạn chọn cho phòng <strong>{checkout.roomName}</strong> vào ngày{" "}
            <strong>{checkout.date}</strong> đã có người đặt trước. Vui lòng quay lại và chọn khung giờ khác.
          </p>
          <Link
            href="/"
            className="rounded-xl bg-white px-6 py-3 font-semibold text-black transition-colors hover:bg-white/90"
          >
            Quay lại đặt phòng
          </Link>
        </div>
        <BottomNav />
      </main>
    );
  }

  await upsertBookingRecord(transferCode, checkout);

  return (
    <main className="site-shell min-h-dvh text-white">
      <SiteHeader />
      <div className="mx-auto w-[min(100%-2rem,1180px)] pb-16 pt-32">
        <CheckoutExperience
          transferCode={transferCode}
          roomName={checkout.roomName}
          branchName={checkout.branchName}
          date={checkout.date}
          timeRange={checkout.timeRange}
          price={checkout.price}
          hotline={checkout.hotline}
          mapLink={checkout.map}
        />

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm font-semibold text-white/50">
          <Link className="hover:text-white" href="/">
            Đặt Phòng
          </Link>
          <Link className="hover:text-white" href="/checking">
            Tra Cứu
          </Link>
          <a className="hover:text-white" href={checkout.map}>
            Địa Chỉ
          </a>
          <a className="hover:text-white" href={`tel:${compactPhone(checkout.hotline)}`}>
            Hotline: {checkout.hotline}
          </a>
        </div>
      </div>
      <BottomNav />
    </main>
  );
}
