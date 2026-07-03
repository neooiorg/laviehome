"use client";
"use no memo";

import * as React from "react";
import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import type { BranchRow } from "@/lib/homestay-dashboard";
import { deleteBranch, updateBranch } from "@/lib/branch-actions";

interface Props {
  branch: BranchRow | null;
  onClose: () => void;
  onUpdated: (branch: BranchRow) => void;
  onDeleted: (id: number) => void;
}

export function BranchEditSheet({ branch, onClose, onUpdated, onDeleted }: Props) {
  const [saving, setSaving] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);

  const [name, setName] = React.useState(branch?.name ?? "");
  const [hotline, setHotline] = React.useState(branch?.hotline ?? "");
  const [mapsLink, setMapsLink] = React.useState(branch?.google_maps_link ?? "");
  const [active, setActive] = React.useState(branch ? branch.active === 1 : true);
  const [classic, setClassic] = React.useState(branch ? branch.classic_booking_enabled === 1 : false);

  // Sync state when branch changes
  React.useEffect(() => {
    if (branch) {
      setName(branch.name);
      setHotline(branch.hotline);
      setMapsLink(branch.google_maps_link);
      setActive(branch.active === 1);
      setClassic(branch.classic_booking_enabled === 1);
    }
  }, [branch]);

  async function handleSave() {
    if (!branch || !name.trim()) return;
    setSaving(true);
    await updateBranch(branch.id, {
      name: name.trim(),
      hotline: hotline.trim(),
      google_maps_link: mapsLink.trim(),
      active,
      classic_booking_enabled: classic,
    });
    onUpdated({ ...branch, name: name.trim(), hotline: hotline.trim(), google_maps_link: mapsLink.trim(), active: active ? 1 : 0, classic_booking_enabled: classic ? 1 : 0 });
    setSaving(false);
    onClose();
  }

  async function handleDelete() {
    if (!branch || !confirm(`Xóa chi nhánh "${branch.name}"? Hành động này không thể hoàn tác.`)) return;
    setDeleting(true);
    await deleteBranch(branch.id);
    onDeleted(branch.id);
    setDeleting(false);
    onClose();
  }

  return (
    <Sheet open={!!branch} onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent className="flex flex-col overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Chỉnh sửa chi nhánh</SheetTitle>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-4 pt-4">
          <div className="flex flex-col gap-1.5">
            <Label>Tên chi nhánh *</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: Đà Nẵng - Nguyễn Văn Linh"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Hotline</Label>
            <Input
              value={hotline}
              onChange={(e) => setHotline(e.target.value)}
              placeholder="0901 234 567"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Link Google Maps</Label>
            <Input
              value={mapsLink}
              onChange={(e) => setMapsLink(e.target.value)}
              placeholder="https://maps.google.com/..."
            />
          </div>

          <div className="flex flex-col gap-3 rounded-lg border p-4">
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
        </div>

        <div className="flex items-center justify-between border-t pt-4">
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={deleting || saving}
          >
            <Trash2 className="mr-1.5 size-3.5" />
            {deleting ? "Đang xóa..." : "Xóa"}
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} disabled={saving}>Hủy</Button>
            <Button onClick={handleSave} disabled={saving || !name.trim()}>
              {saving ? "Đang lưu..." : "Lưu"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
