"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Trash2 } from "lucide-react";

import PageContainer from "@/components/layout/page-container";
import { AlertModal } from "@/components/modal/alert-modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { DiscountCode } from "@/lib/homestay-dashboard";
import { deleteDiscountCode, updateDiscountCode } from "@/lib/discount-actions";

export function EditDiscountForm({ discount }: { discount: DiscountCode }) {
  const router = useRouter();
  const [saving, setSaving] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [percent, setPercent] = React.useState(String(discount.percent));
  const [description, setDescription] = React.useState(discount.description ?? "");
  const [maxUses, setMaxUses] = React.useState(String(discount.max_uses));
  const [expiresAt, setExpiresAt] = React.useState(discount.expires_at ? String(discount.expires_at).slice(0, 10) : "");
  const [active, setActive] = React.useState(discount.active);

  async function handleSave() {
    setSaving(true);
    await updateDiscountCode(discount.code, { percent: Number(percent), description, active, max_uses: Number(maxUses), expires_at: expiresAt || null });
    router.push("/dashboard/discounts");
  }

  async function handleDelete() {
    setDeleting(true);
    await deleteDiscountCode(discount.code);
    router.push("/dashboard/discounts");
  }

  return (
    <PageContainer>
      <AlertModal isOpen={deleteOpen} onClose={() => setDeleteOpen(false)} onConfirm={handleDelete} loading={deleting}
        title={`Xóa mã "${discount.code}"?`} description="Mã giảm giá sẽ bị xóa vĩnh viễn." />

      <div className="mb-6 flex items-center gap-3">
        <Link href="/dashboard/discounts" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="size-4" />
          Danh sách mã giảm giá
        </Link>
      </div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Chỉnh sửa mã</h1>
        <p className="text-sm text-muted-foreground mt-0.5 font-mono">{discount.code}</p>
      </div>

      <Card className="max-w-xl">
        <CardHeader className="pb-3"><CardTitle className="text-base">Thông tin mã</CardTitle></CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Giảm (%)</Label>
              <Input type="number" min={1} max={100} value={percent} onChange={(e) => setPercent(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Số lần dùng tối đa</Label>
              <Input type="number" min={1} value={maxUses} onChange={(e) => setMaxUses(e.target.value)} />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Mô tả</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Hết hạn</Label>
            <DatePicker value={expiresAt} onChange={setExpiresAt} className="w-full" />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <Label>Hoạt động</Label>
            <Switch checked={active} onCheckedChange={setActive} />
          </div>

          <div className="flex items-center justify-between border-t pt-3">
            <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)} disabled={deleting || saving}>
              <Trash2 className="mr-1.5 size-3.5" />
              Xóa mã
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" asChild><Link href="/dashboard/discounts">Hủy</Link></Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Đang lưu..." : "Lưu"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
