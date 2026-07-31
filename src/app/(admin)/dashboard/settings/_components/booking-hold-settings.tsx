"use client";

import * as React from "react";
import { Timer } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { setBookingHoldMinutes } from "@/lib/settings-actions";

export function BookingHoldSettings({ initialMinutes }: { initialMinutes: number }) {
  const [value, setValue] = React.useState(String(initialMinutes));
  const [saved, setSaved] = React.useState(initialMinutes);
  const [pending, startTransition] = React.useTransition();

  const parsed = Math.trunc(Number(value));
  const isValid = Number.isFinite(parsed) && parsed >= 0;
  const isDirty = isValid && parsed !== saved;

  function handleSave() {
    if (!isValid || !isDirty) return;
    startTransition(async () => {
      try {
        await setBookingHoldMinutes(parsed);
        setSaved(parsed);
        toast.success(
          parsed === 0
            ? "Đã tắt tự nhả phòng — đơn chưa thanh toán sẽ giữ chỗ vô thời hạn."
            : `Đã lưu: nhả phòng sau ${parsed} phút chưa thanh toán.`
        );
      } catch {
        toast.error("Không thể lưu. Vui lòng thử lại.");
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Timer className="size-5 text-muted-foreground" /> Tự nhả phòng khi chưa thanh toán
        </CardTitle>
        <CardDescription>
          Đơn đặt online ở trạng thái &quot;Chờ thanh toán&quot; sẽ tự nhả khung giờ sau số phút này để
          khách khác có thể đặt. Đặt <strong>0</strong> để tắt (giữ chỗ vô thời hạn).
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-end justify-between gap-4 rounded-lg border p-4">
          <div className="space-y-1.5">
            <Label htmlFor="booking-hold-minutes" className="text-base">
              Thời gian giữ chỗ (phút)
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="booking-hold-minutes"
                type="number"
                min={0}
                max={1440}
                inputMode="numeric"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="w-28"
              />
              <span className="text-sm text-muted-foreground">phút</span>
            </div>
            {!isValid && <p className="text-sm text-red-500">Nhập một số nguyên ≥ 0.</p>}
          </div>
          <Button onClick={handleSave} disabled={pending || !isDirty || !isValid}>
            {pending ? "Đang lưu..." : "Lưu"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
