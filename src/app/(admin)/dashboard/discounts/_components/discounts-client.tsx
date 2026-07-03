"use client";
"use no memo";

import * as React from "react";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import {
  type ColumnDef,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type PaginationState,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { DataTable } from "@/components/data-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import type { DiscountCode } from "@/lib/homestay-dashboard";
import { createDiscountCode, deleteDiscountCode, toggleDiscountActive, updateDiscountCode } from "@/lib/discount-actions";

export function DiscountsClient({ codes: initial }: { codes: DiscountCode[] }) {
  const [codes, setCodes] = React.useState(initial);
  const [editCode, setEditCode] = React.useState<DiscountCode | null>(null);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [pagination, setPagination] = React.useState<PaginationState>({ pageIndex: 0, pageSize: 20 });
  const [search, setSearch] = React.useState("");

  async function handleToggle(code: string, active: boolean) {
    setCodes((prev) => prev.map((c) => c.code === code ? { ...c, active } : c));
    await toggleDiscountActive(code, active);
  }

  async function handleDelete(code: string) {
    if (!confirm(`Xóa mã giảm giá "${code}"?`)) return;
    await deleteDiscountCode(code);
    setCodes((prev) => prev.filter((c) => c.code !== code));
  }

  const columns: ColumnDef<DiscountCode>[] = [
    {
      accessorKey: "code",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Mã" />,
      cell: ({ row }) => (
        <span className="font-mono font-semibold">{row.original.code}</span>
      ),
    },
    {
      accessorKey: "percent",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Giảm" />,
      cell: ({ row }) => <Badge variant="secondary">{row.original.percent}%</Badge>,
    },
    {
      accessorKey: "description",
      header: "Mô tả",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{row.original.description || "—"}</span>
      ),
    },
    {
      id: "usage",
      header: "Đã dùng",
      accessorFn: (row) => row.used_count,
      cell: ({ row }) => (
        <span className="tabular-nums text-sm">{row.original.used_count} / {row.original.max_uses}</span>
      ),
    },
    {
      accessorKey: "expires_at",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Hết hạn" />,
      cell: ({ row }) => (
        <span className="text-sm">
          {row.original.expires_at ? new Date(row.original.expires_at).toLocaleDateString("vi-VN") : "—"}
        </span>
      ),
    },
    {
      accessorKey: "active",
      header: "Hoạt động",
      cell: ({ row }) => (
        <Switch
          checked={row.original.active}
          onCheckedChange={(v) => handleToggle(row.original.code, v)}
        />
      ),
    },
    {
      id: "actions",
      header: "",
      enableSorting: false,
      enableHiding: false,
      cell: ({ row }) => (
        <div className="flex justify-end gap-1">
          <Button size="sm" variant="ghost" onClick={() => setEditCode(row.original)}>
            <Pencil className="size-3.5" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => handleDelete(row.original.code)}>
            <Trash2 className="size-3.5 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  const filteredData = React.useMemo(() => {
    if (!search) return codes;
    const q = search.toLowerCase();
    return codes.filter((c) =>
      c.code.toLowerCase().includes(q) || (c.description ?? "").toLowerCase().includes(q)
    );
  }, [codes, search]);

  const table = useReactTable({
    data: filteredData,
    columns,
    state: { sorting, pagination },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const toolbar = (
    <div className="flex items-center justify-between gap-3">
      <InputGroup className="h-8 w-56">
        <InputGroupAddon align="inline-start">
          <Search className="size-3.5" />
        </InputGroupAddon>
        <InputGroupInput
          className="h-8"
          placeholder="Tìm mã, mô tả..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); table.setPageIndex(0); }}
        />
      </InputGroup>
      <div className="text-sm text-muted-foreground tabular-nums">{codes.length} mã</div>
    </div>
  );

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
          <DataTable table={table} emptyMessage="Không có mã giảm giá nào." toolbar={toolbar} />
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
