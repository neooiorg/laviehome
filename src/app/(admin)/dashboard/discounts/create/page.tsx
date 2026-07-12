"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import PageContainer from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { createDiscountCode } from "@/lib/discount-actions";

export default function CreateDiscountPage() {
  const router = useRouter();
  const [saving, setSaving] = React.useState(false);
  const [code, setCode] = React.useState("");
  const [percent, setPercent] = React.useState("10");
  const [description, setDescription] = React.useState("");
  const [maxUses, setMaxUses] = React.useState("100");
  const [expiresAt, setExpiresAt] = React.useState("");
  const [active, setActive] = React.useState(true);

  async function handleCreate() {
    if (!code.trim()) return;
    setSaving(true);
    await createDiscountCode({
      code: code.trim().toUpperCase(),
      percent: Number(percent),
      description,
      active,
      max_uses: Number(maxUses),
      expires_at: expiresAt || null,
    });
    router.push("/dashboard/discounts");
  }

  return (
    <PageContainer>
      <div className="mb-6 flex items-center gap-3">
        <Link href="/dashboard/discounts" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="size-4" />
          Danh sách mã giảm giá
        </Link>
      </div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Tạo mã giảm giá</h1>
      </div>

      <Card className="max-w-xl">
        <CardHeader className="pb-3"><CardTitle className="text-base">Thông tin mã</CardTitle></CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Mã *</Label>
              <Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="SUMMER20" className="font-mono" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Giảm (%)</Label>
              <Input type="number" min={1} max={100} value={percent} onChange={(e) => setPercent(e.target.value)} />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Mô tả</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Khuyến mãi hè 2026" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Số lần dùng tối đa</Label>
              <Input type="number" min={1} value={maxUses} onChange={(e) => setMaxUses(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Hết hạn</Label>
              <DatePicker value={expiresAt} onChange={setExpiresAt} className="w-full" />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <Label>Kích hoạt ngay</Label>
            <Switch checked={active} onCheckedChange={setActive} />
          </div>

          <div className="flex gap-2 border-t pt-3">
            <Button variant="outline" asChild><Link href="/dashboard/discounts">Hủy</Link></Button>
            <Button onClick={handleCreate} disabled={saving || !code.trim()}>
              {saving ? "Đang tạo..." : "Tạo mã"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
