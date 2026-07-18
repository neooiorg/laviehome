"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Trash2, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ImageUpload } from "@/components/image-upload";
import { AlertModal } from "@/components/modal/alert-modal";
import type { BranchRow, RoomRow } from "@/lib/homestay-dashboard";
import { deleteRoom, updateRoom } from "@/lib/room-actions";
import { getRoomSlots, timeToMinutes } from "@/lib/booking-slots";
import {
  SlotEditor,
  computeRowOverlaps,
  slotRowsToPrices,
  slotRowsToSlots,
  type SlotRow,
} from "../../_components/slot-editor";

export function RoomEditForm({ room, branches }: { room: RoomRow; branches: BranchRow[] }) {
  const router = useRouter();
  const [saving, setSaving] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);

  const [cardName, setCardName] = React.useState(room.card_name);
  const [branchId, setBranchId] = React.useState(String(room.branch_id));
  const [priceFrom, setPriceFrom] = React.useState(String(room.price_from));
  const [priceTo, setPriceTo] = React.useState(String(room.price_to));
  const [fullDayPrice, setFullDayPrice] = React.useState(String(room.full_day_price));
  const [mainImage, setMainImage] = React.useState(room.main_image);
  const [images, setImages] = React.useState<string[]>(room.images ?? []);
  const [amenities, setAmenities] = React.useState<string[]>(room.room_amenities ?? []);
  const [isClassic, setIsClassic] = React.useState(room.is_classic === 1);
  const [newAmenity, setNewAmenity] = React.useState("");
  const [slotRows, setSlotRows] = React.useState<SlotRow[]>(() => {
    const initialSlots =
      room.time_slots && room.time_slots.length > 0 ? room.time_slots : getRoomSlots(room.card_name);
    return initialSlots.map((slot, i) => {
      const price = room.slot_prices?.[i];
      return {
        start: slot.start ?? "",
        end: slot.end ?? "",
        price: typeof price === "number" && price > 0 ? String(price) : "",
      };
    });
  });

  const overlaps = React.useMemo(() => computeRowOverlaps(slotRows), [slotRows]);
  const hasIncompleteSlot = slotRows.some(
    (r) => timeToMinutes(r.start) === null || timeToMinutes(r.end) === null
  );
  const slotsBlocked = overlaps.length > 0 || hasIncompleteSlot;

  async function handleSave() {
    const pf = Number(priceFrom);
    const pt = Number(priceTo);
    if (pt > 0 && pf > pt) {
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
    await updateRoom(room.id, {
      card_name: cardName,
      branch_id: Number(branchId),
      branch_name: selectedBranch?.name ?? room.branch_name,
      price_from: Number(priceFrom),
      price_to: Number(priceTo),
      full_day_price: Number(fullDayPrice),
      main_image: mainImage,
      images,
      room_amenities: amenities,
      is_classic: isClassic,
      time_slots: timeSlots.length > 0 ? timeSlots : null,
      slot_prices: slotPricesArr.some((v) => v !== null) ? slotPricesArr : null,
    });
    setSaving(false);
    router.push("/dashboard/rooms");
  }

  async function handleDelete() {
    setDeleting(true);
    await deleteRoom(room.id);
    router.push("/dashboard/rooms");
  }

  return (
    <>
      <div className="grid items-start gap-6 lg:grid-cols-3">
        {/* Main column */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Thông tin cơ bản</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label>Tên phòng</Label>
                <Input value={cardName} onChange={(e) => setCardName(e.target.value)} />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>Chi nhánh</Label>
                <Select value={branchId} onValueChange={setBranchId}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map((b) => (
                      <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
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
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Khung giờ &amp; giá theo khung</CardTitle>
            </CardHeader>
            <CardContent>
              <SlotEditor
                rows={slotRows}
                onChange={setSlotRows}
                priceFromFallback={priceFrom}
                fullDayFallback={fullDayPrice}
              />
            </CardContent>
          </Card>
        </div>

        {/* Side column */}
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Hình ảnh</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label>Ảnh chính</Label>
                <ImageUpload
                  single
                  value={mainImage ? [mainImage] : []}
                  onChange={(urls) => setMainImage(urls[0] ?? "")}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Danh sách ảnh</Label>
                <ImageUpload value={images} onChange={setImages} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Tiện ích</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div className="flex flex-wrap gap-1.5">
                {amenities.length === 0 && (
                  <span className="text-sm text-muted-foreground">Chưa có tiện ích nào.</span>
                )}
                {amenities.map((a, i) => (
                  <Badge key={i} variant="secondary" className="gap-1 cursor-pointer" onClick={() => setAmenities(amenities.filter((_, j) => j !== i))}>
                    {a} <X className="size-3" />
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={newAmenity}
                  onChange={(e) => setNewAmenity(e.target.value)}
                  placeholder="Thêm tiện ích..."
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newAmenity.trim()) {
                      setAmenities([...amenities, newAmenity.trim()]);
                      setNewAmenity("");
                    }
                  }}
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => { if (newAmenity.trim()) { setAmenities([...amenities, newAmenity.trim()]); setNewAmenity(""); } }}
                >
                  Thêm
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Cấu hình</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Switch checked={isClassic} onCheckedChange={setIsClassic} id="is-classic" />
                <Label htmlFor="is-classic">Phòng classic (theo giờ cố định)</Label>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <AlertModal
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        loading={deleting}
        title={`Xóa phòng "${room.card_name}"?`}
        description="Hành động này không thể hoàn tác. Phòng sẽ bị xóa vĩnh viễn."
      />

      <div className="sticky bottom-0 z-10 mt-6 flex items-center justify-between gap-3 border-t bg-background/80 py-4 backdrop-blur">
        <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)} disabled={deleting}>
          <Trash2 className="mr-1.5 size-3.5" />
          Xóa phòng
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push("/dashboard/rooms")}>Hủy</Button>
          <Button onClick={handleSave} disabled={saving || slotsBlocked}>
            {saving ? "Đang lưu..." : "Lưu thay đổi"}
          </Button>
        </div>
      </div>
    </>
  );
}
