import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { Pool } from "pg";

let pool: Pool | null = null;
function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL?.includes('sslmode=require') || process.env.DATABASE_URL?.includes('neon.tech')
        ? { rejectUnauthorized: false }
        : undefined,
    });
  }
  return pool;
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER);

  try {
    const payload = req.body as any;
    logger.info(`SePay webhook received: ${JSON.stringify(payload)}`);

    const content = payload?.content || "";
    const rawCode = payload?.code || "";

    const match = content.match(/LVH[A-Za-z0-9]+/i) || rawCode.match(/LVH[A-Za-z0-9]+/i);
    const bookingId = match ? match[0].toUpperCase() : null;

    if (!bookingId) {
      logger.warn(`No booking ID in content: "${content}" / code: "${rawCode}"`);
      return res.status(200).json({ success: false, message: "No booking ID found." });
    }

    logger.info(`Confirming booking ${bookingId}, amount: ${payload.transferAmount}`);

    const db = getPool();
    const result = await db.query(
      `UPDATE bookings SET status = 'Đã xác nhận', updated_at = NOW() WHERE UPPER(id) = $1`,
      [bookingId]
    );

    if (result.rowCount && result.rowCount > 0) {
      logger.info(`Booking ${bookingId} confirmed.`);
      // Notify frontend SSE clients so admin dashboard updates instantly
      const frontendUrl = process.env.FRONTEND_URL || process.env.NEXT_PUBLIC_SITE_URL || "";
      if (frontendUrl) {
        fetch(`${frontendUrl}/api/booking-notify`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bookingId, status: "Đã xác nhận" }),
        }).catch((e) => logger.warn(`booking-notify failed: ${e.message}`));
      }
      return res.status(200).json({ success: true, message: `Booking ${bookingId} confirmed.` });
    } else {
      logger.warn(`Booking ${bookingId} not found.`);
      return res.status(200).json({ success: false, message: `Booking ${bookingId} not found.` });
    }
  } catch (error: any) {
    logger.error("SePay webhook error:", error);
    return res.status(200).json({ success: false, error: error.message });
  }
}
