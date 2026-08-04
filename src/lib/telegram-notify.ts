import https from "node:https";

export interface TelegramBookingPayload {
  bookingId: string;
  customerName: string;
  customerPhone?: string;
  roomName: string;
  branchName: string;
  dateLabel: string;
  timeRange: string;
  amount: number;
  doorCode: string;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export async function sendTelegramBookingNotification(payload: TelegramBookingPayload): Promise<void> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) return;

  const formattedAmount = new Intl.NumberFormat("vi-VN").format(payload.amount) + "đ";

  const lines = [
    "🏠 <b>Đặt phòng mới đã thanh toán!</b>",
    "",
    `📋 Mã: <code>${escapeHtml(payload.bookingId)}</code>`,
    `👤 Khách: ${escapeHtml(payload.customerName)}`,
    ...(payload.customerPhone ? [`📞 SĐT: ${escapeHtml(payload.customerPhone)}`] : []),
    `🏡 Phòng: ${escapeHtml(payload.roomName)} - ${escapeHtml(payload.branchName)}`,
    `📅 Ngày: ${escapeHtml(payload.dateLabel)}`,
    `⏰ Giờ: ${escapeHtml(payload.timeRange)}`,
    `💰 Đã thanh toán: <b>${formattedAmount}</b>`,
    `🔑 Mã cửa: <code>${escapeHtml(payload.doorCode)}</code>`,
  ];

  const body = Buffer.from(
    JSON.stringify({ chat_id: chatId, text: lines.join("\n"), parse_mode: "HTML" }),
    "utf8"
  );

  await new Promise<void>((resolve, reject) => {
    const req = https.request(
      {
        hostname: "api.telegram.org",
        port: 443,
        path: `/bot${botToken}/sendMessage`,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": body.length,
        },
        family: 4, // force IPv4 — avoids ConnectTimeoutError on servers without IPv6
        timeout: 10000,
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (chunk: Buffer) => chunks.push(chunk));
        res.on("end", () => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            resolve();
          } else {
            reject(new Error(`Telegram API error ${res.statusCode}: ${Buffer.concat(chunks).toString()}`));
          }
        });
      }
    );

    req.on("timeout", () => {
      req.destroy(new Error("Telegram request timeout"));
    });
    req.on("error", reject);

    req.write(body);
    req.end();
  });
}
