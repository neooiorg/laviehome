import {
  AirVent,
  Bath,
  BedDouble,
  Car,
  CheckCircle2,
  Coffee,
  CookingPot,
  DoorOpen,
  Droplets,
  Dumbbell,
  Film,
  Gift,
  Heart,
  KeyRound,
  Mountain,
  Projector,
  Refrigerator,
  ShieldCheck,
  ShowerHead,
  Sofa,
  Sunrise,
  Tv,
  UserRound,
  WashingMachine,
  Waves,
  Wifi,
  Wind,
  Wine,
} from "lucide-react";
import type { ElementType } from "react";

export type AmenityIconOption = { key: string; label: string; Icon: ElementType };

// Curated catalog of amenity icons shown in the admin picker. `key` is the
// stable identifier persisted with each amenity (see encoding below); `label`
// is the Vietnamese name shown in the picker tooltip.
export const AMENITY_ICONS: AmenityIconOption[] = [
  { key: "wifi", label: "Wifi / Internet", Icon: Wifi },
  { key: "tv", label: "Tivi / Smart TV", Icon: Tv },
  { key: "projector", label: "Máy chiếu", Icon: Projector },
  { key: "film", label: "Netflix / Phim", Icon: Film },
  { key: "ac", label: "Điều hòa", Icon: AirVent },
  { key: "fan", label: "Quạt", Icon: Wind },
  { key: "fridge", label: "Tủ lạnh", Icon: Refrigerator },
  { key: "minibar", label: "Minibar / Rượu", Icon: Wine },
  { key: "kitchen", label: "Bếp nấu", Icon: CookingPot },
  { key: "coffee", label: "Cà phê / Trà", Icon: Coffee },
  { key: "bathtub", label: "Bồn tắm / Jacuzzi", Icon: Bath },
  { key: "shower", label: "Vòi sen", Icon: ShowerHead },
  { key: "hotwater", label: "Nước nóng", Icon: Droplets },
  { key: "wc", label: "WC / Vệ sinh", Icon: DoorOpen },
  { key: "balcony", label: "Ban công", Icon: Sunrise },
  { key: "view", label: "View đẹp", Icon: Mountain },
  { key: "keycard", label: "Self check-in", Icon: KeyRound },
  { key: "security", label: "Camera an ninh", Icon: ShieldCheck },
  { key: "bed", label: "Giường", Icon: BedDouble },
  { key: "sofa", label: "Sofa / Ghế", Icon: Sofa },
  { key: "mirror", label: "Gương", Icon: UserRound },
  { key: "washer", label: "Máy giặt", Icon: WashingMachine },
  { key: "parking", label: "Chỗ đỗ xe", Icon: Car },
  { key: "pool", label: "Hồ bơi", Icon: Waves },
  { key: "gym", label: "Phòng gym", Icon: Dumbbell },
  { key: "love", label: "Phòng tình yêu", Icon: Heart },
  { key: "gift", label: "Quà tặng", Icon: Gift },
  { key: "check", label: "Khác (dấu tích)", Icon: CheckCircle2 },
];

const ICON_BY_KEY: Record<string, ElementType> = Object.fromEntries(
  AMENITY_ICONS.map((o) => [o.key, o.Icon])
);

// Substring (case-insensitive) → catalog key, used to auto-suggest an icon from
// the amenity text and to keep legacy plain-string amenities looking right.
// Order matters: the first matching keyword wins, so more specific keywords must
// come before generic ones (e.g. "tủ lạnh"/"nóng lạnh" before "điều hòa" so they
// don't both grab the "lạnh" substring).
const KEYWORD_TO_KEY: [string, string][] = [
  ["netflix", "film"],
  ["phim", "film"],
  ["máy chiếu", "projector"],
  ["chiếu", "projector"],
  ["smart tv", "tv"],
  ["tivi", "tv"],
  ["ti vi", "tv"],
  ["tv", "tv"],
  ["wifi", "wifi"],
  ["internet", "wifi"],
  ["tủ lạnh", "fridge"],
  ["minibar", "minibar"],
  ["mini bar", "minibar"],
  ["rượu", "minibar"],
  ["bếp", "kitchen"],
  ["cà phê", "coffee"],
  ["cafe", "coffee"],
  ["trà", "coffee"],
  ["bồn tắm", "bathtub"],
  ["jacuzzi", "bathtub"],
  ["bồn", "bathtub"],
  ["vòi sen", "shower"],
  ["sen", "shower"],
  ["nước nóng", "hotwater"],
  ["nóng lạnh", "hotwater"],
  ["wc", "wc"],
  ["toilet", "wc"],
  ["vệ sinh", "wc"],
  ["điều hòa", "ac"],
  ["điều hoà", "ac"],
  ["máy lạnh", "ac"],
  ["quạt", "fan"],
  ["ban công", "balcony"],
  ["balcony", "balcony"],
  ["view", "view"],
  ["check-in", "keycard"],
  ["check in", "keycard"],
  ["self check", "keycard"],
  ["check cam", "security"],
  ["camera", "security"],
  ["an ninh", "security"],
  ["giường", "bed"],
  ["sofa", "sofa"],
  ["ghế", "sofa"],
  ["gương", "mirror"],
  ["máy giặt", "washer"],
  ["giặt", "washer"],
  ["đỗ xe", "parking"],
  ["bãi xe", "parking"],
  ["gửi xe", "parking"],
  ["đậu xe", "parking"],
  ["hồ bơi", "pool"],
  ["bể bơi", "pool"],
  ["bơi", "pool"],
  ["gym", "gym"],
  ["phòng tập", "gym"],
  ["tình yêu", "love"],
  ["tặng", "gift"],
  ["quà", "gift"],
];

const DELIM = "::";

// Amenities are persisted as `string[]`. To attach a chosen icon we prefix the
// text with `<iconKey>::`. Legacy amenities have no prefix and fall back to the
// keyword auto-mapping, so nothing breaks for existing rooms.
export function parseAmenity(raw: string): { iconKey: string | null; text: string } {
  const idx = raw.indexOf(DELIM);
  if (idx > -1) {
    const key = raw.slice(0, idx);
    if (ICON_BY_KEY[key]) return { iconKey: key, text: raw.slice(idx + DELIM.length) };
  }
  return { iconKey: null, text: raw };
}

export function formatAmenity(iconKey: string | null, text: string): string {
  const t = text.trim();
  return iconKey ? `${iconKey}${DELIM}${t}` : t;
}

export function autoIconKey(text: string): string {
  const lower = text.toLocaleLowerCase("vi-VN");
  const hit = KEYWORD_TO_KEY.find(([kw]) => lower.includes(kw));
  return hit?.[1] ?? "check";
}

export function amenityIconByKey(key: string): ElementType {
  return ICON_BY_KEY[key] ?? CheckCircle2;
}

// Effective icon key for a stored amenity: explicit prefix if present,
// otherwise auto-mapped from the text.
export function effectiveIconKey(raw: string): string {
  const { iconKey, text } = parseAmenity(raw);
  return iconKey ?? autoIconKey(text);
}

// Icon component for a stored amenity (explicit prefix → auto-map → check).
export function resolveAmenityIcon(raw: string): ElementType {
  return amenityIconByKey(effectiveIconKey(raw));
}
