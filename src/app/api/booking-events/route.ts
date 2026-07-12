import { addSseClient, removeSseClient } from "@/lib/sse-clients";

export const dynamic = "force-dynamic";

export async function GET() {
  const clientId = crypto.randomUUID();

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      addSseClient(clientId, controller);
      // Send a heartbeat comment so the connection stays alive
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
