"use client";

import * as React from "react";
import { Disc3, Gift, Save, TicketCheck, Users } from "lucide-react";
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
import {
  LUCKY_WHEEL_SEGMENTS,
  type LuckyWheelConfig,
  type LuckyWheelPrizeKey,
} from "@/lib/lucky-wheel-config";

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
  const totalWeight = Object.values(config.weights).reduce((sum, value) => sum + value, 0);
  const winRate = report.totalSpins ? Math.round((report.winningSpins / report.totalSpins) * 100) : 0;

  function updateWeight(key: LuckyWheelPrizeKey, value: number) {
    const weight = Number.isFinite(value) ? Math.min(100, Math.max(0, Math.round(value))) : 0;
    setConfig((current) => ({
      ...current,
      weights: { ...current.weights, [key]: weight },
    }));
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
              <div className="flex items-end justify-between gap-4">
                <div>
                  <Label>Tỷ lệ phần thưởng</Label>
                  <p className="mt-1 text-sm text-muted-foreground">Nhập phần trăm cho từng ô. Tổng phải đúng 100%.</p>
                </div>
                <Badge variant={totalWeight === 100 ? "secondary" : "destructive"}>{totalWeight}% / 100%</Badge>
              </div>

              <div className="overflow-hidden rounded-lg border">
                {LUCKY_WHEEL_SEGMENTS.map((segment) => (
                  <div key={segment.key} className="grid grid-cols-[minmax(0,1fr)_5.5rem] items-center gap-4 border-b p-3 last:border-b-0">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="size-3 shrink-0 rounded-full ring-1 ring-black/10" style={{ backgroundColor: segment.color }} />
                        <span className="truncate text-sm font-medium">{segment.label}</span>
                      </div>
                      <Progress value={config.weights[segment.key]} className="mt-2 h-1.5" />
                    </div>
                    <div className="relative">
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        inputMode="numeric"
                        value={config.weights[segment.key]}
                        onChange={(event) => updateWeight(segment.key, Number(event.target.value))}
                        disabled={pending}
                        className="pr-7 text-right tabular-nums"
                        aria-label={`Tỷ lệ ${segment.label}`}
                      />
                      <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-xs text-muted-foreground">%</span>
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
              const segment = LUCKY_WHEEL_SEGMENTS.find((entry) => entry.key === item.prizeKey);
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
