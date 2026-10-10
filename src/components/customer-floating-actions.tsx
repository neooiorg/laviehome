"use client";

import { Check, ChevronUp, Copy, Gift, MessageCircle, Phone } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CUSTOMER_CONTACT } from "@/config/customer-info";
import { compactPhone } from "@/lib/format";
import { DEFAULT_LUCKY_WHEEL_CONFIG, LUCKY_WHEEL_SEGMENTS, type LuckyWheelPrize } from "@/lib/lucky-wheel-config";

type SpinResult = {
  alreadySpun: boolean;
  prizeKey: string;
  prizeIndex: number;
  prizeLabel: string;
  prizePercent: number;
  voucherCode: string | null;
  voucherExpiresAt: string | null;
  phoneMasked: string;
  spinDate: string;
};

type WheelStatus = {
  enabled?: boolean;
  eligible: boolean;
  result: SpinResult | null;
  prizes?: LuckyWheelPrize[];
  error?: string;
};

function segmentAngle(segmentCount: number) {
  return 360 / segmentCount;
}

function polarPoint(radius: number, angleDegrees: number) {
  const radians = ((angleDegrees - 90) * Math.PI) / 180;
  return {
    x: 120 + radius * Math.cos(radians),
    y: 120 + radius * Math.sin(radians),
  };
}

function segmentPath(index: number, segmentCount: number) {
  const angle = segmentAngle(segmentCount);
  const start = polarPoint(108, index * angle);
  const end = polarPoint(108, (index + 1) * angle);
  return `M 120 120 L ${start.x} ${start.y} A 108 108 0 0 1 ${end.x} ${end.y} Z`;
}

function needsDarkText(color: string) {
  const hex = color.slice(1);
  const red = Number.parseInt(hex.slice(0, 2), 16);
  const green = Number.parseInt(hex.slice(2, 4), 16);
  const blue = Number.parseInt(hex.slice(4, 6), 16);
  return red * 0.299 + green * 0.587 + blue * 0.114 > 150;
}

function resultRotation(index: number, current: number, segmentCount: number) {
  const angle = segmentAngle(segmentCount);
  const completeTurns = Math.ceil(current / 360) * 360 + 5 * 360;
  return completeTurns - (index * angle + angle / 2);
}

function MiniWheelIcon() {
  return (
    <svg aria-hidden="true" className="lucky-wheel-mini size-8" viewBox="0 0 240 240">
      {LUCKY_WHEEL_SEGMENTS.map((segment, index) => (
        <path key={segment.key} d={segmentPath(index, LUCKY_WHEEL_SEGMENTS.length)} fill={segment.color} stroke="#fff8fb" strokeWidth="3" />
      ))}
      <circle cx="120" cy="120" r="109" fill="none" stroke="#f6d76f" strokeWidth="9" />
      <circle cx="120" cy="120" r="23" fill="#170c1d" stroke="#fff8fb" strokeWidth="7" />
      <circle cx="120" cy="120" r="8" fill="#f6d76f" />
    </svg>
  );
}

function WheelGraphic({ rotation, spinning, prizes }: { rotation: number; spinning: boolean; prizes: LuckyWheelPrize[] }) {
  const angle = segmentAngle(prizes.length);
  return (
    <div className="relative mx-auto size-[min(70vw,34dvh,17rem)] shrink-0">
      <div className="absolute left-1/2 top-[-0.35rem] z-20 -translate-x-1/2 drop-shadow-[0_4px_6px_rgba(0,0,0,0.45)]">
        <div className="h-0 w-0 border-x-[14px] border-t-[25px] border-x-transparent border-t-yellow-200" />
      </div>
      <svg
        aria-label="Vòng quay may mắn"
        className="size-full overflow-visible drop-shadow-[0_18px_35px_rgba(0,0,0,0.42)]"
        viewBox="0 0 240 240"
      >
        <g
          style={{
            transform: `rotate(${rotation}deg)`,
            transformBox: "fill-box",
            transformOrigin: "center",
            transition: spinning ? "transform 4.2s cubic-bezier(0.12, 0.74, 0.08, 1)" : "none",
          }}
        >
          {prizes.map((segment, index) => {
            const labelPoint = polarPoint(70, index * angle + angle / 2);
            const darkText = needsDarkText(segment.color);
            const fontSize = segment.shortLabel.length > 9 ? "6.5" : segment.shortLabel.length > 6 || prizes.length > 8 ? "8.5" : "13";
            return (
              <g key={segment.key}>
                <path d={segmentPath(index, prizes.length)} fill={segment.color} stroke="#fff4" strokeWidth="1.5" />
                <text
                  x={labelPoint.x}
                  y={labelPoint.y}
                  fill={darkText ? "#221124" : "#fffafc"}
                  fontSize={fontSize}
                  fontWeight="900"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  transform={`rotate(${index * angle + angle / 2} ${labelPoint.x} ${labelPoint.y})`}
                >
                  {segment.shortLabel}
                </text>
              </g>
            );
          })}
        </g>
        <circle cx="120" cy="120" r="109" fill="none" stroke="#f6d76f" strokeWidth="5" />
        <circle cx="120" cy="120" r="22" fill="#170c1d" stroke="#fff8fb" strokeWidth="4" />
        <circle cx="120" cy="120" r="8" fill="#f6d76f" />
      </svg>
    </div>
  );
}

function LuckyWheelDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<SpinResult | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [prizes, setPrizes] = useState<LuckyWheelPrize[]>(DEFAULT_LUCKY_WHEEL_CONFIG.prizes);
  const revealTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadStatus = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/lucky-wheel", { cache: "no-store" });
      const data = (await response.json()) as WheelStatus;
      if (!response.ok) throw new Error(data.error || "Không thể kiểm tra lượt quay.");
      if (data.prizes?.length) setPrizes(data.prizes);
      setResult(data.result);
      if (data.result) {
        setRotation(resultRotation(data.result.prizeIndex, 0, data.prizes?.length || DEFAULT_LUCKY_WHEEL_CONFIG.prizes.length));
      } else {
        setRotation(0);
      }
    } catch (statusError) {
      setError(statusError instanceof Error ? statusError.message : "Không thể kiểm tra lượt quay.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) void loadStatus();
    return () => {
      if (revealTimer.current) clearTimeout(revealTimer.current);
    };
  }, [loadStatus, open]);

  function handleOpenChange(nextOpen: boolean) {
    onOpenChange(nextOpen);
    if (!nextOpen && revealTimer.current) clearTimeout(revealTimer.current);
  }

  async function handleSpin() {
    if (spinning || loading) return;
    setLoading(true);
    setError("");
    setCopied(false);

    try {
      const response = await fetch("/api/lucky-wheel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = (await response.json()) as { result?: SpinResult; prizes?: LuckyWheelPrize[]; error?: string };
      if (!response.ok || !data.result) throw new Error(data.error || "Không thể thực hiện lượt quay.");
      const activePrizes = data.prizes?.length ? data.prizes : prizes;
      setPrizes(activePrizes);

      if (data.result.alreadySpun) {
        setResult(data.result);
        setRotation(resultRotation(data.result.prizeIndex, rotation, activePrizes.length));
        return;
      }

      setSpinning(true);
      setRotation((current) => resultRotation(data.result!.prizeIndex, current, activePrizes.length));
      revealTimer.current = setTimeout(() => {
        setResult(data.result!);
        setSpinning(false);
      }, 4300);
    } catch (spinError) {
      setError(spinError instanceof Error ? spinError.message : "Không thể thực hiện lượt quay.");
    } finally {
      setLoading(false);
    }
  }

  async function copyVoucher() {
    if (!result?.voucherCode) return;
    await navigator.clipboard.writeText(result.voucherCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  const expiryLabel = result?.voucherExpiresAt
    ? new Intl.DateTimeFormat("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(result.voucherExpiresAt))
    : null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="z-[101] flex max-h-[calc(100dvh-1rem)] w-[min(96vw,34rem)] max-w-none overflow-hidden border border-pink-200/25 bg-[#170c1d] p-0 text-white shadow-[0_24px_80px_rgba(0,0,0,0.58)] sm:max-h-[min(44rem,calc(100dvh-2rem))] sm:rounded-[1.75rem]"
        overlayClassName="z-[100] bg-black/65 backdrop-blur-sm"
        showCloseButton={!spinning}
      >
        <div className="scrollbar-thin scrollbar-gutter-stable flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain p-4 sm:p-6">
          <DialogHeader className="shrink-0 px-6 text-center">
            <DialogTitle className="text-2xl font-black tracking-[-0.03em] text-pink-100 sm:text-3xl">
              Vòng quay may mắn
            </DialogTitle>
            <DialogDescription className="text-sm font-semibold leading-5 text-white/65 sm:leading-6">
              Mỗi thiết bị có một lượt quay trong ngày. Voucher chỉ dùng cho số điện thoại đã nhập.
            </DialogDescription>
          </DialogHeader>

          <WheelGraphic rotation={rotation} spinning={spinning} prizes={prizes} />

          {loading && !spinning && !result ? (
            <div className="min-h-24 shrink-0 animate-pulse rounded-2xl border border-white/10 bg-white/5" />
          ) : result ? (
            <div className="shrink-0 rounded-2xl border border-pink-200/25 bg-white/[0.06] p-4 text-center">
              <p className="text-xs font-black uppercase tracking-[0.15em] text-yellow-200">
                {result.alreadySpun ? "Kết quả hôm nay" : "Phần thưởng của bạn"}
              </p>
              <p className="mt-2 text-2xl font-black text-pink-100">{result.prizeLabel}</p>
              {result.voucherCode ? (
                <>
                  <button
                    type="button"
                    onClick={() => void copyVoucher()}
                    className="mx-auto mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-yellow-200/45 bg-yellow-200/10 px-4 font-mono text-lg font-black tracking-[0.12em] text-yellow-100 transition hover:bg-yellow-200/15"
                  >
                    {result.voucherCode} {copied ? <Check size={17} /> : <Copy size={17} />}
                  </button>
                  <p className="mt-3 text-xs font-semibold leading-5 text-white/55">
                    Dùng cho số {result.phoneMasked}. Hạn đến {expiryLabel}. Chỉ áp dụng tiền phòng và không cộng dồn mã khác.
                  </p>
                </>
              ) : (
                <p className="mt-2 text-sm font-semibold text-white/58">Hẹn bạn quay lại vào ngày mai.</p>
              )}
            </div>
          ) : (
            <div className="shrink-0 space-y-3">
              <label className="grid gap-2 text-sm font-bold text-white/75">
                Số điện thoại nhận voucher
                <input
                  autoComplete="tel"
                  inputMode="tel"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="Ví dụ: 0938 123 456"
                  className="min-h-12 w-full rounded-xl border border-white/15 bg-white/[0.06] px-4 text-base font-bold text-white outline-none transition placeholder:text-white/40 focus:border-pink-300 focus:ring-2 focus:ring-pink-300/20"
                />
              </label>
              <button
                type="button"
                disabled={loading || spinning || !phone.trim()}
                onClick={() => void handleSpin()}
                className="primary-button min-h-12 w-full text-base disabled:cursor-not-allowed disabled:opacity-45"
              >
                <Gift size={18} /> {loading ? "Đang kiểm tra..." : "Quay ngay"}
              </button>
            </div>
          )}

          {spinning && <p className="shrink-0 text-center text-sm font-bold text-yellow-100">Vòng quay đang chọn phần thưởng...</p>}
          {error && <p role="alert" className="shrink-0 rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-center text-sm font-bold text-red-200">{error}</p>}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function CustomerFloatingActions({ luckyWheelEnabled = true }: { luckyWheelEnabled?: boolean }) {
  const [wheelOpen, setWheelOpen] = useState(false);

  return (
    <>
      <div className="fixed bottom-7 right-5 z-40 hidden flex-col gap-3 md:flex">
        {luckyWheelEnabled && (
          <div className="relative flex justify-end">
            <span className="lucky-wheel-callout" aria-hidden="true">Quay nhận ưu đãi</span>
            <button
              type="button"
              className="float-button border border-yellow-200/70 bg-[#170c1d] shadow-[0_0_26px_rgba(243,90,189,0.48)]"
              onClick={() => setWheelOpen(true)}
              aria-label="Mở vòng quay may mắn"
            >
              <MiniWheelIcon />
            </button>
          </div>
        )}
        <a className="float-button bg-slate-700" href="#top" aria-label="Lên đầu trang">
          <ChevronUp size={22} />
        </a>
        <a className="float-button bg-emerald-500" href={`tel:${compactPhone(CUSTOMER_CONTACT.phoneLocalCompact)}`} aria-label="Gọi ngay">
          <Phone size={22} />
        </a>
        <a className="float-button bg-blue-600" href={CUSTOMER_CONTACT.zaloUrl} aria-label="Zalo" target="_blank" rel="noopener noreferrer">
          <MessageCircle size={20} />
        </a>
      </div>

      {luckyWheelEnabled && (
        <div className="fixed bottom-[9.25rem] right-3 z-40 flex items-center md:hidden">
          <span className="lucky-wheel-callout" aria-hidden="true">Quay nhận ưu đãi</span>
          <button
            type="button"
            onClick={() => setWheelOpen(true)}
            className="flex size-12 items-center justify-center rounded-full border border-yellow-200/70 bg-[#170c1d] shadow-[0_10px_28px_rgba(0,0,0,0.45),0_0_22px_rgba(243,90,189,0.38)]"
            aria-label="Mở vòng quay may mắn"
          >
            <MiniWheelIcon />
          </button>
        </div>
      )}

      {luckyWheelEnabled && <LuckyWheelDialog open={wheelOpen} onOpenChange={setWheelOpen} />}
    </>
  );
}
