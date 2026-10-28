export const SEASONAL_PRESETS = {
  christmas: 'Noel',
  tet: 'Tết',
  spring: 'Mùa xuân',
  summer: 'Mùa hè',
  autumn: 'Mùa thu',
  winter: 'Mùa đông',
} as const;

export type SeasonalPreset = keyof typeof SEASONAL_PRESETS;

export type SeasonalEffectConfig = {
  enabled: boolean;
  preset: SeasonalPreset;
  startDate: string;
  endDate: string;
  intensity: 'light' | 'normal';
};

export const DEFAULT_SEASONAL_EFFECT_CONFIG: SeasonalEffectConfig = {
  enabled: false,
  preset: 'christmas',
  startDate: '',
  endDate: '',
  intensity: 'light',
};

const isDate = (value: unknown): value is string =>
  typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) &&
  !Number.isNaN(Date.parse(`${value}T00:00:00Z`));

export function normalizeSeasonalEffectConfig(value: unknown): SeasonalEffectConfig {
  if (!value || typeof value !== 'object') return DEFAULT_SEASONAL_EFFECT_CONFIG;
  const raw = value as Record<string, unknown>;
  return {
    enabled: raw.enabled === true,
    preset: typeof raw.preset === 'string' && raw.preset in SEASONAL_PRESETS
      ? raw.preset as SeasonalPreset : 'christmas',
    startDate: isDate(raw.startDate) ? raw.startDate : '',
    endDate: isDate(raw.endDate) ? raw.endDate : '',
    intensity: raw.intensity === 'normal' ? 'normal' : 'light',
  };
}

export function isSeasonalEffectActive(config: SeasonalEffectConfig, date: string): boolean {
  return config.enabled && (!config.startDate || date >= config.startDate) &&
    (!config.endDate || date <= config.endDate);
}
