import type { Metadata } from "next";
import Link from "next/link";
import {
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ExternalLink,
  Home,
  KeyRound,
  MapPin,
  Search,
  Wifi,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { BottomNav } from "@/components/bottom-nav";
import { SiteHeader } from "@/components/site-header";
import { CUSTOMER_LOCATION } from "@/config/customer-info";
import { ensureBookingNotificationColumns } from "@/lib/booking-records";
import { generateDoorCode } from "@/lib/door-code";
import { query, queryOne } from "@/lib/postgres";
import { SuccessEmailActions } from "./success-email-actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Đặt phòng thành công | LavieHome",
  description: "Thông tin đặt phòng thành công và hướng dẫn tự check-in tại LavieHome.",
};

type SuccessSearchParams = Record<string, string | string[] | undefined>;

type SuccessBookingRow = {
  id: string;
  status: string;
  customer_email: string | null;
  customer_name: string | null;
  room_name: string | null;
  branch_name: string | null;
  date_label: string | null;
  time_range: string | null;
  door_code: string | null;
  maps_url: string | null;
};

const PAID_STATUSES = new Set(["Đã thanh toán", "Đã xác nhận", "Chờ cọc", "Đang ở", "Hoàn tất"]);

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value ?? "";
}

async function getPaidBooking(bookingId: string) {
  if (!bookingId) return null;

  await ensureBookingNotificationColumns();

  const booking = await queryOne<SuccessBookingRow>(
    `
    select
      b.id,
      b.status,
      b.customer_email,
      b.customer_name,
      b.room_name,
      b.branch_name,
      b.date_label,
      b.time_range,
      b.door_code,
      coalesce(br.google_maps_link, '') as maps_url
    from bookings b
    left join branches br on br.id = b.branch_id
    where upper(b.id) = $1
    `,
    [bookingId.toUpperCase()]
  );

  if (!booking || !PAID_STATUSES.has(booking.status)) return null;

  if (!booking.door_code) {
    booking.door_code = generateDoorCode();
    await query(`update bookings set door_code = $1, updated_at = now() where upper(id) = $2`, [
      booking.door_code,
      bookingId.toUpperCase(),
    ]);
  }

  return booking;
}

function BookingMissingState({ bookingId }: { bookingId: string }) {
  return (
    <main className="site-shell min-h-dvh text-white">
      <SiteHeader />
      <div className="mx-auto flex min-h-[72dvh] w-[min(100%-2rem,760px)] items-center pb-20 pt-32">
        <section className="page-panel w-full p-6 text-center md:p-10">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-yellow-200/40 bg-yellow-200/10 text-yellow-100">
            <Search size={28} />
          </div>
          <h1 className="mt-5 text-3xl font-extrabold tracking-[-0.02em] text-pink-100">
            Chưa tìm thấy đơn đã thanh toán
          </h1>
          <p className="mt-3 text-sm font-semibold leading-6 text-white/65">
            {bookingId
              ? `Mã ${bookingId} chưa có trạng thái thanh toán hoàn tất.`
              : "Thiếu mã đặt phòng để tra cứu thông tin check-in."}
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <Link className="primary-button py-3.5" href="/checking">
              <Search size={17} /> Tra cứu đặt phòng
            </Link>
            <Link
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border-2 border-white/20 bg-white/5 px-5 text-sm font-extrabold text-white transition hover:border-pink-200 hover:bg-white/10"
              href="/"
            >
              <Home size={17} /> Về trang chủ
            </Link>
          </div>
        </section>
      </div>
      <BottomNav />
    </main>
  );
}

