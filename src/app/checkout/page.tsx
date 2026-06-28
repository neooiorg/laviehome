import Link from 'next/link';
import Image from 'next/image';
import type { ElementType } from 'react';

import { SiteHeader } from '@/components/site-header';
import { CheckoutPaymentBox } from '@/components/checkout-payment-box';
import { getPublicBranches } from '@/lib/homestay-dashboard';
import { compactPhone, money } from '@/lib/format';
import {
  CalendarDays,
  Clock3,
  CreditCard,
  FileText,
  Home,
  IdCard,
  Lock,
  MapPin,
  ShieldCheck,
  Upload,
  UserRound
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
    map: branch?.google_maps_link ?? '/contacts'
  };
}

export default async function CheckoutPage({
  searchParams
}: {
  searchParams: Promise<CheckoutSearchParams>;
}) {
  const params = await searchParams;
  const checkout = await resolveCheckout(params);
  const transferCode = `LVH${String(checkout.branchId || '00').padStart(2, '0')}${String(checkout.timeslotIds)
    .replace(/\D/g, '')
    .slice(-6) || '000000'}`;

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

            <section className='section-card p-6 md:p-8'>
              <h2 className='flex items-center gap-2 text-xl font-extrabold tracking-[-0.025em]'>
                <UserRound className='text-pink-200' size={21} /> Thông Tin Người Đặt
              </h2>
              <form className='mt-6 grid gap-5'>
                <label className='grid gap-2 text-sm font-bold text-white/72'>
                  Họ và Tên (*)
                  <input className='field-input !pl-5' placeholder='Nhập họ và tên' required />
                </label>
                <label className='grid gap-2 text-sm font-bold text-white/72'>
                  Số Điện Thoại (*)
                  <input className='field-input !pl-5' inputMode='tel' placeholder='Số điện thoại nhận mã mở khóa' required />
                </label>

                <div className='grid gap-3'>
                  <p className='text-sm font-bold text-white/72'>Số Lượng Người</p>
                  <div className='grid gap-3 md:grid-cols-3'>
                    {[
                      ['2', 'Đi 2 người', 'Mặc định'],
                      ['3', 'Đi 3 người', 'Phụ thu 50.000đ'],
                      ['4', 'Đi 4 người', 'Phụ thu 100.000đ']
                    ].map(([value, title, note]) => (
                      <label
                        key={value}
                        className='cursor-pointer rounded-2xl border-2 border-white/10 bg-white/5 p-4 transition duration-150 block has-[:checked]:border-pink-500 has-[:checked]:bg-pink-500/10 has-[:checked]:shadow-[4px_4px_0px_#f35abd] has-[:checked]:-translate-y-0.5 hover:border-white hover:bg-white/10'
                      >
                        <input className='sr-only' type='radio' name='guest_count' defaultChecked={value === '2'} />
                        <span className='block font-extrabold text-white'>{title}</span>
                        <span className='mt-1 block text-xs font-bold text-white/52'>{note}</span>
                      </label>
                    ))}
                  </div>
                  <p className='text-xs font-semibold text-white/48'>Trẻ em trên 10 tuổi tính như 1 slot ngồi.</p>
                </div>

                <label className='grid gap-2 text-sm font-bold text-white/72'>
                  Ghi Chú/Yêu Cầu Riêng (Tuỳ Chọn)
                  <textarea
                    className='min-h-28 rounded-2xl border-2 border-white/15 bg-white/5 px-5 py-4 text-sm font-semibold text-white outline-none transition placeholder:text-white/35 focus:border-pink-500 focus:bg-white/10 focus:shadow-[3px_3px_0px_#f35abd]'
                    placeholder='Ví dụ: đến muộn 10 phút, cần hỗ trợ thêm...'
                  />
                </label>

                <label className='flex items-start gap-3 rounded-2xl border-2 border-white/10 bg-white/5 p-4 text-sm font-bold text-white/72 hover:border-white/20 transition-all duration-150 cursor-pointer has-[:checked]:border-pink-500 has-[:checked]:bg-pink-500/5'>
                  <input className='mt-1 accent-pink-500' type='checkbox' />
                  <span>Đến bằng xe hơi (Để nhân viên hỗ trợ chỗ đỗ xe)</span>
                </label>
                <label className='flex items-start gap-3 rounded-2xl border-2 border-white/10 bg-white/5 p-4 text-sm font-bold text-white/72 hover:border-white/20 transition-all duration-150 cursor-pointer has-[:checked]:border-pink-500 has-[:checked]:bg-pink-500/5'>
                  <input className='mt-1 accent-pink-500' type='checkbox' />
                  <span>Gói trang trí Sinh nhật, Ngày Lễ,... (tuỳ chọn, sẽ có nhân viên liên hệ tư vấn gói)</span>
                </label>
              </form>
            </section>

            <section className='section-card p-6 md:p-8'>
              <h2 className='flex items-center gap-2 text-xl font-extrabold tracking-[-0.025em]'>
                <IdCard className='text-pink-200' size={21} /> Xác Thực Căn Cước
              </h2>
              <p className='mt-3 text-sm font-semibold leading-6 text-white/58'>
                Dữ liệu thẻ CCCD của bạn sẽ được mã hoá và tự động xoá sau khi check-out.
              </p>
              <div className='mt-5 grid gap-4 md:grid-cols-2'>
                <label className='checkout-upload'>
                  <Upload size={24} className="text-pink-300" />
                  <span>Mặt Trước CCCD / Bằng Lái</span>
                  <input type='file' accept='image/*' />
                </label>
                <label className='checkout-upload'>
                  <Upload size={24} className="text-pink-300" />
                  <span>Mặt Sau CCCD / Bằng Lái</span>
                  <input type='file' accept='image/*' />
                </label>
              </div>
              <label className='mt-5 flex items-start gap-3 text-sm font-semibold leading-6 text-white/62 cursor-pointer hover:text-white transition-colors'>
                <input className='mt-1 accent-pink-500' type='checkbox' required />
                <span>
                  Tôi đồng ý với <a className='text-yellow-200 underline-offset-4 hover:underline font-bold'>Điều khoản và điều kiện</a> và đồng ý bảo lãnh cho bạn cùng phòng.
                </span>
              </label>
            </section>
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
              <div className='mt-5 border-t border-white/10 pt-5'>
                <div className='flex items-center justify-between text-sm font-bold text-white/62'>
                  <span>Tạm Tính</span>
                  <span className='text-xl font-extrabold text-yellow-200'>{money(checkout.price)}đ</span>
                </div>
                <p className='mt-3 flex items-center gap-2 text-xs font-semibold text-white/48'>
                  <Lock size={14} className="text-cyan-300" /> Giao dịch bảo mật bằng mã hoá SSL.
                </p>
              </div>
              <a className='primary-button mt-5 w-full text-center block py-3.5' href='#payment'>
                <CreditCard size={17} /> Xác Nhận Đặt Phòng
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

function PaymentLine({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className='rounded-2xl bg-white/5 px-4 py-3'>
      <p className='text-[0.68rem] font-extrabold uppercase tracking-[0.1em] text-white/38'>{label}</p>
      <p className={`mt-1 font-extrabold ${strong ? 'text-xl text-yellow-200' : 'text-sm text-white'}`}>{value}</p>
    </div>
  );
}
