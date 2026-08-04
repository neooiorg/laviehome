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

  const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: lines.join("\n"),
      parse_mode: "HTML",
    }),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => "");
    throw new Error(`Telegram API error ${res.status}: ${err}`);
  }
}
