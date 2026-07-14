import Link from 'next/link';

import { SiteHeader } from '@/components/site-header';
import { BottomNav } from '@/components/bottom-nav';
import { CheckoutExperience } from './checkout-experience';
import { getPublicBranches } from '@/lib/homestay-dashboard';
import { query } from '@/lib/postgres';
import { compactPhone } from '@/lib/format';

type CheckoutSearchParams = Record<string, string | string[] | undefined>;

type CheckoutPayload = {
  timeslot_ids?: string;
  room_name?: string;
  branch_name?: string;
  branch_id?: string;
  date?: string;
  time_range?: string;
  price?: number | string;
};

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value ?? '';
}

function decodePayload(data: string): CheckoutPayload {
  if (!data) return {};
  try {
    return JSON.parse(Buffer.from(data, 'base64').toString('utf8')) as CheckoutPayload;
  } catch {
    return {};
  }
}

async function resolveCheckout(params: CheckoutSearchParams) {
  const branches = await getPublicBranches();
  const decoded = decodePayload(firstValue(params.data));
  const branchId = decoded.branch_id ?? firstValue(params.branch_id);
  const branch = branches.find((item) => String(item.id) === String(branchId));
  const price = Number(decoded.price ?? firstValue(params.price) ?? 0);

  return {
    timeslotIds: decoded.timeslot_ids ?? firstValue(params.timeslot_ids) ?? 'N/A',
    roomName: decoded.room_name ?? firstValue(params.room_name) ?? 'N/A',
    branchName: decoded.branch_name ?? firstValue(params.branch_name) ?? branch?.name ?? 'N/A',
    branchId,
    date: decoded.date ?? firstValue(params.date) ?? 'N/A',
    timeRange: decoded.time_range ?? firstValue(params.time_range) ?? 'N/A',
    price: Number.isFinite(price) ? price : 0,
    hotline: branch?.hotline ?? '0909.123.456',
    map: branch?.google_maps_link ?? '/contacts',
  };
}

async function checkTimeslotConflict(
  id: string,
  roomName: string,
  dateLabel: string,
  timeslotIds: string
): Promise<boolean> {
  try {
    const rows = await query(
      `SELECT id FROM bookings
       WHERE room_name = $1
         AND date_label = $2
         AND id != $3
         AND status NOT IN ('Đã hủy', 'Hủy', 'Cancelled')
         AND timeslot_ids IS NOT NULL
         AND string_to_array(timeslot_ids, ',') && string_to_array($4, ',')
       LIMIT 1`,
      [roomName, dateLabel, id, timeslotIds]
    );
    return rows.length > 0;
  } catch {
    return false;
  }
}

async function upsertBookingRecord(id: string, checkout: Awaited<ReturnType<typeof resolveCheckout>>) {
  try {
    await query(
      `INSERT INTO bookings (
        id, guest_name, room_name, branch_id, branch_name, date_label, time_range, timeslot_ids, amount
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (id) DO NOTHING`,
      [
        id,
        '',
        checkout.roomName ?? null,
        checkout.branchId ? Number(checkout.branchId) : null,
        checkout.branchName ?? null,
        checkout.date ?? null,
        checkout.timeRange ?? null,
        checkout.timeslotIds ?? null,
        checkout.price ?? 0,
      ]
    );
  } catch {
    // non-blocking — booking will be completed on form submit
  }
}

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<CheckoutSearchParams>;
}) {
  const params = await searchParams;
  const checkout = await resolveCheckout(params);
  const transferCode = `LVH${String(checkout.branchId || '00').padStart(2, '0')}${String(checkout.timeslotIds)
    .replace(/\D/g, '')
    .slice(-6) || '000000'}`;

  // Check for timeslot conflict before creating the booking
  const hasConflict =
    checkout.timeslotIds && checkout.timeslotIds !== 'N/A' && checkout.roomName && checkout.date
      ? await checkTimeslotConflict(transferCode, checkout.roomName, checkout.date, checkout.timeslotIds)
      : false;

  if (hasConflict) {
    return (
      <main className='site-shell min-h-dvh text-white'>
        <SiteHeader />
        <div className='mx-auto w-[min(100%-2rem,1180px)] pb-16 pt-32 flex flex-col items-center gap-6 text-center'>
          <div className='text-5xl'>⚠️</div>
          <h1 className='text-2xl font-bold'>Khung giờ đã được đặt</h1>
          <p className='text-white/70 max-w-md'>
            Rất tiếc, khung giờ bạn chọn cho phòng <strong>{checkout.roomName}</strong> vào ngày{' '}
            <strong>{checkout.date}</strong> đã có người đặt trước. Vui lòng quay lại và chọn khung giờ khác.
          </p>
          <Link
            href='/'
            className='rounded-xl bg-white text-black font-semibold px-6 py-3 hover:bg-white/90 transition-colors'
          >
            Quay lại đặt phòng
          </Link>
        </div>
        <BottomNav />
      </main>
    );
  }

  // Eagerly create booking so webhook can confirm it when payment arrives
  await upsertBookingRecord(transferCode, checkout);

  return (
    <main className='site-shell min-h-dvh text-white'>
      <SiteHeader />
      <div className='mx-auto w-[min(100%-2rem,1180px)] pb-16 pt-32'>
        <CheckoutExperience
          transferCode={transferCode}
          roomName={checkout.roomName}
          branchName={checkout.branchName}
          date={checkout.date}
          timeRange={checkout.timeRange}
          price={checkout.price}
          hotline={checkout.hotline}
          mapLink={checkout.map}
        />

        <div className='mt-6 flex flex-wrap items-center justify-between gap-3 text-sm font-semibold text-white/50'>
          <Link className='hover:text-white' href='/'>
            Đặt Phòng
          </Link>
          <Link className='hover:text-white' href='/checking'>
            Tra Cứu
          </Link>
          <a className='hover:text-white' href={checkout.map}>
            Địa Chỉ
          </a>
          <a className='hover:text-white' href={`tel:${compactPhone(checkout.hotline)}`}>
            Hotline: {checkout.hotline}
          </a>
        </div>
      </div>
      <BottomNav />
    </main>
  );
}
