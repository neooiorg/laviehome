"use client";

import * as React from "react";
import { Plus, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { BranchRow } from "@/lib/homestay-dashboard";
import { createRoom } from "@/lib/room-actions";

export function CreateRoomDialog({ branches }: { branches: BranchRow[] }) {
  const [open, setOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [cardName, setCardName] = React.useState("");
  const [branchId, setBranchId] = React.useState(branches[0] ? String(branches[0].id) : "");
  const [priceFrom, setPriceFrom] = React.useState("");
  const [priceTo, setPriceTo] = React.useState("");
  const [fullDayPrice, setFullDayPrice] = React.useState("");
  const [mainImage, setMainImage] = React.useState("");
  const [amenities, setAmenities] = React.useState<string[]>([]);
  const [isClassic, setIsClassic] = React.useState(false);
  const [newAmenity, setNewAmenity] = React.useState("");

  function reset() {
    setCardName(""); setBranchId(branches[0] ? String(branches[0].id) : "");
    setPriceFrom(""); setPriceTo(""); setFullDayPrice("");
    setMainImage(""); setAmenities([]); setIsClassic(false);
    setNewAmenity("");
  }

  async function handleCreate() {
    if (!cardName.trim() || !branchId) return;
    setSaving(true);
    const selectedBranch = branches.find((b) => b.id === Number(branchId));
    await createRoom({
      card_name: cardName.trim(),
      branch_id: Number(branchId),
      branch_name: selectedBranch?.name ?? "",
      price_from: Number(priceFrom) || 0,
      price_to: Number(priceTo) || 0,
      full_day_price: Number(fullDayPrice) || 0,
      main_image: mainImage.trim(),
      images: [],
      room_amenities: amenities,
      is_classic: isClassic,
    });
    setSaving(false);
    reset();
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="mr-1.5 size-3.5" />
          Thêm phòng
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Thêm phòng mới</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 pt-2">
          <div className="flex flex-col gap-1.5">
            <Label>Tên phòng *</Label>
            <Input value={cardName} onChange={(e) => setCardName(e.target.value)} placeholder="VD: Phòng Hướng Biển 01" />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Chi nhánh *</Label>
            <Select value={branchId} onValueChange={setBranchId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {branches.map((b) => (
                  <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Giá từ (đ)</Label>
              <Input type="number" value={priceFrom} onChange={(e) => setPriceFrom(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Giá đến (đ)</Label>
              <Input type="number" value={priceTo} onChange={(e) => setPriceTo(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Cả ngày (đ)</Label>
              <Input type="number" value={fullDayPrice} onChange={(e) => setFullDayPrice(e.target.value)} />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Ảnh chính (URL)</Label>
            <Input value={mainImage} onChange={(e) => setMainImage(e.target.value)} placeholder="https://..." />
          </div>

          <div className="flex flex-col gap-2">
            <Label>Tiện ích</Label>
            <div className="flex flex-wrap gap-1.5">
              {amenities.map((a, i) => (
                <Badge key={i} variant="secondary" className="cursor-pointer gap-1" onClick={() => setAmenities(amenities.filter((_, j) => j !== i))}>
                  {a} <X className="size-3" />
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newAmenity}
                onChange={(e) => setNewAmenity(e.target.value)}
                placeholder="Thêm tiện ích..."
                onKeyDown={(e) => { if (e.key === "Enter" && newAmenity.trim()) { setAmenities([...amenities, newAmenity.trim()]); setNewAmenity(""); } }}
              />
              <Button type="button" size="sm" variant="outline" onClick={() => { if (newAmenity.trim()) { setAmenities([...amenities, newAmenity.trim()]); setNewAmenity(""); } }}>Thêm</Button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Switch checked={isClassic} onCheckedChange={setIsClassic} id="create-classic" />
            <Label htmlFor="create-classic">Phòng classic</Label>
          </div>

          <div className="flex justify-end gap-2 border-t pt-3">
            <Button variant="outline" onClick={() => setOpen(false)}>Hủy</Button>
            <Button onClick={handleCreate} disabled={saving || !cardName.trim()}>
              {saving ? "Đang tạo..." : "Tạo phòng"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
