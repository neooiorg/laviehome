export type LuckyWheelPrizeKey = string;

export type LuckyWheelPrize = {
  key: LuckyWheelPrizeKey;
  label: string;
  shortLabel: string;
  color: string;
  percent: number;
  weight: number;
};

export const DEFAULT_LUCKY_WHEEL_PRIZES: LuckyWheelPrize[] = [
  { key: "discount-5", label: "Giảm 5%", shortLabel: "5%", color: "#f35abd", percent: 5, weight: 35 },
  { key: "discount-10", label: "Giảm 10%", shortLabel: "10%", color: "#f6d76f", percent: 10, weight: 20 },
  { key: "discount-15", label: "Giảm 15%", shortLabel: "15%", color: "#7c6cff", percent: 15, weight: 8 },
  { key: "discount-20", label: "Giảm 20%", shortLabel: "20%", color: "#55d6b4", percent: 20, weight: 2 },
  { key: "better-luck", label: "May mắn lần sau", shortLabel: "Chúc may mắn", color: "#2f2035", percent: 0, weight: 35 },
];

// Kept as an alias for components that only need a decorative wheel icon.
export const LUCKY_WHEEL_SEGMENTS = DEFAULT_LUCKY_WHEEL_PRIZES;
export const LUCKY_WHEEL_VOUCHER_DAYS = 7;

export type LuckyWheelConfig = {
  enabled: boolean;
  voucherDays: number;
  prizes: LuckyWheelPrize[];
};

export const DEFAULT_LUCKY_WHEEL_CONFIG: LuckyWheelConfig = {
  enabled: true,
  voucherDays: LUCKY_WHEEL_VOUCHER_DAYS,
  prizes: DEFAULT_LUCKY_WHEEL_PRIZES,
};

function isValidColor(value: unknown): value is string {
  return typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value);
}

export function normalizeLuckyWheelConfig(value: unknown): LuckyWheelConfig {
  if (!value || typeof value !== "object") return DEFAULT_LUCKY_WHEEL_CONFIG;
  const input = value as Partial<LuckyWheelConfig> & { weights?: Record<string, number> };
  const voucherDays = Math.min(90, Math.max(1, Math.round(Number(input.voucherDays) || LUCKY_WHEEL_VOUCHER_DAYS)));
  const base = { enabled: input.enabled !== false, voucherDays };

  // Upgrade saved configurations that used a fixed weights map.
  const sourcePrizes = Array.isArray(input.prizes)
    ? input.prizes
    : DEFAULT_LUCKY_WHEEL_PRIZES.map((prize) => ({
        ...prize,
        weight: Number(input.weights?.[prize.key] ?? prize.weight),
      }));

  if (sourcePrizes.length < 2 || sourcePrizes.length > 12) {
    return { ...base, prizes: DEFAULT_LUCKY_WHEEL_PRIZES };
  }

  const seen = new Set<string>();
  const prizes: LuckyWheelPrize[] = [];
  for (const candidate of sourcePrizes) {
    if (!candidate || typeof candidate !== "object") return { ...base, prizes: DEFAULT_LUCKY_WHEEL_PRIZES };
    const prize = candidate as Partial<LuckyWheelPrize>;
    const key = typeof prize.key === "string" ? prize.key : "";
    const label = typeof prize.label === "string" ? prize.label.trim() : "";
    const shortLabel = typeof prize.shortLabel === "string" ? prize.shortLabel.trim() : "";
    const percent = Number(prize.percent);
    const weight = Number(prize.weight);
    if (
      !/^[a-z0-9-]{1,40}$/.test(key) || seen.has(key) || !label || label.length > 60 ||
      !shortLabel || shortLabel.length > 16 || !isValidColor(prize.color) ||
      !Number.isInteger(percent) || percent < 0 || percent > 100 ||
      !Number.isInteger(weight) || weight < 0 || weight > 100
    ) {
      return { ...base, prizes: DEFAULT_LUCKY_WHEEL_PRIZES };
    }
    seen.add(key);
    prizes.push({ key, label, shortLabel, color: prize.color, percent, weight });
  }

  if (prizes.reduce((sum, prize) => sum + prize.weight, 0) !== 100) {
    return { ...base, prizes: DEFAULT_LUCKY_WHEEL_PRIZES };
  }

  return { ...base, prizes };
}
