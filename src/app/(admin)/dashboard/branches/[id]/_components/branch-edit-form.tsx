"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { BranchRow } from "@/lib/homestay-dashboard";
import { deleteBranch, updateBranch } from "@/lib/branch-actions";

export function BranchEditForm({ branch }: { branch: BranchRow }) {
  const router = useRouter();
  const [saving, setSaving] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);

  const [name, setName] = React.useState(branch.name);
  const [hotline, setHotline] = React.useState(branch.hotline);
  const [mapsLink, setMapsLink] = React.useState(branch.google_maps_link);
  const [active, setActive] = React.useState(branch.active === 1);
  const [classic, setClassic] = React.useState(branch.classic_booking_enabled === 1);

  async function handleSave() {
    setSaving(true);
    await updateBranch(branch.id, {
      name,
      hotline,
      google_maps_link: mapsLink,
      active,
      classic_booking_enabled: classic,
    });
    setSaving(false);
    router.push("/dashboard/branches");
  }

  async function handleDelete() {
    if (!confirm(`Xóa chi nhánh "${branch.name}"? Tất cả phòng thuộc chi nhánh này sẽ không còn hiển thị đúng.`)) return;
    setDeleting(true);
    await deleteBranch(branch.id);
    router.push("/dashboard/branches");
  }

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle className="text-lg">Chỉnh sửa chi nhánh #{branch.id}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-5 pt-5">
        <div className="flex flex-col gap-1.5">
          <Label>Tên chi nhánh</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="VD: Đà Nẵng - Nguyễn Văn Linh" />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>Hotline</Label>
          <Input value={hotline} onChange={(e) => setHotline(e.target.value)} placeholder="0901 234 567" />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>Link Google Maps</Label>
          <Input value={mapsLink} onChange={(e) => setMapsLink(e.target.value)} placeholder="https://maps.google.com/..." />
        </div>

        <div className="flex flex-col gap-3 rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Đang hoạt động</p>
              <p className="text-xs text-muted-foreground">Chi nhánh hiển thị trên trang khách hàng</p>
            </div>
            <Switch checked={active} onCheckedChange={setActive} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Booking classic</p>
              <p className="text-xs text-muted-foreground">Cho phép đặt theo giờ cố định</p>
            </div>
            <Switch checked={classic} onCheckedChange={setClassic} />
          </div>
        </div>

        <div className="flex items-center justify-between border-t pt-4">
          <Button variant="destructive" size="sm" onClick={handleDelete} disabled={deleting}>
            <Trash2 className="mr-1.5 size-3.5" />
            {deleting ? "Đang xóa..." : "Xóa chi nhánh"}
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push("/dashboard/branches")}>Hủy</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Đang lưu..." : "Lưu thay đổi"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
