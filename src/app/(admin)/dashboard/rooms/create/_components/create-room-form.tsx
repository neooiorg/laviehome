"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, X } from "lucide-react";

import PageContainer from "@/components/layout/page-container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { BranchRow } from "@/lib/homestay-dashboard";
import { createRoom } from "@/lib/room-actions";
import { getRoomSlots, timeToMinutes } from "@/lib/booking-slots";
import {
  SlotEditor,
  computeRowOverlaps,
  slotRowsToPrices,
  slotRowsToSlots,
  type SlotRow,
} from "../../_components/slot-editor";

export function CreateRoomForm({ branches }: { branches: BranchRow[] }) {
  const router = useRouter();
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
  const [uploading, setUploading] = React.useState(false);
  const [slotRows, setSlotRows] = React.useState<SlotRow[]>(() =>
    getRoomSlots("").map((slot) => ({ start: slot.start ?? "", end: slot.end ?? "", price: "" }))
  );

  const overlaps = React.useMemo(() => computeRowOverlaps(slotRows), [slotRows]);
  const hasIncompleteSlot = slotRows.some(
    (r) => timeToMinutes(r.start) === null || timeToMinutes(r.end) === null
  );
  const slotsBlocked = overlaps.length > 0 || hasIncompleteSlot;

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const data = await res.json();
      if (data.url) setMainImage(data.url);
    } finally {
      setUploading(false);
    }
  }

  async function handleCreate() {
    if (!cardName.trim() || !branchId) return;
    const pf = Number(priceFrom) || 0;
    const pt = Number(priceTo) || 0;
    if (pf > pt && pt > 0) {
      alert("Giá từ không được lớn hơn giá đến");
      return;
    }
    if (overlaps.length > 0) {
      alert("Các khung giờ đang bị chồng chéo. Vui lòng sửa trước khi lưu.");
      return;
    }
    if (hasIncompleteSlot) {
      alert("Có khung giờ chưa nhập đủ giờ bắt đầu/kết thúc.");
      return;
    }
    setSaving(true);
    const selectedBranch = branches.find((b) => b.id === Number(branchId));
    const timeSlots = slotRowsToSlots(slotRows);
    const slotPricesArr = slotRowsToPrices(slotRows);
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
      time_slots: timeSlots.length > 0 ? timeSlots : null,
      slot_prices: slotPricesArr.some((v) => v !== null) ? slotPricesArr : undefined,
    });
    router.push("/dashboard/rooms");
  }

  return (
    <PageContainer>
      <div className="mb-6 flex items-center gap-3">
        <Link href="/dashboard/rooms" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="size-4" />
          Danh sách phòng
        </Link>
      </div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Thêm phòng mới</h1>
      </div>

      <Card className="max-w-2xl">
        <CardHeader className="pb-3"><CardTitle className="text-base">Thông tin phòng</CardTitle></CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>Tên phòng *</Label>
            <Input value={cardName} onChange={(e) => setCardName(e.target.value)} placeholder="VD: Phòng Hướng Biển 01" />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Chi nhánh *</Label>
            <Select value={branchId} onValueChange={setBranchId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{branches.map((b) => <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>)}</SelectContent>
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

          <SlotEditor
            rows={slotRows}
            onChange={setSlotRows}
            priceFromFallback={priceFrom}
            fullDayFallback={fullDayPrice}
          />

          <div className="flex flex-col gap-1.5">
            <Label>Ảnh chính</Label>
            <div className="flex gap-2">
              <Input value={mainImage} onChange={(e) => setMainImage(e.target.value)} placeholder="https://..." className="flex-1" />
              <label className="cursor-pointer">
                <Button type="button" variant="outline" size="sm" disabled={uploading} asChild>
                  <span>{uploading ? "Đang tải..." : "Tải lên"}</span>
                </Button>
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              </label>
            </div>
            {mainImage && <img src={mainImage} alt="preview" className="mt-2 h-24 w-auto rounded-lg object-cover" />}
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
              <Input value={newAmenity} onChange={(e) => setNewAmenity(e.target.value)} placeholder="Thêm tiện ích..."
                onKeyDown={(e) => { if (e.key === "Enter" && newAmenity.trim()) { setAmenities([...amenities, newAmenity.trim()]); setNewAmenity(""); } }} />
              <Button type="button" size="sm" variant="outline" onClick={() => { if (newAmenity.trim()) { setAmenities([...amenities, newAmenity.trim()]); setNewAmenity(""); } }}>Thêm</Button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Switch checked={isClassic} onCheckedChange={setIsClassic} id="classic" />
            <Label htmlFor="classic">Phòng classic</Label>
          </div>

          <div className="flex gap-2 border-t pt-3">
            <Button variant="outline" asChild><Link href="/dashboard/rooms">Hủy</Link></Button>
            <Button onClick={handleCreate} disabled={saving || !cardName.trim() || !branchId || slotsBlocked}>
              {saving ? "Đang tạo..." : "Tạo phòng"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
