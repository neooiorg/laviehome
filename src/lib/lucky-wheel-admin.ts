import "server-only";

import { ensureLuckyWheelTables } from "@/lib/lucky-wheel";
import { query } from "@/lib/postgres";

export type LuckyWheelRecentSpin = {
  id: string;
  createdAt: string;
  phoneNumber: string | null;
  prizeLabel: string;
  prizePercent: number;
  voucherCode: string | null;
  voucherUsed: boolean;
  voucherActive: boolean | null;
  voucherExpiresAt: string | null;
};

export type LuckyWheelAdminReport = {
  todaySpins: number;
  last7DaysSpins: number;
  totalSpins: number;
  vouchersIssued: number;
  vouchersUsed: number;
  winningSpins: number;
  distribution: Array<{ prizeKey: string; prizeLabel: string; count: number }>;
  spins: LuckyWheelRecentSpin[];
};

export async function getLuckyWheelAdminReport(): Promise<LuckyWheelAdminReport> {
  await ensureLuckyWheelTables();

  const [summaryRows, distributionRows, recentRows] = await Promise.all([
    query<{
      today_spins: string;
      last_7_days_spins: string;
      total_spins: string;
      vouchers_issued: string;
      vouchers_used: string;
      winning_spins: string;
    }>(`
      SELECT
        COUNT(*) FILTER (WHERE spin_date = (NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date)::text AS today_spins,
        COUNT(*) FILTER (WHERE spin_date >= (NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date - 6)::text AS last_7_days_spins,
        COUNT(*)::text AS total_spins,
        COUNT(voucher_code)::text AS vouchers_issued,
        COUNT(*) FILTER (WHERE d.used_count > 0)::text AS vouchers_used,
        COUNT(*) FILTER (WHERE s.prize_percent > 0)::text AS winning_spins
      FROM lucky_wheel_spins s
      LEFT JOIN discount_codes d ON d.code = s.voucher_code
    `),
    query<{ prize_key: string; prize_label: string; count: string }>(`
      SELECT prize_key, prize_label, COUNT(*)::text AS count
      FROM lucky_wheel_spins
      GROUP BY prize_key, prize_label
      ORDER BY COUNT(*) DESC, prize_label ASC
    `),
    query<{
      id: string;
      created_at: string;
      phone_number: string | null;
      prize_label: string;
      prize_percent: number;
      voucher_code: string | null;
      used_count: number | null;
      active: boolean | null;
      expires_at: string | null;
    }>(`
      SELECT s.id::text, s.created_at::text, s.phone_number, s.prize_label, s.prize_percent,
             s.voucher_code, d.used_count, d.active, d.expires_at::text
      FROM lucky_wheel_spins s
      LEFT JOIN discount_codes d ON d.code = s.voucher_code
      ORDER BY s.created_at DESC
    `),
  ]);

  const summary = summaryRows[0];
  return {
    todaySpins: Number(summary?.today_spins ?? 0),
    last7DaysSpins: Number(summary?.last_7_days_spins ?? 0),
    totalSpins: Number(summary?.total_spins ?? 0),
    vouchersIssued: Number(summary?.vouchers_issued ?? 0),
    vouchersUsed: Number(summary?.vouchers_used ?? 0),
    winningSpins: Number(summary?.winning_spins ?? 0),
    distribution: distributionRows.map((row) => ({
      prizeKey: row.prize_key,
      prizeLabel: row.prize_label,
      count: Number(row.count),
    })),
    spins: recentRows.map((row) => ({
      id: row.id,
      createdAt: row.created_at,
      phoneNumber: row.phone_number,
      prizeLabel: row.prize_label,
      prizePercent: Number(row.prize_percent),
      voucherCode: row.voucher_code,
      voucherUsed: Number(row.used_count ?? 0) > 0,
      voucherActive: row.active,
      voucherExpiresAt: row.expires_at,
    })),
  };
}
