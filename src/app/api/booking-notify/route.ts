import { NextRequest, NextResponse } from "next/server";
import { broadcastBookingUpdate } from "@/lib/sse-clients";

// Called by the Medusa backend after SePay webhook confirms a booking.
// No auth needed — only reachable from the internal network / backend.
export async function POST(req: NextRequest) {
  const { bookingId, status } = await req.json();
  if (!bookingId) return NextResponse.json({ ok: false, error: "Missing bookingId" }, { status: 400 });
  broadcastBookingUpdate(bookingId, status ?? "Đã xác nhận");
  return NextResponse.json({ ok: true });
}
