export const LUCKY_WHEEL_SEGMENTS = [
  { key: "discount-5", label: "Giảm 5%", shortLabel: "5%", color: "#f35abd" },
  { key: "discount-10", label: "Giảm 10%", shortLabel: "10%", color: "#f6d76f" },
  { key: "discount-15", label: "Giảm 15%", shortLabel: "15%", color: "#7c6cff" },
  { key: "discount-20", label: "Giảm 20%", shortLabel: "20%", color: "#55d6b4" },
  { key: "better-luck", label: "May mắn lần sau", shortLabel: "Chúc may mắn", color: "#2f2035" },
] as const;

export type LuckyWheelPrizeKey = (typeof LUCKY_WHEEL_SEGMENTS)[number]["key"];

export const LUCKY_WHEEL_VOUCHER_DAYS = 7;