function SuccessStep({
  index,
  title,
  icon: Icon,
  children,
}: {
  index: number;
  title: string;
  icon: LucideIcon;
  children: ReactNode;
}) {
  return (
    <div className="grid grid-cols-[3.25rem_1fr] gap-4">
      <div className="relative flex justify-center">
        {index < 4 && <span className="absolute top-12 bottom-[-1.9rem] w-0.5 rounded-full bg-pink-200/35" />}
        <span className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full border-2 border-white bg-gradient-to-br from-pink-500 to-yellow-200 text-base font-black text-[#170913] shadow-[3px_3px_0px_rgba(243,90,189,0.45)]">
          {index}
        </span>
      </div>
      <div className="pb-7">
        <h3 className="flex items-center gap-2 text-lg font-black uppercase tracking-[0.02em] text-pink-100">
          <Icon size={19} className="text-yellow-200" /> {title}
        </h3>
        <div className="mt-2 text-base font-semibold leading-7 text-white/76">{children}</div>
      </div>
    </div>
  );
}

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<SuccessSearchParams>;
}) {
  const params = await searchParams;
  const bookingId = firstValue(params.booking_id || params.code).trim();
  const booking = await getPaidBooking(bookingId);

  if (!booking) {
    return <BookingMissingState bookingId={bookingId} />;
  }

  const mapsUrl = booking.maps_url || CUSTOMER_LOCATION.mapsUrl;
  const branchName = booking.branch_name || CUSTOMER_LOCATION.branchName;
  const roomName = booking.room_name || "Phòng LavieHome";
  const dateLine = [booking.date_label, booking.time_range].filter(Boolean).join(" - ");

  return (
    <main className="site-shell min-h-dvh text-white">
      <SiteHeader />
      <div className="mx-auto w-[min(100%-2rem,860px)] pb-20 pt-32 md:pt-36">
        <section className="page-panel overflow-hidden p-0">
          <div className="px-5 pb-7 pt-8 text-center md:px-9 md:pt-10">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-pink-200/35 bg-pink-200/[0.12] text-pink-100 shadow-[0_0_30px_rgba(243,90,189,0.18)]">
              <CheckCircle2 size={34} />
            </div>
            <p className="mt-5 text-xs font-black uppercase tracking-[0.16em] text-yellow-200">
              LavieHome đã xác nhận thanh toán
            </p>
            <h1 className="mt-2 text-3xl font-black leading-tight tracking-[-0.02em] text-pink-100 md:text-5xl">
              Đặt phòng thành công
            </h1>
            <p className="mx-auto mt-3 max-w-[54ch] text-sm font-semibold leading-6 text-white/68 md:text-base">
              Cảm ơn bạn đã lựa chọn LavieHome. Vui lòng lưu lại thông tin bên dưới để tự check-in thuận tiện.
            </p>
          </div>

          <div className="mx-5 overflow-hidden rounded-2xl border border-pink-200/[0.24] bg-[#170c1d] text-center md:mx-9">
            <div className="bg-pink-200/10 px-4 py-3 text-base font-extrabold text-pink-100">Mã nhận phòng</div>
            <div className="border-t border-white/10 px-4 py-4 text-2xl font-black text-white">{booking.id}</div>
            <div className="border-t border-white/10 px-4 py-4 text-lg font-black text-white">{roomName}</div>
            <div className="border-t border-white/10 px-4 py-4 text-sm font-semibold leading-6 text-white/72">
              <CalendarDays className="mr-1 inline-block text-yellow-200" size={16} />
              {dateLine || "LavieHome sẽ xác nhận thời gian nhận phòng qua Zalo/email."}
            </div>
          </div>

          <div className="px-5 py-8 md:px-9 md:py-10">
            <h2 className="text-center text-2xl font-black uppercase tracking-[0.04em] text-pink-100 md:text-3xl">
              Hướng dẫn tự check-in
            </h2>

            <div className="mt-8">
              <SuccessStep index={1} title="Địa chỉ" icon={MapPin}>
                <p>{branchName}</p>
                <a
                  className="mt-1 inline-flex items-center gap-1 font-extrabold text-yellow-200 underline decoration-pink-200/60 underline-offset-4"
                  href={mapsUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Xem trên Google Maps <ExternalLink size={15} />
                </a>
              </SuccessStep>

              <SuccessStep index={2} title="Hướng dẫn tự check-in" icon={KeyRound}>
                <p>
                  Quý khách xem kỹ hướng dẫn tự check-in và lưu lại.{" "}
                  <Link
                    className="font-extrabold text-yellow-200 underline decoration-pink-200/60 underline-offset-4"
                    href="/guide"
                  >
                    Xem hướng dẫn
                  </Link>
                </p>
                <p className="mt-2 text-lg font-black text-yellow-200">
                  Mật khẩu cửa: <span className="font-mono text-pink-100">{booking.door_code}</span>
                </p>
              </SuccessStep>

              <SuccessStep index={3} title="Nội quy" icon={BookOpen}>
                <p>
                  Quý khách xem kỹ nội quy và tuân thủ khi ở tại LavieHome.{" "}
                  <Link
                    className="font-extrabold text-yellow-200 underline decoration-pink-200/60 underline-offset-4"
                    href="/rules"
                  >
                    Xem nội quy
                  </Link>
                </p>
              </SuccessStep>

              <SuccessStep index={4} title="Mật khẩu Wi-Fi" icon={Wifi}>
                <p>Tên Wifi: LAVIE HOME</p>
                <p>Mật khẩu: laviehome</p>
              </SuccessStep>
            </div>

            <SuccessEmailActions bookingId={booking.id} customerEmail={booking.customer_email} />

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <Link className="primary-button py-3.5" href="/">
                <Home size={17} /> Quay lại trang chủ
              </Link>
              <Link
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border-2 border-white/20 bg-white/5 px-5 text-sm font-extrabold text-white transition hover:border-pink-200 hover:bg-white/10"
                href={`/checking?code=${encodeURIComponent(booking.id)}`}
              >
                <Search size={17} /> Tra cứu đặt phòng
              </Link>
            </div>
          </div>
        </section>
      </div>
      <BottomNav />
    </main>
  );
}
