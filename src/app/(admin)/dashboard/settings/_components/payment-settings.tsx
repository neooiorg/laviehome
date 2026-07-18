"use client";

import * as React from "react";
import { CreditCard, TriangleAlert } from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { setOnlinePaymentEnabled } from "@/lib/settings-actions";

export function PaymentSettings({ initialEnabled }: { initialEnabled: boolean }) {
  const [enabled, setEnabled] = React.useState(initialEnabled);
  const [pending, startTransition] = React.useTransition();

  function handleToggle(next: boolean) {
    setEnabled(next); // optimistic
    startTransition(async () => {
      try {
        await setOnlinePaymentEnabled(next);
        toast.success(
          next ? "Đã bật thanh toán online" : "Đã tắt thanh toán online",
        );
      } catch {
        setEnabled(!next); // revert
        toast.error("Không thể cập nhật. Vui lòng thử lại.");
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <CreditCard className="size-5 text-muted-foreground" /> Thanh toán online
        </CardTitle>
        <CardDescription>
          Bật/tắt cổng thanh toán online (VietQR) cho khách đặt phòng.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
          <div className="space-y-0.5">
            <Label htmlFor="online-payment" className="text-base">
              Cho phép thanh toán online
            </Label>
            <p className="text-sm text-muted-foreground">
              {enabled
                ? "Khách sẽ thấy mã QR để chuyển khoản sau khi xác nhận thông tin."
                : "Khách vẫn đặt được phòng nhưng sẽ không thấy mã QR — nhân viên liên hệ thu tiền."}
            </p>
          </div>
          <Switch
            id="online-payment"
            checked={enabled}
            onCheckedChange={handleToggle}
            disabled={pending}
          />
        </div>

        {!enabled && (
          <div className="flex items-start gap-2.5 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-600 dark:text-amber-400">
            <TriangleAlert className="mt-0.5 size-4 shrink-0" />
            <span>
              Thanh toán online đang <strong>TẮT</strong>. Chỉ dùng khi cổng thanh toán gặp sự cố; nhớ bật lại
              khi hệ thống hoạt động bình thường.
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
