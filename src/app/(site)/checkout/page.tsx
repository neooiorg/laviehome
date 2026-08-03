import Link from "next/link";

import { BottomNav } from "@/components/bottom-nav";
import { SiteHeader } from "@/components/site-header";
import { CUSTOMER_CONTACT } from "@/config/customer-info";
import { makeBookingReference } from "@/lib/booking-reference";
import { compactPhone } from "@/lib/format";
import { fetchRawBookings, holdsSlot, normalizeBookingRecord } from "@/lib/booking-records";
import { getPublicBranches, getPublicRooms } from "@/lib/homestay-dashboard";
import {
  formatDateLabelFromIso,
  getRoomIdFromTimeslotIds,
  normalizeDateLabelToIso,
  parseTimeslotIds,
} from "@/lib/booking-slots";
import { getMenuItemsByIds } from "@/lib/menu-actions";
import { getBookingHoldMinutes, getOnlinePaymentEnabled } from "@/lib/settings-actions";
import { getBankPaymentConfig } from "@/lib/payment-config";
import { CheckoutExperience } from "./checkout-experience";

type CheckoutSearchParams = Record<string, string | string[] | undefined>;

type CheckoutPayload = {
  booking_id?: string;
  room_id?: number | string;
  timeslot_ids?: string;
  room_name?: string;
  branch_name?: string;
  branch_id?: string;
  date?: string;
  time_range?: string;
  price?: number | string;
  menu_item_ids?: string;
};

function parseMenuItemIds(raw: string): number[] {
  return raw
    .split(",")
    .map((part) => Number(part.trim()))
    .filter((id) => Number.isInteger(id) && id > 0);
}

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
  // Only the item IDs come from the client; the authoritative name/price/image
  // are fetched from the database so a tampered payload cannot forge them.
  const menuIds = parseMenuItemIds(decoded.menu_item_ids ?? firstValue(params.menu_item_ids) ?? "");
  const dbMenuItems = menuIds.length ? await getMenuItemsByIds(menuIds) : [];
  const menuItems = dbMenuItems.map((item) => ({
    id: item.id,
    name: item.name,
    price: Number(item.price),
    image_url: item.image_url ?? "",
    description: item.description ?? "",
  }));
  const menuTotal = menuItems.reduce((sum, item) => sum + item.price, 0);
  const roomPrice = Math.max((Number.isFinite(price) ? price : 0) - menuTotal, 0);
  const stayDate =
    normalizeDateLabelToIso(decoded.date ?? firstValue(params.date)) ?? normalizeDateLabelToIso(firstValue(params.date));

  return {
    bookingId: decoded.booking_id ?? firstValue(params.booking_id) ?? makeBookingReference(branchId),
    roomId: room?.id ?? (Number.isFinite(roomId) ? roomId : null),
    timeslotIds,
    roomName: decoded.room_name ?? firstValue(params.room_name) ?? room?.card_name ?? "N/A",
    branchName: decoded.branch_name ?? firstValue(params.branch_name) ?? branch?.name ?? room?.branch_name ?? "N/A",
    branchId,
    date: decoded.date ?? firstValue(params.date) ?? formatDateLabelFromIso(stayDate) ?? "N/A",
    stayDate,
    timeRange: decoded.time_range ?? firstValue(params.time_range) ?? "N/A",
    price: Number.isFinite(price) ? price : 0,
    roomPrice,
    menuItems,
    hotline: branch?.hotline ?? CUSTOMER_CONTACT.phoneDisplay,
    map: branch?.google_maps_link ?? "/contacts",
  };
}

async function checkTimeslotConflict(
  id: string,
  checkout: Awaited<ReturnType<typeof resolveCheckout>>,
  branches: Awaited<ReturnType<typeof getPublicBranches>>,
  rooms: Awaited<ReturnType<typeof getPublicRooms>>
) {
  if (!checkout.timeslotIds || checkout.timeslotIds === "N/A") {
    return false;
  }

  const selectedTimeslotIds = parseTimeslotIds(checkout.timeslotIds);
  if (selectedTimeslotIds.length === 0) return false;

  const selectedSet = new Set(selectedTimeslotIds);
  const [rawBookings, holdMinutes] = await Promise.all([
    fetchRawBookings({ limit: 1500 }),
    getBookingHoldMinutes(),
  ]);
  const now = Date.now();

  return rawBookings
    .map((booking) => normalizeBookingRecord(booking, rooms, branches))
    .filter((booking) => holdsSlot(booking.raw, holdMinutes, now))
    .some(
    (booking) =>
      booking.raw.id !== id && booking.timeslotIds.some((timeslotId) => selectedSet.has(timeslotId))
    );
}

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<CheckoutSearchParams>;
}) {
  const params = await searchParams;
  const [branches, rooms] = await Promise.all([getPublicBranches(), getPublicRooms()]);
  const checkout = await resolveCheckout(params, branches, rooms);
  const transferCode = checkout.bookingId;

  const hasConflict =
    checkout.timeslotIds && checkout.timeslotIds !== "N/A" && checkout.roomName
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
            Rất tiếc, một hoặc nhiều khung giờ bạn chọn cho <strong>{checkout.roomName}</strong> đã có người đặt trước.
            Vui lòng quay lại và chọn khung giờ khác.
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

  const onlinePaymentEnabled = await getOnlinePaymentEnabled();
  const bankConfig = getBankPaymentConfig();

  return (
    <main className="site-shell min-h-dvh text-white">
      <SiteHeader />
      <div className="mx-auto w-[min(100%-2rem,1180px)] pb-16 pt-32">
        <CheckoutExperience
          transferCode={transferCode}
          roomId={checkout.roomId}
          roomName={checkout.roomName}
          branchId={checkout.branchId}
          branchName={checkout.branchName}
          date={checkout.date}
          stayDate={checkout.stayDate}
          timeRange={checkout.timeRange}
          timeslotIds={checkout.timeslotIds}
          price={checkout.price}
          roomPrice={checkout.roomPrice}
          menuItems={checkout.menuItems}
          onlinePaymentEnabled={onlinePaymentEnabled}
          hotline={checkout.hotline}
          bankConfig={bankConfig}
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
