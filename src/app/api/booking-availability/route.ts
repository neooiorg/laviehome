import { NextRequest, NextResponse } from "next/server";

import { fetchRawBookings, holdsSlot, normalizeBookingRecord } from "@/lib/booking-records";
import { getRoomSlots, isTimeslotEnded, parseTimeslotId } from "@/lib/booking-slots";
import { getAllRooms, getPublicBranches } from "@/lib/homestay-dashboard";
import { getBookingHoldMinutes } from "@/lib/settings-actions";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  // NOTE: Number(null) === 0 (finite!), so an absent param must map to NaN, not 0.
  // Otherwise a branch_id-only request (homepage calendar) is treated as room_id=0
  // and filters to zero rooms, returning no blocked slots.
  const branchIdRaw = searchParams.get("branch_id");
  const roomIdRaw = searchParams.get("room_id");
  const branchId = branchIdRaw !== null ? Number(branchIdRaw) : NaN;
  const roomId = roomIdRaw !== null ? Number(roomIdRaw) : NaN;

  if (!Number.isFinite(branchId) && !Number.isFinite(roomId)) {
    return NextResponse.json({ error: "Missing branch_id or room_id" }, { status: 400 });
  }

  try {
    const [branches, rooms, rawBookings, holdMinutes] = await Promise.all([
      getPublicBranches(),
      getAllRooms(),
      fetchRawBookings({ limit: 1500 }),
      getBookingHoldMinutes(),
    ]);
    const now = Date.now();

    const targetBranch = Number.isFinite(branchId)
      ? branches.find((branch) => branch.id === branchId) ?? null
      : null;
    const branchRooms = Number.isFinite(roomId)
      ? rooms.filter((room) => room.id === roomId)
      : rooms.filter((room) => {
          if (room.branch_id === branchId) {
            return true;
          }

          return Boolean(targetBranch && room.branch_id == null && room.branch_name === targetBranch.name);
        });
    const roomIds = new Set(branchRooms.map((room) => room.id));

    if (branchRooms.length === 0) {
      return NextResponse.json({ bookedSlotIds: [] });
    }

    const bookedSlotIds = rawBookings
      .map((booking) => normalizeBookingRecord(booking, rooms, branches))
      .filter((booking) => holdsSlot(booking.raw, holdMinutes, now))
      // Release each slot the moment its end time passes ("đã ở xong"), so a room
      // that has finished its stay frees up even mid-day — not just on future dates.
      .flatMap((booking) => {
        return booking.timeslotIds.filter((slotId) => {
          const parsed = parseTimeslotId(slotId);
          if (parsed.roomId === null || !roomIds.has(parsed.roomId)) return false;
          const slotRoom = rooms.find((room) => room.id === parsed.roomId) ?? booking.room;
          const slots = getRoomSlots(slotRoom?.card_name ?? booking.roomName, slotRoom?.time_slots);
          return !isTimeslotEnded(slotId, slots, now);
        });
      });

    return NextResponse.json({ bookedSlotIds: [...new Set(bookedSlotIds)] });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
