import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { Pool } from "pg";

export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER);
  const dbConnection = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION);

  try {
    const payload = req.body as any;
    logger.info(`Received SePay Webhook payload: ${JSON.stringify(payload)}`);

    if (!payload || !payload.content) {
      return res.status(400).json({ success: false, message: "Invalid payload" });
    }

    // Extract the booking ID from the content or code
    // Example: "LVH01223456" or similar
    const rawCode = payload.code || "";
    const content = payload.content || "";
    
    // Attempt to match booking ID format: e.g. LVH followed by numbers/digits
    const match = content.match(/LVH[A-Za-z0-9]+/i) || rawCode.match(/LVH[A-Za-z0-9]+/i);
    const bookingId = match ? match[0].toUpperCase() : null;

    if (!bookingId) {
      logger.warn(`Could not extract booking ID from content: "${content}" or code: "${rawCode}"`);
      return res.status(200).json({ success: false, message: "No matching booking ID found in transaction content." });
    }

    logger.info(`Processing payment for booking ID: ${bookingId} with amount: ${payload.transferAmount}`);

    // Update the booking status in the bookings table in PostgreSQL
    const pool = new Pool({
      connectionString: 'postgresql://neondb_owner:npg_hKlft6kGv9Ha@ep-damp-darkness-aowpqu5c-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
      ssl: { rejectUnauthorized: false }
    });

    const updateRes = await pool.query(
      `UPDATE bookings SET status = 'Đã xác nhận' WHERE UPPER(id) = $1`,
      [bookingId]
    );
    await pool.end();

    if (updateRes.rowCount > 0) {
      logger.info(`Successfully updated status of booking ${bookingId} to 'Đã xác nhận'`);
      return res.status(200).json({ success: true, message: `Booking ${bookingId} marked as confirmed.` });
    } else {
      logger.warn(`Booking ${bookingId} not found in the bookings table.`);
      return res.status(200).json({ success: false, message: `Booking ${bookingId} not found.` });
    }
  } catch (error: any) {
    logger.error("Error processing SePay Webhook:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
