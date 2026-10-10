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

  const submittedTotal = Object.values(value.weights ?? {}).reduce(
    (sum, weight) => sum + Number(weight || 0),
    0
  );
  if (submittedTotal !== 100) throw new Error("Tổng tỷ lệ phần thưởng phải bằng 100%.");

  const normalized = normalizeLuckyWheelConfig(value);
  const saved = await saveLuckyWheelConfig(normalized);
  revalidatePath("/dashboard/lucky-wheel");
  revalidatePath("/", "layout");
  return saved;
}
