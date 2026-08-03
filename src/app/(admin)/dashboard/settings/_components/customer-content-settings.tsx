"use client";

import * as React from "react";
import { FileText } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { CustomerContentConfig } from "@/lib/customer-content";
import { setCustomerContentConfig } from "@/lib/settings-actions";

export function CustomerContentSettings({ initialConfig }: { initialConfig: CustomerContentConfig }) {
  const [guide, setGuide] = React.useState(initialConfig.guide);
  const [rules, setRules] = React.useState(initialConfig.rules);
  const [cancellationPolicy, setCancellationPolicy] = React.useState(initialConfig.cancellationPolicy);
  const [saved, setSaved] = React.useState(initialConfig);
  const [pending, startTransition] = React.useTransition();

  const nextConfig = React.useMemo(
    () => ({ guide, rules, cancellationPolicy }),
    [cancellationPolicy, guide, rules]
  );
  const isDirty = JSON.stringify(nextConfig) !== JSON.stringify(saved);

  function handleSave() {
    startTransition(async () => {
      try {
        await setCustomerContentConfig(nextConfig);
        setSaved(nextConfig);
        toast.success("Đã lưu nội dung hiển thị cho khách hàng.");
      } catch {
        toast.error("Không thể lưu nội dung. Vui lòng thử lại.");
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <FileText className="size-5 text-muted-foreground" /> Nội dung khách hàng
        </CardTitle>
        <CardDescription>
          Chỉnh nội dung cho trang hướng dẫn, nội quy và chính sách hủy phòng. Dùng dòng bắt đầu bằng
          <strong> ### </strong> cho tiêu đề nhỏ, <strong>-</strong> cho gạch đầu dòng.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-5">
        <ContentTextarea
          id="guide-content"
          label="Hướng dẫn sử dụng"
          value={guide}
          onChange={setGuide}
        />
        <ContentTextarea
          id="rules-content"
          label="Nội quy và quy định"
          value={rules}
          onChange={setRules}
        />
        <ContentTextarea
          id="cancellation-content"
          label="Chính sách hủy phòng & hoàn tiền"
          value={cancellationPolicy}
          onChange={setCancellationPolicy}
        />
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={pending || !isDirty}>
            {pending ? "Đang lưu..." : "Lưu nội dung"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ContentTextarea({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Textarea
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-44 resize-y font-mono text-xs leading-5"
      />
    </div>
  );
}
