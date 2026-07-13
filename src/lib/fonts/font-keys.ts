export const fontKeys = [
  "geist",
  "inter",
  "notoSans",
  "nunitoSans",
  "figtree",
  "roboto",
  "raleway",
  "dmSans",
  "publicSans",
  "outfit",
  "geistMono",
  "geistPixelSquare",
  "jetBrainsMono",
  "notoSerif",
  "robotoSlab",
  "merriweather",
  "lora",
  "playfairDisplay",
] as const;

export type FontKey = (typeof fontKeys)[number];

export const fontLabels: Record<FontKey, string> = {
  geist: "Geist",
  inter: "Inter",
  notoSans: "Noto Sans",
  nunitoSans: "Nunito Sans",
  figtree: "Figtree",
  roboto: "Roboto",
  raleway: "Raleway",
  dmSans: "DM Sans",
  publicSans: "Public Sans",
  outfit: "Outfit",
  geistMono: "Geist Mono",
  geistPixelSquare: "Geist Pixel Square",
  jetBrainsMono: "JetBrains Mono",
  notoSerif: "Noto Serif",
  robotoSlab: "Roboto Slab",
  merriweather: "Merriweather",
  lora: "Lora",
  playfairDisplay: "Playfair Display",
};

export const fontOptions = fontKeys.map((key) => ({
  key,
  label: fontLabels[key],
}));
