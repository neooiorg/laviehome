// Module-level store for SSE clients (works in persistent Docker container, not serverless)
type Client = { controller: ReadableStreamDefaultController<Uint8Array> };
const clients = new Map<string, Client>();

export function addSseClient(id: string, controller: ReadableStreamDefaultController<Uint8Array>) {
  clients.set(id, { controller });
}

export function removeSseClient(id: string) {
  clients.delete(id);
}

export function broadcastBookingUpdate(bookingId: string, status: string) {
  const data = `data: ${JSON.stringify({ bookingId, status })}\n\n`;
  const encoded = new TextEncoder().encode(data);
  for (const [id, client] of clients) {
    try {
      client.controller.enqueue(encoded);
    } catch {
      clients.delete(id);
    }
  }
}
