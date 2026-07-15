import { NextRequest, NextResponse } from "next/server";

import { fetchRawBookings, isCancelledStatus, normalizeBookingRecord } from "@/lib/booking-records";
import { getPublicBranches, getPublicRooms } from "@/lib/homestay-dashboard";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const branchId = Number(searchParams.get("branch_id"));
  const roomId = Number(searchParams.get("room_id"));

  if (!Number.isFinite(branchId) && !Number.isFinite(roomId)) {
    return NextResponse.json({ error: "Missing branch_id or room_id" }, { status: 400 });
  }

  try {
    const [branches, rooms, rawBookings] = await Promise.all([
      getPublicBranches(),
      getPublicRooms(),
      fetchRawBookings({ limit: 1500, branchId: Number.isFinite(branchId) ? branchId : undefined }),
    ]);

    const branchRooms = Number.isFinite(roomId)
      ? rooms.filter((room) => room.id === roomId)
      : rooms.filter((room) => room.branch_id === branchId);
    const roomIds = new Set(branchRooms.map((room) => room.id));

    if (branchRooms.length === 0) {
      return NextResponse.json({ bookedSlotIds: [] });
    }

    const bookedSlotIds = rawBookings
      .map((booking) => normalizeBookingRecord(booking, rooms, branches))
      .filter((booking) => !isCancelledStatus(booking.raw.status))
      .filter((booking) => booking.roomId !== null && roomIds.has(booking.roomId))
      .flatMap((booking) => booking.timeslotIds);

    return NextResponse.json({ bookedSlotIds: [...new Set(bookedSlotIds)] });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
