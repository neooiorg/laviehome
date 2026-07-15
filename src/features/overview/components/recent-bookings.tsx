import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { money } from '@/lib/format';
import { getBookingSnapshots } from '@/lib/homestay-dashboard';

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'outline'> = {
  'Đã xác nhận': 'default',
  'Chờ cọc': 'secondary',
  'Đang ở': 'outline',
  'Hoàn tất': 'secondary',
};

export async function RecentBookings() {
  const bookings = await getBookingSnapshots(5);

  return (
    <Card className='h-full'>
      <CardHeader>
        <CardTitle>Đặt phòng gần nhất</CardTitle>
        <CardDescription>{bookings.length} booking mới nhất trong hệ thống.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className='space-y-8'>
          {bookings.map((b) => {
            const initials = b.guestName
              .split(' ')
              .slice(-2)
              .map((w) => w[0])
              .join('')
              .toUpperCase();
            const totalAmount = Number(b.amount) + Number(b.menuItemsTotal ?? 0);
            return (
              <div key={b.id} className='flex items-center'>
                <Avatar className='h-9 w-9'>
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div className='ml-4 space-y-1'>
                  <p className='text-sm leading-none font-medium'>{b.guestName}</p>
                  <p className='text-muted-foreground text-xs'>{b.room.card_name}</p>
                </div>
                <div className='ml-auto flex flex-col items-end gap-1'>
                  <span className='text-sm font-medium'>+{money(totalAmount)}đ</span>
                  <Badge variant={STATUS_VARIANT[b.status] ?? 'secondary'} className='text-xs'>
                    {b.status}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
