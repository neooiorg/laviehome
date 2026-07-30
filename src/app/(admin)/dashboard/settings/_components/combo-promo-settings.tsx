"use client";

import * as React from "react";
import { Percent, Plus, Sparkles, Trash2, TriangleAlert } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  DEFAULT_COMBO_PROMO_CONFIG,
  type ComboPromoConfig,
  type ComboPromoTier,
} from "@/lib/combo-promo";
import { setComboPromoConfig } from "@/lib/settings-actions";

type TierField = keyof ComboPromoTier;

export function ComboPromoSettings({ initialConfig }: { initialConfig: ComboPromoConfig }) {
  const [enabled, setEnabled] = React.useState(initialConfig.enabled);
  const [tiers, setTiers] = React.useState<ComboPromoTier[]>(
    initialConfig.tiers.length ? initialConfig.tiers : DEFAULT_COMBO_PROMO_CONFIG.tiers
  );
  const [pending, startTransition] = React.useTransition();

  function updateTier(index: number, field: TierField, value: number) {
    setTiers((current) =>
      current.map((tier, i) => (i === index ? { ...tier, [field]: value } : tier))
    );
  }

  function addTier() {
    setTiers((current) => {
      const maxSlots = current.reduce((max, tier) => Math.max(max, tier.minSlots), 1);
      return [...current, { minSlots: maxSlots + 1, discountPercent: 0, bonusMinutes: 0 }];
    });
  }

  function removeTier(index: number) {
    setTiers((current) => current.filter((_, i) => i !== index));
  }

  function handleSave() {
    startTransition(async () => {
      try {
        await setComboPromoConfig({ enabled, tiers });
        toast.success("Đã lưu chương trình khuyến mãi khung giờ");
      } catch {
        toast.error("Không thể lưu. Vui lòng thử lại.");
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="size-5 text-muted-foreground" /> Khuyến mãi khung giờ (combo)
        </CardTitle>
        <CardDescription>
          Ưu đãi khi khách đặt nhiều khung giờ liền kề trong cùng một ngày. Cấu hình từng mốc: số
          khung giờ tối thiểu, % giảm và số phút tặng thêm.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
          <div className="space-y-0.5">
            <Label htmlFor="combo-promo" className="text-base">
              Bật khuyến mãi combo
            </Label>
            <p className="text-sm text-muted-foreground">
              {enabled
                ? "Khách được giảm giá và tặng thêm phút khi đặt nhiều khung giờ liền kề."
                : "Đã tắt — khách trả nguyên giá cho mọi khung giờ, không có ưu đãi combo."}
            </p>
          </div>
          <Switch id="combo-promo" checked={enabled} onCheckedChange={setEnabled} disabled={pending} />
        </div>

        <div className={enabled ? "space-y-3" : "space-y-3 opacity-50"}>
          <div className="grid grid-cols-[1fr_1fr_1fr_auto] items-center gap-2 px-1 text-xs font-semibold text-muted-foreground">
            <span>Số khung giờ (từ)</span>
            <span>Giảm (%)</span>
            <span>Tặng (phút)</span>
            <span className="sr-only">Xoá</span>
          </div>

          {tiers.length === 0 && (
            <p className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
              Chưa có mốc ưu đãi nào. Thêm mốc để bật giảm giá theo combo.
            </p>
          )}

          {tiers.map((tier, index) => (
            <div key={index} className="grid grid-cols-[1fr_1fr_1fr_auto] items-center gap-2">
              <Input
                type="number"
                min={2}
                inputMode="numeric"
                value={Number.isFinite(tier.minSlots) ? tier.minSlots : ""}
                onChange={(event) => updateTier(index, "minSlots", Number(event.target.value))}
                disabled={!enabled || pending}
              />
              <Input
                type="number"
                min={0}
                max={100}
                inputMode="numeric"
                value={Number.isFinite(tier.discountPercent) ? tier.discountPercent : ""}
                onChange={(event) => updateTier(index, "discountPercent", Number(event.target.value))}
                disabled={!enabled || pending}
              />
              <Input
                type="number"
                min={0}
                inputMode="numeric"
                value={Number.isFinite(tier.bonusMinutes) ? tier.bonusMinutes : ""}
                onChange={(event) => updateTier(index, "bonusMinutes", Number(event.target.value))}
                disabled={!enabled || pending}
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                onClick={() => removeTier(index)}
                disabled={!enabled || pending}
                aria-label="Xoá mốc"
              >
                <Trash2 />
              </Button>
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addTier}
            disabled={!enabled || pending}
          >
            <Plus /> Thêm mốc ưu đãi
          </Button>
        </div>

        <div className="flex items-start gap-2.5 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-600 dark:text-amber-400">
          <Percent className="mt-0.5 size-4 shrink-0" />
          <span>
            Ưu đãi tính riêng cho từng ngày và chỉ áp dụng cho các khung giờ <strong>liền kề</strong>.
            Với một chuỗi khung giờ, hệ thống chọn mốc cao nhất phù hợp.
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Button type="button" onClick={handleSave} disabled={pending}>
            {pending ? "Đang lưu..." : "Lưu thay đổi"}
          </Button>
          {!enabled && (
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <TriangleAlert className="size-4" /> Khuyến mãi đang tắt
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
