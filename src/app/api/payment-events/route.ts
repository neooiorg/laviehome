import { addSseClient, removeSseClient } from "@/lib/sse-clients";

export const dynamic = "force-dynamic";

// Customer-facing payment stream. Unlike /api/booking-events (admin, receives
// every update), this subscribes scoped to a single booking so a customer only
// ever receives events for their own booking. The SePay webhook pushes here via
// broadcastBookingUpdate() the moment payment is confirmed — no DB polling.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const bookingId = searchParams.get("booking_id");

  if (!bookingId) {
    return new Response("Missing booking_id", { status: 400 });
  }

  const clientId = crypto.randomUUID();

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      addSseClient(clientId, controller, bookingId);
      // Heartbeat comment so proxies keep the connection open.
      controller.enqueue(new TextEncoder().encode(": connected\n\n"));
    },
    cancel() {
      removeSseClient(clientId);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
