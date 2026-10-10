export const LUCKY_WHEEL_SEGMENTS = [
  { key: "discount-5", label: "Giảm 5%", shortLabel: "5%", color: "#f35abd" },
  { key: "discount-10", label: "Giảm 10%", shortLabel: "10%", color: "#f6d76f" },
  { key: "discount-15", label: "Giảm 15%", shortLabel: "15%", color: "#7c6cff" },
  { key: "discount-20", label: "Giảm 20%", shortLabel: "20%", color: "#55d6b4" },
  { key: "better-luck", label: "May mắn lần sau", shortLabel: "Chúc may mắn", color: "#2f2035" },
] as const;

export type LuckyWheelPrizeKey = (typeof LUCKY_WHEEL_SEGMENTS)[number]["key"];

export const LUCKY_WHEEL_VOUCHER_DAYS = 7;

export type LuckyWheelConfig = {
  enabled: boolean;
  voucherDays: number;
  weights: Record<LuckyWheelPrizeKey, number>;
};

export const DEFAULT_LUCKY_WHEEL_CONFIG: LuckyWheelConfig = {
  enabled: true,
  voucherDays: LUCKY_WHEEL_VOUCHER_DAYS,
  weights: {
    "discount-5": 35,
    "discount-10": 20,
    "discount-15": 8,
    "discount-20": 2,
    "better-luck": 35,
  },
};

export function normalizeLuckyWheelConfig(value: unknown): LuckyWheelConfig {
  if (!value || typeof value !== "object") return DEFAULT_LUCKY_WHEEL_CONFIG;
  const input = value as Partial<LuckyWheelConfig>;
  const inputWeights = input.weights && typeof input.weights === "object" ? input.weights : {};
  const weights = Object.fromEntries(
    LUCKY_WHEEL_SEGMENTS.map((segment) => {
      const raw = Number((inputWeights as Partial<Record<LuckyWheelPrizeKey, number>>)[segment.key]);
      const fallback = DEFAULT_LUCKY_WHEEL_CONFIG.weights[segment.key];
      return [segment.key, Number.isFinite(raw) ? Math.min(100, Math.max(0, Math.round(raw))) : fallback];
    })
  ) as Record<LuckyWheelPrizeKey, number>;
  const voucherDays = Math.min(90, Math.max(1, Math.round(Number(input.voucherDays) || LUCKY_WHEEL_VOUCHER_DAYS)));

  if (Object.values(weights).reduce((sum, weight) => sum + weight, 0) !== 100) {
    return { ...DEFAULT_LUCKY_WHEEL_CONFIG, enabled: input.enabled !== false, voucherDays };
  }

  return {
    enabled: input.enabled !== false,
    voucherDays,
    weights,
  };
}
