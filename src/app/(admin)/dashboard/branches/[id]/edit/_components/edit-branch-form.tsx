"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Trash2 } from "lucide-react";

import PageContainer from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import type { BranchRow } from "@/lib/homestay-dashboard";
import { deleteBranch, updateBranch } from "@/lib/branch-actions";

export function EditBranchForm({ branch }: { branch: BranchRow }) {
  const router = useRouter();
  const [saving, setSaving] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [name, setName] = React.useState(branch.name);
  const [hotline, setHotline] = React.useState(branch.hotline);
  const [mapsLink, setMapsLink] = React.useState(branch.google_maps_link);
  const [active, setActive] = React.useState(branch.active === 1);
  const [classic, setClassic] = React.useState(branch.classic_booking_enabled === 1);

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);
    await updateBranch(branch.id, { name: name.trim(), hotline: hotline.trim(), google_maps_link: mapsLink.trim(), active, classic_booking_enabled: classic });
    router.push("/dashboard/branches");
  }

  async function handleDelete() {
    if (!confirm(`Xóa chi nhánh "${name}"? Hành động này không thể hoàn tác.`)) return;
    setDeleting(true);
    await deleteBranch(branch.id);
    router.push("/dashboard/branches");
  }

  return (
    <PageContainer>
      <div className="mb-6 flex items-center gap-3">
        <Link href="/dashboard/branches" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="size-4" />
          Danh sách chi nhánh
        </Link>
      </div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Chỉnh sửa chi nhánh</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{branch.name}</p>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3"><CardTitle className="text-base">Thông tin chi nhánh</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>Tên chi nhánh *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="VD: Đà Nẵng - Nguyễn Văn Linh" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label>Hotline</Label>
                <Input value={hotline} onChange={(e) => setHotline(e.target.value)} placeholder="0901 234 567" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Link Google Maps</Label>
                <Input value={mapsLink} onChange={(e) => setMapsLink(e.target.value)} placeholder="https://maps.google.com/..." />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Cấu hình</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Đang hoạt động</p>
                  <p className="text-xs text-muted-foreground">Hiển thị trên trang khách hàng</p>
                </div>
                <Switch checked={active} onCheckedChange={setActive} />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Booking classic</p>
                  <p className="text-xs text-muted-foreground">Cho phép đặt theo giờ cố định</p>
                </div>
                <Switch checked={classic} onCheckedChange={setClassic} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="sticky bottom-0 z-10 mt-6 flex items-center justify-between gap-3 border-t bg-background/80 py-4 backdrop-blur">
        <Button variant="destructive" size="sm" onClick={handleDelete} disabled={deleting || saving}>
          <Trash2 className="mr-1.5 size-3.5" />
          {deleting ? "Đang xóa..." : "Xóa chi nhánh"}
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" asChild><Link href="/dashboard/branches">Hủy</Link></Button>
          <Button onClick={handleSave} disabled={saving || !name.trim()}>
            {saving ? "Đang lưu..." : "Lưu"}
          </Button>
        </div>
      </div>
    </PageContainer>
  );
}
