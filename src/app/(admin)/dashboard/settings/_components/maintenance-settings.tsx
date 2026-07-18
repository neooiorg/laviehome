"use client";

import * as React from "react";
import { TriangleAlert, Wrench } from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { setMaintenanceMode } from "@/lib/settings-actions";

export function MaintenanceSettings({ initialEnabled }: { initialEnabled: boolean }) {
  const [enabled, setEnabled] = React.useState(initialEnabled);
  const [pending, startTransition] = React.useTransition();

  function handleToggle(next: boolean) {
    setEnabled(next);
    startTransition(async () => {
      try {
        await setMaintenanceMode(next);
        toast.success(next ? "Đã bật chế độ bảo trì" : "Đã tắt chế độ bảo trì");
      } catch {
        setEnabled(!next);
        toast.error("Không thể cập nhật. Vui lòng thử lại.");
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Wrench className="size-5 text-muted-foreground" /> Chế độ bảo trì
        </CardTitle>
        <CardDescription>
          Khi bật, toàn bộ trang khách sẽ hiển thị màn hình bảo trì (trang quản trị vẫn hoạt động).
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
          <div className="space-y-0.5">
            <Label htmlFor="maintenance" className="text-base">
              Bật chế độ bảo trì
            </Label>
            <p className="text-sm text-muted-foreground">
              {enabled
                ? "Khách đang thấy màn hình bảo trì và không thể đặt phòng."
                : "Trang khách đang hoạt động bình thường."}
            </p>
          </div>
          <Switch id="maintenance" checked={enabled} onCheckedChange={handleToggle} disabled={pending} />
        </div>

        {enabled && (
          <div className="flex items-start gap-2.5 rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-600 dark:text-red-400">
            <TriangleAlert className="mt-0.5 size-4 shrink-0" />
            <span>
              Trang khách đang <strong>TẮT</strong>. Khách không thể đặt phòng cho tới khi bạn tắt chế độ bảo trì.
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
