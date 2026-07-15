import { NextRequest, NextResponse } from "next/server";

import { fetchRawBookings, isCancelledStatus, normalizeBookingRecord } from "@/lib/booking-records";
import { getAllRooms, getPublicBranches } from "@/lib/homestay-dashboard";

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
      getAllRooms(),
      fetchRawBookings({ limit: 1500 }),
    ]);

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
      .filter((booking) => !isCancelledStatus(booking.raw.status))
      .filter((booking) => booking.roomId !== null && roomIds.has(booking.roomId))
      .flatMap((booking) => booking.timeslotIds);

    return NextResponse.json({ bookedSlotIds: [...new Set(bookedSlotIds)] });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
