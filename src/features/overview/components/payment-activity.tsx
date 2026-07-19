import Link from 'next/link';
import { ArrowUpRight, Clock } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { money } from '@/lib/format';
import { getPaymentSummary, type PaymentState } from '@/lib/homestay-dashboard';

const STATE_META: Record<PaymentState, { label: string; badge: string; dot: string }> = {
  received: {
    label: 'Đã nhận',
    badge: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    dot: 'bg-emerald-500'
  },
  pending: {
    label: 'Chờ chuyển khoản',
    badge: 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400',
    dot: 'bg-amber-500'
  },
  processing: {
    label: 'Đang xử lý',
    badge: 'border-border bg-muted text-muted-foreground',
    dot: 'bg-muted-foreground'
  }
};

function relativeTime(iso: string) {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const diffMinutes = Math.round((Date.now() - then) / 60000);
  if (diffMinutes < 1) return 'vừa xong';
  if (diffMinutes < 60) return `${diffMinutes} phút trước`;
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} giờ trước`;
  const diffDays = Math.round(diffHours / 24);
  if (diffDays < 30) return `${diffDays} ngày trước`;
  return new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
}

export async function PaymentActivity() {
  const summary = await getPaymentSummary(6);

  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>Chuyển khoản gần đây</CardTitle>
            <CardDescription className="mt-1">Thanh toán VietQR cho các phòng vừa đặt.</CardDescription>
          </div>
          <Link
            href="/dashboard/bookings"
            className="flex items-center gap-0.5 text-xs font-medium text-primary hover:underline"
          >
            Tất cả <ArrowUpRight className="size-3.5" />
          </Link>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div className="rounded-lg border bg-emerald-500/5 p-3">
            <div className="text-xs text-muted-foreground">Đã nhận ({summary.receivedCount})</div>
            <div className="mt-0.5 text-base font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
              {money(summary.receivedTotal)}đ
            </div>
          </div>
          <div className="rounded-lg border bg-amber-500/5 p-3">
            <div className="text-xs text-muted-foreground">Chờ chuyển ({summary.pendingCount})</div>
            <div className="mt-0.5 text-base font-semibold tabular-nums text-amber-600 dark:text-amber-400">
              {money(summary.pendingTotal)}đ
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        {summary.activities.length > 0 ? (
          <div className="divide-y">
            {summary.activities.map((activity) => {
              const meta = STATE_META[activity.paymentState];
              return (
                <Link
                  key={activity.id}
                  href={`/dashboard/bookings/${activity.id}`}
                  className="flex items-center gap-3 py-3 first:pt-0 last:pb-0 transition-colors hover:bg-muted/40"
                >
                  <span className={`size-2 shrink-0 rounded-full ${meta.dot}`} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{activity.guestName}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {activity.roomName} · {activity.branchName}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-sm font-semibold tabular-nums">{money(activity.amount)}đ</span>
                    <div className="flex items-center gap-1.5">
                      <span className="flex items-center gap-0.5 text-[11px] text-muted-foreground">
                        <Clock className="size-3" />
                        {relativeTime(activity.createdAt)}
                      </span>
                      <Badge variant="outline" className={`px-1.5 py-0 text-[10px] ${meta.badge}`}>
                        {meta.label}
                      </Badge>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="flex h-full min-h-[200px] items-center justify-center text-sm text-muted-foreground">
            Chưa có giao dịch nào.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
