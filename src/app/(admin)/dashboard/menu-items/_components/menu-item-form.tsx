'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ImageUp } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { createMenuItem, updateMenuItem, type MenuItem } from '@/lib/menu-actions';
import type { BranchRow } from '@/lib/homestay-dashboard';

interface MenuItemFormProps {
  branches: BranchRow[];
  initialData?: MenuItem;
  isEditing?: boolean;
}

export function MenuItemForm({ branches, initialData, isEditing = false }: MenuItemFormProps) {
  const router = useRouter();
  const [saving, setSaving] = React.useState(false);
  const [name, setName] = React.useState(initialData?.name ?? '');
  const [description, setDescription] = React.useState(initialData?.description ?? '');
  const [price, setPrice] = React.useState(initialData?.price ?? '');
  const [branchId, setBranchId] = React.useState(initialData?.branch_id ? String(initialData.branch_id) : '');
  const [imageUrl, setImageUrl] = React.useState(initialData?.image_url ?? '');
  const [isActive, setIsActive] = React.useState(initialData?.is_active ?? true);
  const [uploading, setUploading] = React.useState(false);

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: form });
      const data = await res.json();
      if (data.url) {
        setImageUrl(data.url);
      } else {
        alert(data.error ?? 'Tải ảnh lên thất bại. Vui lòng thử lại.');
      }
    } catch {
      alert('Tải ảnh lên thất bại. Vui lòng thử lại.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  async function handleSubmit() {
    if (!name || !description || !price || !branchId || !imageUrl) {
      alert('Vui lòng điền tất cả trường bắt buộc (bao gồm ảnh)');
      return;
    }

    setSaving(true);
    try {
      if (isEditing && initialData) {
        await updateMenuItem(initialData.id, {
          name,
          description,
          price: Number(price),
          branchId: Number(branchId),
          imageUrl: imageUrl || undefined,
          isActive,
        });
      } else {
        await createMenuItem({
          name,
          description,
          price: Number(price),
          branchId: Number(branchId),
          imageUrl: imageUrl || undefined,
          isActive,
        });
      }
      router.push('/dashboard/menu-items');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="mb-6 flex items-center gap-3">
        <Link href="/dashboard/menu-items" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="size-4" />
          Danh sách menu items
        </Link>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">
          {isEditing ? 'Chỉnh sửa menu item' : 'Thêm menu item'}
        </h1>
        {isEditing && initialData && (
          <p className="text-sm text-muted-foreground mt-0.5">{initialData.name}</p>
        )}
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Thông tin sản phẩm</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label>Chi nhánh *</Label>
                <Select value={branchId} onValueChange={setBranchId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn chi nhánh..." />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map((b) => (
                      <SelectItem key={b.id} value={String(b.id)}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>Tên menu item *</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="VD: Oleo Gel bôi trơn"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>Mô tả *</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Mô tả chi tiết về menu item"
                  rows={3}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>Giá (đ) *</Label>
                <Input
                  type="number"
                  min={0}
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Ảnh sản phẩm</CardTitle>
            </CardHeader>
            <CardContent>
              {imageUrl ? (
                <div className="flex flex-col gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imageUrl} alt="preview" className="w-full rounded-lg border object-cover aspect-square" />
                  <div className="flex gap-2">
                    <label className="flex-1 cursor-pointer">
                      <Button type="button" variant="outline" size="sm" className="w-full" disabled={uploading} asChild>
                        <span>{uploading ? 'Đang tải...' : 'Đổi ảnh'}</span>
                      </Button>
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
                    </label>
                    <Button type="button" variant="ghost" size="sm" onClick={() => setImageUrl('')} disabled={uploading}>
                      Xóa
                    </Button>
                  </div>
                </div>
              ) : (
                <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-input py-10 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-foreground">
                  <ImageUp className="size-8" />
                  <span className="font-medium">{uploading ? 'Đang tải ảnh lên...' : 'Nhấn để chọn ảnh từ máy'}</span>
                  <span className="text-xs">PNG, JPG, WEBP · tối đa 5MB</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
                </label>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Trạng thái</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Hoạt động</p>
                  <p className="text-xs text-muted-foreground">Hiển thị khi khách đặt phòng</p>
                </div>
                <Switch checked={isActive} onCheckedChange={setIsActive} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="sticky bottom-0 z-10 mt-6 flex items-center justify-end gap-3 border-t bg-background/80 py-4 backdrop-blur">
        <Separator className="absolute left-0 top-0 w-full" />
        <Button variant="outline" asChild>
          <Link href="/dashboard/menu-items">Hủy</Link>
        </Button>
        <Button onClick={handleSubmit} disabled={saving}>
          {saving ? 'Đang lưu...' : isEditing ? 'Cập nhật' : 'Tạo mới'}
        </Button>
      </div>
    </>
  );
}
