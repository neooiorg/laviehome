'use client';

import * as React from 'react';
import { Sparkles } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { setSeasonalEffectConfig } from '@/lib/settings-actions';
import { SEASONAL_PRESETS, type SeasonalEffectConfig, type SeasonalPreset } from '@/lib/seasonal-effects';

export function SeasonalEffectSettings({ initialConfig }: { initialConfig: SeasonalEffectConfig }) {
  const [config, setConfig] = React.useState(initialConfig);
  const [pending, startTransition] = React.useTransition();

  function update<K extends keyof SeasonalEffectConfig>(key: K, value: SeasonalEffectConfig[K]) {
    setConfig((current) => ({ ...current, [key]: value }));
  }

  function save() {
    if (config.startDate && config.endDate && config.startDate > config.endDate) {
      toast.error('Ngày kết thúc phải sau ngày bắt đầu.');
      return;
    }
    startTransition(async () => {
      try {
        await setSeasonalEffectConfig(config);
        toast.success('Đã lưu hiệu ứng sự kiện');
      } catch {
        toast.error('Không thể lưu hiệu ứng. Vui lòng thử lại.');
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="size-5 text-muted-foreground" /> Hiệu ứng theo mùa và sự kiện
        </CardTitle>
        <CardDescription>
          Trang khách hiển thị hiệu ứng trang trí nhẹ. Để trống ngày nếu muốn bật thủ công không giới hạn thời gian.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
          <div>
            <Label htmlFor="seasonal-effect-enabled" className="text-base">Bật hiệu ứng</Label>
            <p className="text-sm text-muted-foreground">Chỉ áp dụng cho giao diện khách hàng.</p>
          </div>
          <Switch id="seasonal-effect-enabled" checked={config.enabled} onCheckedChange={(value) => update('enabled', value)} disabled={pending} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="seasonal-preset">Sự kiện</Label>
            <select id="seasonal-preset" className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm" value={config.preset} onChange={(event) => update('preset', event.target.value as SeasonalPreset)} disabled={pending}>
              {Object.entries(SEASONAL_PRESETS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="seasonal-intensity">Mức hiệu ứng</Label>
            <select id="seasonal-intensity" className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm" value={config.intensity} onChange={(event) => update('intensity', event.target.value as SeasonalEffectConfig['intensity'])} disabled={pending}>
              <option value="light">Nhẹ</option>
              <option value="normal">Bình thường</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="seasonal-start">Từ ngày</Label>
            <Input id="seasonal-start" type="date" value={config.startDate} onChange={(event) => update('startDate', event.target.value)} disabled={pending} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="seasonal-end">Đến ngày</Label>
            <Input id="seasonal-end" type="date" value={config.endDate} onChange={(event) => update('endDate', event.target.value)} disabled={pending} />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">Ngày được tính theo giờ Việt Nam. Hiệu ứng tự dừng sau ngày kết thúc; cài đặt vẫn được giữ lại.</p>
        <Button type="button" onClick={save} disabled={pending}>{pending ? 'Đang lưu...' : 'Lưu hiệu ứng'}</Button>
      </CardContent>
    </Card>
  );
}
