"use client";

import * as React from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { createBranch } from "@/lib/branch-actions";

export function CreateBranchDialog() {
  const [open, setOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [name, setName] = React.useState("");
  const [hotline, setHotline] = React.useState("");
  const [mapsLink, setMapsLink] = React.useState("");
  const [active, setActive] = React.useState(true);
  const [classic, setClassic] = React.useState(false);

  function reset() {
    setName(""); setHotline(""); setMapsLink(""); setActive(true); setClassic(false);
  }

  async function handleCreate() {
    if (!name.trim()) return;
    setSaving(true);
    await createBranch({ name: name.trim(), hotline: hotline.trim(), google_maps_link: mapsLink.trim(), active, classic_booking_enabled: classic });
    setSaving(false);
    reset();
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="mr-1.5 size-3.5" />
          Thêm chi nhánh
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Thêm chi nhánh mới</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 pt-2">
          <div className="flex flex-col gap-1.5">
            <Label>Tên chi nhánh *</Label>
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
          <div className="flex items-center justify-between rounded-lg border p-3">
            <Label>Đang hoạt động</Label>
            <Switch checked={active} onCheckedChange={setActive} />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <Label>Booking classic</Label>
            <Switch checked={classic} onCheckedChange={setClassic} />
          </div>
          <div className="flex justify-end gap-2 border-t pt-3">
            <Button variant="outline" onClick={() => setOpen(false)}>Hủy</Button>
            <Button onClick={handleCreate} disabled={saving || !name.trim()}>
              {saving ? "Đang tạo..." : "Tạo chi nhánh"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
