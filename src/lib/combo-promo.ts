/**
 * Combo promo (time-slot discount) configuration.
 *
 * A "combo" is a run of adjacent time slots booked on the same day. Each tier
 * says: from `minSlots` adjacent slots upward, give `discountPercent` off that
 * run plus `bonusMinutes` of free time. This module is pure and client-safe —
 * both the admin settings UI and the customer booking grid import from it.
 */

export type ComboPromoTier = {
  /** Minimum number of adjacent same-day slots the tier requires. */
  minSlots: number;
  /** Percentage discount applied to the run's price (0-100). */
  discountPercent: number;
  /** Bonus free minutes granted for the run. */
  bonusMinutes: number;
};

export type ComboPromoWindow = {
  /** Start time as "HH:MM" (24h). */
  start: string;
  /** End time as "HH:MM" (24h). */
  end: string;
};

export type ComboPromoConfig = {
  enabled: boolean;
  tiers: ComboPromoTier[];
  /**
   * Optional start-time windows where combo promos apply. Empty means all day,
   * preserving older configs that only had tiers.
   */
  windows: ComboPromoWindow[];
};

/** Mirrors the pricing that used to be hardcoded in the booking grid. */
export const DEFAULT_COMBO_PROMO_CONFIG: ComboPromoConfig = {
  enabled: true,
  windows: [],
  tiers: [
    { minSlots: 2, discountPercent: 5, bonusMinutes: 30 },
    { minSlots: 3, discountPercent: 10, bonusMinutes: 60 },
  ],
};

export function isValidComboPromoTime(value: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

function comboPromoTimeToMinutes(value: string): number | null {
  if (!isValidComboPromoTime(value)) return null;
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function normalizeComboPromoWindow(entry: unknown): ComboPromoWindow | null {
  if (!entry || typeof entry !== "object") return null;
  const window = entry as Record<string, unknown>;
  const start = String(window.start ?? "").trim();
  const end = String(window.end ?? "").trim();
  if (!isValidComboPromoTime(start) || !isValidComboPromoTime(end)) return null;
  if (start === end) return null;
  return { start, end };
}

/**
 * Coerce an untrusted value (DB row or client payload) into a safe config.
 * Invalid tiers are dropped; tiers are sorted ascending by `minSlots`.
 */
export function normalizeComboPromoConfig(raw: unknown): ComboPromoConfig {
  if (!raw || typeof raw !== "object") return DEFAULT_COMBO_PROMO_CONFIG;
  const obj = raw as Record<string, unknown>;
  const enabled = obj.enabled !== false;
  const windowsRaw = Array.isArray(obj.windows) ? obj.windows : [];
  const windows = windowsRaw
    .map(normalizeComboPromoWindow)
    .filter((window): window is ComboPromoWindow => window !== null);
  const tiersRaw = Array.isArray(obj.tiers) ? obj.tiers : [];
  const tiers = tiersRaw
    .map((entry) => {
      const tier = (entry ?? {}) as Record<string, unknown>;
      return {
        minSlots: Math.trunc(Number(tier.minSlots)),
        discountPercent: Number(tier.discountPercent),
        bonusMinutes: Math.trunc(Number(tier.bonusMinutes)),
      };
    })
    .filter(
      (tier) =>
        Number.isFinite(tier.minSlots) &&
        tier.minSlots >= 2 &&
        Number.isFinite(tier.discountPercent) &&
        tier.discountPercent >= 0 &&
        tier.discountPercent <= 100 &&
        Number.isFinite(tier.bonusMinutes) &&
        tier.bonusMinutes >= 0
    )
    .sort((a, b) => a.minSlots - b.minSlots);
  return { enabled, tiers, windows };
}

/**
 * Whether a slot start minute is inside the configured promo windows. Empty
 * windows means "all day" for backwards compatibility.
 */
export function isStartInComboPromoWindows(
  config: ComboPromoConfig,
  start: string | null | undefined
): boolean {
  if (config.windows.length === 0) return true;
  if (!start) return false;

  const startMinutes = comboPromoTimeToMinutes(start);
  if (startMinutes === null) return false;

  return config.windows.some((window) => {
    const windowStart = comboPromoTimeToMinutes(window.start);
    const windowEnd = comboPromoTimeToMinutes(window.end);
    if (windowStart === null || windowEnd === null) return false;
    if (windowEnd > windowStart) {
      return startMinutes >= windowStart && startMinutes < windowEnd;
    }
    return startMinutes >= windowStart || startMinutes < windowEnd;
  });
}

/**
 * Best-matching tier for a run of `runLength` adjacent slots: the tier with the
 * largest `minSlots` still `<= runLength`. Returns null when the promo is off
 * or no tier qualifies.
 */
export function tierForRun(config: ComboPromoConfig, runLength: number): ComboPromoTier | null {
  if (!config.enabled) return null;
  let best: ComboPromoTier | null = null;
  for (const tier of config.tiers) {
    if (runLength >= tier.minSlots && (!best || tier.minSlots > best.minSlots)) {
      best = tier;
    }
  }
  return best;
}
