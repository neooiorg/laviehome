"use client";

import * as React from "react";
import { Disc3, Gift, Plus, Save, TicketCheck, Trash2, Users } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import type { LuckyWheelAdminReport } from "@/lib/lucky-wheel-admin";
import { updateLuckyWheelConfig } from "@/lib/lucky-wheel-admin-actions";
import type { LuckyWheelConfig, LuckyWheelPrize } from "@/lib/lucky-wheel-config";

function MetricCard({
  icon: Icon,
  label,
  value,
  note,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | string;
  note: string;
}) {
  return (
    <Card size="sm">
      <CardContent className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
          <p className="mt-1 text-xs text-muted-foreground">{note}</p>
        </div>
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
          <Icon className="size-4.5 text-muted-foreground" />
        </div>
      </CardContent>
    </Card>
  );
}

export function LuckyWheelAdmin({
  initialConfig,
  report,
}: {
  initialConfig: LuckyWheelConfig;
  report: LuckyWheelAdminReport;
}) {
  const [config, setConfig] = React.useState(initialConfig);
  const [pending, startTransition] = React.useTransition();
  const totalWeight = config.prizes.reduce((sum, prize) => sum + prize.weight, 0);
  const winRate = report.totalSpins ? Math.round((report.winningSpins / report.totalSpins) * 100) : 0;

  function updatePrize(key: string, updates: Partial<LuckyWheelPrize>) {
    setConfig((current) => ({
      ...current,
      prizes: current.prizes.map((prize) => prize.key === key ? { ...prize, ...updates } : prize),
    }));
  }

  function addPrize() {
    if (config.prizes.length >= 12) {
      toast.error("Tối đa 12 ô phần thưởng trên vòng quay.");
      return;
    }
    const color = ["#f35abd", "#f6d76f", "#7c6cff", "#55d6b4", "#2f2035", "#54a9f5"][config.prizes.length % 6];
    const newPrize: LuckyWheelPrize = {
      key: `prize-${crypto.randomUUID().replaceAll("-", "").slice(0, 16)}`,
      label: "Phần thưởng mới",
      shortLabel: "Mới",
      color,
      percent: 0,
      weight: 0,
    };
    setConfig((current) => ({ ...current, prizes: [...current.prizes, newPrize] }));
  }

  function removePrize(key: string) {
    if (config.prizes.length <= 2) {
      toast.error("Vòng quay cần tối thiểu 2 ô phần thưởng.");
      return;
    }
    setConfig((current) => {
      const removed = current.prizes.find((prize) => prize.key === key);
      const prizes = current.prizes.filter((prize) => prize.key !== key);
      if (removed && prizes.length) prizes[0] = { ...prizes[0], weight: prizes[0].weight + removed.weight };
      return { ...current, prizes };
    });
  }

  function handleSave() {
    if (totalWeight !== 100) {
      toast.error("Tổng tỷ lệ phần thưởng phải bằng 100%.");
      return;
    }

    startTransition(async () => {
      try {
        const saved = await updateLuckyWheelConfig(config);
        setConfig(saved);
        toast.success("Đã lưu cấu hình vòng quay");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Không thể lưu cấu hình.");
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={Disc3} label="Lượt quay hôm nay" value={report.todaySpins} note="Theo giờ Việt Nam" />
        <MetricCard icon={Users} label="7 ngày gần nhất" value={report.last7DaysSpins} note={`${report.totalSpins} lượt từ trước đến nay`} />
        <MetricCard icon={Gift} label="Voucher đã phát" value={report.vouchersIssued} note={`Tỷ lệ trúng thực tế ${winRate}%`} />
        <MetricCard icon={TicketCheck} label="Voucher đã dùng" value={report.vouchersUsed} note="Đã ghi nhận trong đơn đặt phòng" />
      </div>

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(22rem,0.9fr)]">
        <Card>
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Disc3 className="size-5 text-muted-foreground" /> Cài đặt vòng quay
            </CardTitle>
            <CardDescription>Tỷ lệ áp dụng cho các lượt quay mới ngay sau khi lưu.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
              <div className="space-y-1">
                <Label htmlFor="lucky-wheel-enabled" className="text-sm font-semibold">Cho phép khách quay</Label>
                <p className="text-sm text-muted-foreground">
                  {config.enabled ? "Nút vòng quay đang hiển thị trên website." : "Nút và API quay thưởng đang tạm dừng."}
                </p>
              </div>
              <Switch
                id="lucky-wheel-enabled"
                checked={config.enabled}
                onCheckedChange={(enabled) => setConfig((current) => ({ ...current, enabled }))}
                disabled={pending}
              />
            </div>

            <div className="grid gap-2 sm:max-w-xs">
              <Label htmlFor="voucher-days">Hạn sử dụng voucher</Label>
              <div className="relative">
                <Input
                  id="voucher-days"
                  type="number"
                  min={1}
                  max={90}
                  inputMode="numeric"
                  value={config.voucherDays}
                  onChange={(event) => setConfig((current) => ({
                    ...current,
                    voucherDays: Math.min(90, Math.max(1, Number(event.target.value) || 1)),
                  }))}
                  disabled={pending}
                  className="pr-14"
                />
                <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted-foreground">ngày</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <Label>Ô phần thưởng</Label>
                  <p className="mt-1 text-sm text-muted-foreground">Thêm, sửa hoặc xóa ô. Tổng tỷ lệ trúng phải đúng 100%; mức giảm 0% không phát voucher.</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={totalWeight === 100 ? "secondary" : "destructive"}>{totalWeight}% / 100%</Badge>
                  <Button type="button" size="sm" variant="outline" onClick={addPrize} disabled={pending || config.prizes.length >= 12}>
                    <Plus className="size-4" /> Thêm ô
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                {config.prizes.map((prize, index) => (
                    <div key={prize.key} className="rounded-lg border p-3 sm:p-4">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-2">
                          <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">{index + 1}</span>
                          <span className="truncate text-sm font-semibold">{prize.label || "Ô phần thưởng"}</span>
                        </div>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          aria-label={`Xóa ${prize.label}`}
                          onClick={() => removePrize(prize.key)}
                          disabled={pending || config.prizes.length <= 2}
                        >
                          <Trash2 className="size-4 text-destructive" />
                        </Button>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="grid gap-1.5">
                          <Label htmlFor={`prize-label-${prize.key}`}>Tên phần thưởng</Label>
                          <Input id={`prize-label-${prize.key}`} maxLength={60} value={prize.label} onChange={(event) => updatePrize(prize.key, { label: event.target.value })} disabled={pending} />
                        </div>
                        <div className="grid gap-1.5">
                          <Label htmlFor={`prize-short-${prize.key}`}>Chữ trên vòng quay</Label>
                          <Input id={`prize-short-${prize.key}`} maxLength={16} value={prize.shortLabel} onChange={(event) => updatePrize(prize.key, { shortLabel: event.target.value })} disabled={pending} />
                        </div>
                        <div className="grid gap-1.5">
                          <Label htmlFor={`prize-percent-${prize.key}`}>Giảm giá (%)</Label>
                          <Input id={`prize-percent-${prize.key}`} type="number" min={0} max={100} inputMode="numeric" value={prize.percent} onChange={(event) => updatePrize(prize.key, { percent: Math.min(100, Math.max(0, Number(event.target.value) || 0)) })} disabled={pending} />
                          <p className="text-xs text-muted-foreground">Đặt 0 nếu đây là ô không trúng voucher.</p>
                        </div>
                        <div className="grid gap-1.5">
                          <Label htmlFor={`prize-weight-${prize.key}`}>Tỷ lệ xuất hiện (%)</Label>
                          <div className="relative">
                            <Input id={`prize-weight-${prize.key}`} type="number" min={0} max={100} inputMode="numeric" value={prize.weight} onChange={(event) => updatePrize(prize.key, { weight: Math.min(100, Math.max(0, Number(event.target.value) || 0)) })} disabled={pending} className="pr-7 text-right tabular-nums" />
                            <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-xs text-muted-foreground">%</span>
                          </div>
                          <Progress value={prize.weight} className="h-1.5" />
                        </div>
                        <div className="grid gap-1.5 sm:col-span-2">
                          <Label htmlFor={`prize-color-${prize.key}`}>Màu ô</Label>
                          <div className="flex items-center gap-3">
                            <Input id={`prize-color-${prize.key}`} type="color" value={prize.color} onChange={(event) => updatePrize(prize.key, { color: event.target.value })} disabled={pending} className="h-10 w-14 cursor-pointer p-1" />
                            <span className="font-mono text-xs uppercase text-muted-foreground">{prize.color}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                ))}
              </div>
            </div>

            <Button type="button" onClick={handleSave} disabled={pending || totalWeight !== 100}>
              <Save className="size-4" /> {pending ? "Đang lưu..." : "Lưu cấu hình"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b">
            <CardTitle className="text-lg">Kết quả thực tế</CardTitle>
            <CardDescription>Phân bố của toàn bộ lượt quay đã ghi nhận.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {report.distribution.length ? report.distribution.map((item) => {
              const segment = config.prizes.find((entry) => entry.key === item.prizeKey);
              const percent = report.totalSpins ? Math.round((item.count / report.totalSpins) * 100) : 0;
              return (
                <div key={item.prizeKey} className="space-y-2">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="flex min-w-0 items-center gap-2 font-medium">
                      <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: segment?.color ?? "#64748b" }} />
                      <span className="truncate">{item.prizeLabel}</span>
                    </span>
                    <span className="shrink-0 tabular-nums text-muted-foreground">{item.count} lượt · {percent}%</span>
                  </div>
                  <Progress value={percent} className="h-2" />
                </div>
              );
            }) : (
              <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                Chưa có lượt quay nào để thống kê.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
