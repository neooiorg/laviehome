// Module-level store for SSE clients (works in persistent Docker container, not serverless)
type Client = {
  controller: ReadableStreamDefaultController<Uint8Array>;
  // When set, this client only receives updates for that booking (customer checkout).
  // When undefined, the client receives every update (admin dashboard).
  bookingId?: string;
};
const clients = new Map<string, Client>();

export function addSseClient(
  id: string,
  controller: ReadableStreamDefaultController<Uint8Array>,
  bookingId?: string,
) {
  clients.set(id, { controller, bookingId: bookingId?.toUpperCase() });
}

export function removeSseClient(id: string) {
  clients.delete(id);
}

export function broadcastBookingUpdate(bookingId: string, status: string) {
  const target = bookingId.toUpperCase();
  const data = `data: ${JSON.stringify({ bookingId, status })}\n\n`;
  const encoded = new TextEncoder().encode(data);
  for (const [id, client] of clients) {
    // Scoped clients only get their own booking; unscoped (admin) get everything.
    if (client.bookingId && client.bookingId !== target) continue;
    try {
      client.controller.enqueue(encoded);
    } catch {
      clients.delete(id);
    }
  }
}
