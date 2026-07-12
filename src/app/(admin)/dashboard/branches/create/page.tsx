"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import PageContainer from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { createBranch } from "@/lib/branch-actions";

export default function CreateBranchPage() {
  const router = useRouter();
  const [saving, setSaving] = React.useState(false);
  const [name, setName] = React.useState("");
  const [hotline, setHotline] = React.useState("");
  const [mapsLink, setMapsLink] = React.useState("");
  const [active, setActive] = React.useState(true);
  const [classic, setClassic] = React.useState(false);

  async function handleCreate() {
    if (!name.trim()) return;
    setSaving(true);
    await createBranch({ name: name.trim(), hotline: hotline.trim(), google_maps_link: mapsLink.trim(), active, classic_booking_enabled: classic });
    router.push("/dashboard/branches");
  }

  return (
    <PageContainer>
      <div className="mb-6 flex items-center gap-3">
        <Link href="/dashboard/branches" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="size-4" />
          Danh sách chi nhánh
        </Link>
      </div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Thêm chi nhánh</h1>
      </div>

      <Card className="max-w-xl">
        <CardHeader className="pb-3"><CardTitle className="text-base">Thông tin chi nhánh</CardTitle></CardHeader>
        <CardContent className="flex flex-col gap-4">
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

          <div className="flex gap-2 border-t pt-3">
            <Button variant="outline" asChild><Link href="/dashboard/branches">Hủy</Link></Button>
            <Button onClick={handleCreate} disabled={saving || !name.trim()}>
              {saving ? "Đang tạo..." : "Tạo chi nhánh"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
