import Link from 'next/link';
import type { ElementType } from 'react';

import { SiteHeader } from '@/components/site-header';
import { CheckoutPaymentBox } from '@/components/checkout-payment-box';
import { CheckoutForm } from './checkout-form';
import { getPublicBranches } from '@/lib/homestay-dashboard';
import { compactPhone, money } from '@/lib/format';
import {
  CalendarDays,
  Clock3,
  CreditCard,
  FileText,
  Home,
  Lock,
  MapPin,
} from 'lucide-react';

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

async function upsertBookingRecord(id: string, checkout: Awaited<ReturnType<typeof resolveCheckout>>) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    await fetch(`${baseUrl}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id,
        room_name: checkout.roomName,
        branch_id: checkout.branchId,
        branch_name: checkout.branchName,
        date_label: checkout.date,
        time_range: checkout.timeRange,
        timeslot_ids: checkout.timeslotIds,
        amount: checkout.price,
      }),
      cache: 'no-store',
    });
  } catch {
    // non-blocking — booking will be created on form submit instead
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

  // Eagerly create booking so webhook can confirm it when payment arrives
  await upsertBookingRecord(transferCode, checkout);

  return (
    <main className='site-shell min-h-dvh text-white'>
      <SiteHeader />
      <div className='mx-auto w-[min(100%-2rem,1180px)] pb-16 pt-32'>
        <section className='grid items-start gap-6 lg:grid-cols-[1fr_380px]'>
          <div className='grid gap-6'>
            <section className='page-panel p-6 md:p-8'>
              <p className='eyebrow'>Thanh toán đặt phòng</p>
              <h1 className='mt-3 text-3xl font-extrabold leading-tight tracking-[-0.03em] md:text-5xl'>Xác nhận thông tin</h1>
              <p className='mt-4 max-w-2xl text-sm font-semibold leading-6 text-white/64 md:text-[0.95rem]'>
                Điền thông tin người đặt và xác thực giấy tờ để Lavie Home giữ phòng đúng khung giờ bạn đã chọn.
              </p>
            </section>

            <CheckoutForm bookingId={transferCode} price={checkout.price} />
          </div>

          <aside className='grid h-fit gap-6 lg:sticky lg:top-28'>
            <section className='section-card p-6 md:p-8'>
              <h2 className='flex items-center gap-2 text-lg font-extrabold tracking-[-0.02em]'>
                <FileText className='text-yellow-200' size={21} /> Tóm Tắt Đặt Phòng
              </h2>
              <div className='mt-5 grid gap-3 text-sm'>
                <CheckoutLine icon={Home} label='Phòng' value={checkout.roomName} />
                <CheckoutLine icon={MapPin} label='Chi nhánh' value={checkout.branchName} />
                <CheckoutLine icon={CalendarDays} label='Lịch Đặt' value={checkout.date} />
                <CheckoutLine icon={Clock3} label='Khung giờ' value={checkout.timeRange} />
              </div>
              <div className='mt-5 border-t border-white/10 pt-5 space-y-4'>
                <div className='flex items-center justify-between text-sm font-bold text-white/62'>
                  <span>Tạm Tính</span>
                  <span className='text-xl font-extrabold text-yellow-200'>{money(checkout.price)}đ</span>
                </div>
                <p className='flex items-center gap-2 text-xs font-semibold text-white/48'>
                  <Lock size={14} className="text-cyan-300" /> Giao dịch bảo mật bằng mã hoá SSL.
                </p>
              </div>
              <a className='primary-button mt-5 w-full text-center block py-3.5' href='#payment'>
                <CreditCard size={17} /> Xem Thông Tin Thanh Toán
              </a>
            </section>

            <CheckoutPaymentBox
              price={checkout.price}
              transferCode={transferCode}
              hotline={checkout.hotline}
              mapLink={checkout.map}
            />
          </aside>
        </section>

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
    </main>
  );
}

function CheckoutLine({ icon: Icon, label, value }: { icon: ElementType; label: string; value: string }) {
  return (
    <div className='rounded-2xl bg-white/5 px-4 py-3'>
      <p className='flex items-center gap-2 text-[0.68rem] font-extrabold uppercase tracking-[0.1em] text-white/38'>
        <Icon size={15} className='text-pink-200' /> {label}
      </p>
      <p className='mt-1 text-sm font-extrabold text-white/88'>{value}</p>
    </div>
  );
}
