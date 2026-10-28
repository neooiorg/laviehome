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
  intensity: 'light' | 'normal' | 'high';
};

export const DEFAULT_SEASONAL_EFFECT_CONFIG: SeasonalEffectConfig = {
  enabled: false,
  preset: 'christmas',
  intensity: 'light',
};

export function normalizeSeasonalEffectConfig(value: unknown): SeasonalEffectConfig {
  if (!value || typeof value !== 'object') return DEFAULT_SEASONAL_EFFECT_CONFIG;
  const raw = value as Record<string, unknown>;
  return {
    enabled: raw.enabled === true,
    preset: typeof raw.preset === 'string' && raw.preset in SEASONAL_PRESETS
      ? raw.preset as SeasonalPreset : 'christmas',
    intensity: raw.intensity === 'high' ? 'high' : raw.intensity === 'normal' ? 'normal' : 'light',
  };
}
