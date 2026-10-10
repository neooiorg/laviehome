"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { normalizeLuckyWheelConfig, type LuckyWheelConfig } from "@/lib/lucky-wheel-config";
import { saveLuckyWheelConfig } from "@/lib/lucky-wheel-settings";

export async function updateLuckyWheelConfig(value: LuckyWheelConfig) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("UNAUTHORIZED");
  if (session.user.role !== "admin") throw new Error("FORBIDDEN");

  if (!value || typeof value !== "object" || !Array.isArray(value.prizes) || value.prizes.length < 2 || value.prizes.length > 12) {
    throw new Error("Vòng quay cần có từ 2 đến 12 ô phần thưởng.");
  }
  if (!Number.isInteger(value.voucherDays) || value.voucherDays < 1 || value.voucherDays > 90) {
    throw new Error("Thời hạn voucher phải từ 1 đến 90 ngày.");
  }

  const keys = new Set<string>();
  for (const prize of value.prizes) {
    if (
      !prize || typeof prize !== "object" ||
      typeof prize.key !== "string" || !/^[a-z0-9-]{1,40}$/.test(prize.key) || keys.has(prize.key) ||
      typeof prize.label !== "string" || !prize.label.trim() || prize.label.length > 60 ||
      typeof prize.shortLabel !== "string" || !prize.shortLabel.trim() || prize.shortLabel.length > 16 ||
      typeof prize.color !== "string" || !/^#[0-9a-fA-F]{6}$/.test(prize.color) ||
      !Number.isInteger(prize.percent) || prize.percent < 0 || prize.percent > 100 ||
      !Number.isInteger(prize.weight) || prize.weight < 0 || prize.weight > 100
    ) {
      throw new Error("Thông tin phần thưởng chưa hợp lệ. Vui lòng kiểm tra tên, màu, mức giảm và tỷ lệ.");
    }
    keys.add(prize.key);
  }

  const submittedTotal = value.prizes.reduce((sum, prize) => sum + Number(prize.weight || 0), 0);
  if (submittedTotal !== 100) throw new Error("Tổng tỷ lệ phần thưởng phải bằng 100%.");

  const normalized = normalizeLuckyWheelConfig(value);
  const saved = await saveLuckyWheelConfig(normalized);
  revalidatePath("/dashboard/lucky-wheel");
  revalidatePath("/", "layout");
  return saved;
}
