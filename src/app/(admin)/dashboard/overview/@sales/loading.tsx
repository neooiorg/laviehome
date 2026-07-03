import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <Card className='h-full'>
      <CardHeader>
        <Skeleton className='h-6 w-[180px]' />
        <Skeleton className='h-4 w-[240px]' />
      </CardHeader>
      <CardContent>
        <div className='space-y-8'>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className='flex items-center gap-4'>
              <Skeleton className='h-9 w-9 rounded-full' />
              <div className='space-y-1 flex-1'>
                <Skeleton className='h-4 w-[120px]' />
                <Skeleton className='h-3 w-[80px]' />
              </div>
              <Skeleton className='h-4 w-[60px]' />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
