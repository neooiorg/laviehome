'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ImageUp } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
    <Card className="max-w-2xl">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">
          {isEditing ? 'Chỉnh sửa Menu Item' : 'Thêm Menu Item mới'}
        </CardTitle>
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

        <div className="flex flex-col gap-1.5">
          <Label>Ảnh *</Label>
          {imageUrl ? (
            <div className="flex flex-col gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageUrl} alt="preview" className="h-32 w-auto rounded-lg border object-cover" />
              <div className="flex gap-2">
                <label className="cursor-pointer">
                  <Button type="button" variant="outline" size="sm" disabled={uploading} asChild>
                    <span>{uploading ? 'Đang tải...' : 'Đổi ảnh'}</span>
                  </Button>
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
                </label>
                <Button type="button" variant="ghost" size="sm" onClick={() => setImageUrl('')} disabled={uploading}>
                  Xóa ảnh
                </Button>
              </div>
            </div>
          ) : (
            <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-input py-8 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-foreground">
              <ImageUp className="size-6" />
              <span>{uploading ? 'Đang tải ảnh lên...' : 'Nhấn để chọn ảnh từ máy'}</span>
              <span className="text-xs text-muted-foreground">PNG, JPG, WEBP · tối đa 5MB</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
            </label>
          )}
        </div>

        <div className="flex items-center justify-between border-t pt-3">
          <Label>Hoạt động</Label>
          <Switch checked={isActive} onCheckedChange={setIsActive} />
        </div>

        <div className="flex gap-2 border-t pt-3">
          <Button variant="outline" asChild>
            <Link href="/dashboard/menu-items">Hủy</Link>
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? 'Đang lưu...' : isEditing ? 'Cập nhật' : 'Tạo mới'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
