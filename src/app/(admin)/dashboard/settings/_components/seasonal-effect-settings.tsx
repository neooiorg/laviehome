'use client';

import * as React from 'react';
import { Sparkles } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
    startTransition(async () => {
      try {
        await setSeasonalEffectConfig(config);
        toast.success('Đã lưu hiệu ứng sự kiện');
      } catch {
        toast.error('Không thể lưu hiệu ứng. Vui lòng thử lại.');
      }
    });
  }

  function toggle(enabled: boolean) {
    const previous = config;
    const next = { ...config, enabled };
    setConfig(next);
    startTransition(async () => {
      try {
        await setSeasonalEffectConfig(next);
        toast.success(enabled ? 'Đã bật hiệu ứng' : 'Đã tắt hiệu ứng');
      } catch {
        setConfig(previous);
        toast.error('Không thể cập nhật hiệu ứng. Vui lòng thử lại.');
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
          Chọn kiểu trang trí, sau đó bật hoặc tắt hiệu ứng trên trang khách bất cứ lúc nào.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
          <div>
            <Label htmlFor="seasonal-effect-enabled" className="text-base">Bật hiệu ứng</Label>
            <p className="text-sm text-muted-foreground">Chỉ áp dụng cho giao diện khách hàng.</p>
          </div>
          <Switch id="seasonal-effect-enabled" checked={config.enabled} onCheckedChange={toggle} disabled={pending} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="seasonal-preset">Sự kiện</Label>
            <Select value={config.preset} onValueChange={(value) => update('preset', value as SeasonalPreset)} disabled={pending}>
              <SelectTrigger id="seasonal-preset" className="h-10"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(SEASONAL_PRESETS).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="seasonal-intensity">Mức hiệu ứng</Label>
            <Select value={config.intensity} onValueChange={(value) => update('intensity', value as SeasonalEffectConfig['intensity'])} disabled={pending}>
              <SelectTrigger id="seasonal-intensity" className="h-10"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Nhẹ</SelectItem>
                <SelectItem value="normal">Bình thường</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button type="button" onClick={save} disabled={pending}>{pending ? 'Đang lưu...' : 'Lưu lựa chọn'}</Button>
      </CardContent>
    </Card>
  );
}
