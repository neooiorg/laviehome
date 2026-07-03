"use client";

import * as React from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { DiscountCode } from "@/lib/homestay-dashboard";
import { createDiscountCode, deleteDiscountCode, toggleDiscountActive, updateDiscountCode } from "@/lib/discount-actions";

export function DiscountsClient({ codes: initial }: { codes: DiscountCode[] }) {
  const [codes, setCodes] = React.useState(initial);
  const [editCode, setEditCode] = React.useState<DiscountCode | null>(null);
  const [createOpen, setCreateOpen] = React.useState(false);

  async function handleToggle(code: string, active: boolean) {
    setCodes((prev) => prev.map((c) => c.code === code ? { ...c, active } : c));
    await toggleDiscountActive(code, active);
  }

  async function handleDelete(code: string) {
    if (!confirm(`Xóa mã giảm giá "${code}"?`)) return;
    await deleteDiscountCode(code);
    setCodes((prev) => prev.filter((c) => c.code !== code));
  }

  return (
    <>
      <Card>
        <CardHeader className="border-b has-data-[slot=card-action]:grid-cols-1 md:has-data-[slot=card-action]:grid-cols-[1fr_auto]">
          <div>
            <CardTitle className="text-xl leading-none">Mã giảm giá</CardTitle>
            <CardDescription>Quản lý mã khuyến mãi ({codes.length} mã).</CardDescription>
          </div>
          <div data-slot="card-action" className="flex items-start justify-end">
            <CreateDiscountDialog open={createOpen} onOpenChange={setCreateOpen} onCreated={(c) => setCodes([c, ...codes])} />
          </div>
        </CardHeader>
        <CardContent className="px-0">
          <Table className="**:data-[slot='table-cell']:px-4 **:data-[slot='table-head']:px-4">
            <TableHeader className="[&_tr]:border-t">
              <TableRow>
                <TableHead className="py-4 font-normal">Mã</TableHead>
                <TableHead className="py-4 font-normal">Giảm</TableHead>
                <TableHead className="py-4 font-normal">Mô tả</TableHead>
                <TableHead className="py-4 font-normal">Đã dùng</TableHead>
                <TableHead className="py-4 font-normal">Hết hạn</TableHead>
                <TableHead className="py-4 font-normal">Hoạt động</TableHead>
                <TableHead className="py-4 font-normal" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {codes.map((c) => (
                <TableRow key={c.code}>
                  <TableCell className="font-mono font-semibold">{c.code}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{c.percent}%</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{c.description || "—"}</TableCell>
                  <TableCell className="tabular-nums text-sm">
                    {c.used_count} / {c.max_uses}
                  </TableCell>
                  <TableCell className="text-sm">
                    {c.expires_at ? new Date(c.expires_at).toLocaleDateString("vi-VN") : "—"}
                  </TableCell>
                  <TableCell>
                    <Switch checked={c.active} onCheckedChange={(v) => handleToggle(c.code, v)} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button size="sm" variant="ghost" onClick={() => setEditCode(c)}>
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDelete(c.code)}>
                        <Trash2 className="size-3.5 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <EditDiscountSheet
        key={editCode?.code ?? "none"}
        code={editCode}
        onClose={() => setEditCode(null)}
        onSaved={(updated) => { setCodes((prev) => prev.map((c) => c.code === updated.code ? updated : c)); setEditCode(null); }}
      />
    </>
  );
}

function CreateDiscountDialog({
  open, onOpenChange, onCreated
}: { open: boolean; onOpenChange: (v: boolean) => void; onCreated: (c: DiscountCode) => void }) {
  const [saving, setSaving] = React.useState(false);
  const [code, setCode] = React.useState("");
  const [percent, setPercent] = React.useState("10");
  const [description, setDescription] = React.useState("");
  const [maxUses, setMaxUses] = React.useState("100");
  const [expiresAt, setExpiresAt] = React.useState("");
  const [active, setActive] = React.useState(true);

  function reset() { setCode(""); setPercent("10"); setDescription(""); setMaxUses("100"); setExpiresAt(""); setActive(true); }

  async function handleCreate() {
    if (!code.trim()) return;
    setSaving(true);
    const input = { code: code.trim().toUpperCase(), percent: Number(percent), description, active, max_uses: Number(maxUses), expires_at: expiresAt || null };
    await createDiscountCode(input);
    onCreated({ ...input, code: input.code, used_count: 0, created_at: new Date().toISOString() });
    setSaving(false);
    reset();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) reset(); }}>
      <DialogTrigger asChild>
        <Button size="sm"><Plus className="mr-1.5 size-3.5" />Thêm mã</Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Tạo mã giảm giá</DialogTitle></DialogHeader>
        <div className="flex flex-col gap-4 pt-2">
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
              <Input type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
            </div>
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <Label>Kích hoạt ngay</Label>
            <Switch checked={active} onCheckedChange={setActive} />
          </div>
          <div className="flex justify-end gap-2 border-t pt-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
            <Button onClick={handleCreate} disabled={saving || !code.trim()}>{saving ? "Đang tạo..." : "Tạo mã"}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function EditDiscountSheet({
  code, onClose, onSaved
}: { code: DiscountCode | null; onClose: () => void; onSaved: (c: DiscountCode) => void }) {
  const [saving, setSaving] = React.useState(false);
  const [percent, setPercent] = React.useState(code ? String(code.percent) : "");
  const [description, setDescription] = React.useState(code?.description ?? "");
  const [maxUses, setMaxUses] = React.useState(code ? String(code.max_uses) : "");
  const [expiresAt, setExpiresAt] = React.useState(code?.expires_at ? code.expires_at.slice(0, 10) : "");
  const [active, setActive] = React.useState(code?.active ?? true);

  async function handleSave() {
    if (!code) return;
    setSaving(true);
    const data = { percent: Number(percent), description, active, max_uses: Number(maxUses), expires_at: expiresAt || null };
    await updateDiscountCode(code.code, data);
    onSaved({ ...code, ...data });
    setSaving(false);
  }

  return (
    <Sheet open={!!code} onOpenChange={(v) => { if (!v) onClose(); }}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Sửa mã: {code?.code}</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col gap-4 pt-4">
          <div className="flex flex-col gap-1.5">
            <Label>Giảm (%)</Label>
            <Input type="number" min={1} max={100} value={percent} onChange={(e) => setPercent(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Mô tả</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Số lần dùng tối đa</Label>
            <Input type="number" min={1} value={maxUses} onChange={(e) => setMaxUses(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Hết hạn</Label>
            <Input type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <Label>Hoạt động</Label>
            <Switch checked={active} onCheckedChange={setActive} />
          </div>
          <Button onClick={handleSave} disabled={saving} className="mt-2">
            {saving ? "Đang lưu..." : "Lưu thay đổi"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
