import Link from "next/link";
import { MapPin, MessageCircle, Phone } from "lucide-react";

import { BrandWordmark } from "@/components/brand-wordmark";
import { CUSTOMER_CONTACT, CUSTOMER_LOCATION } from "@/config/customer-info";
import { compactPhone } from "@/lib/format";

export function SiteFooter() {
  return (
    <footer className="w-full border-t-2 border-white/10 bg-[#140a16] mt-16 pb-20 md:pb-6">
      <div className="mx-auto grid w-[min(100%-2rem,1360px)] grid-cols-1 gap-10 py-12 text-left md:grid-cols-3">
        <div className="space-y-4">
          <BrandWordmark />
          <p className="max-w-[32ch] text-xs font-semibold leading-relaxed text-white/60">
            Không gian nghỉ ngơi riêng tư với quy trình tự động check-in 24/7.
            Tiện nghi, hiện đại và bảo mật tuyệt đối.
          </p>
          <div className="flex flex-wrap gap-3">
            <span className="rounded border border-pink-500/30 bg-pink-600/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-pink-300">
              Bảo mật 100%
            </span>
            <span className="rounded border border-yellow-500/30 bg-yellow-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-yellow-300">
              Ảnh thực tế
            </span>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="text-xs font-black uppercase tracking-widest text-white/50">
            Liên kết nhanh
          </h4>
          <ul className="space-y-2 text-xs font-bold text-white/70">
            <li>
              <Link href="/" className="transition-colors hover:text-pink-300">
                Trang chủ
              </Link>
            </li>
            <li>
              <Link href="/checking" className="transition-colors hover:text-pink-300">
                Tra cứu đặt phòng
              </Link>
            </li>
            <li>
              <Link href="/contacts" className="transition-colors hover:text-pink-300">
                Hệ thống chi nhánh
              </Link>
            </li>
            <li>
              <Link href="/guide" className="transition-colors hover:text-pink-300">
                Hướng dẫn
              </Link>
            </li>
            <li>
              <Link href="/rules" className="transition-colors hover:text-pink-300">
                Nội quy và quy định
              </Link>
            </li>
            <li>
              <Link href="/cancellation-policy" className="transition-colors hover:text-pink-300">
                Chính sách hủy phòng & hoàn tiền
              </Link>
            </li>
          </ul>
        </div>

        <div className="space-y-4">
          <h4 className="text-xs font-black uppercase tracking-widest text-white/50">
            Hỗ trợ khách hàng
          </h4>
          <div className="space-y-2 text-xs font-bold">
            <p className="text-xs font-black text-white">Lavie Home Cần Thơ</p>
            <p className="flex items-start gap-2 text-white/55">
              <MapPin size={14} className="mt-0.5 shrink-0" />
              <span>{CUSTOMER_LOCATION.address}</span>
            </p>
            <a
              href={`tel:${compactPhone(CUSTOMER_CONTACT.phoneLocalCompact)}`}
              className="flex items-center gap-2 text-pink-300 transition-colors hover:text-pink-400"
            >
              <Phone size={14} />
              Hotline: {CUSTOMER_CONTACT.phoneLocalDisplay}
            </a>
            <a
              href={CUSTOMER_CONTACT.zaloUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-blue-300 transition-colors hover:text-blue-400"
            >
              <MessageCircle size={14} />
              Nhắn Zalo hỗ trợ 24/7
            </a>
            <a
              href={CUSTOMER_LOCATION.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-yellow-200 transition-colors hover:text-yellow-300"
            >
              <MapPin size={14} />
              Xem bản đồ chỉ đường
            </a>
          </div>
        </div>
      </div>

      <div className="border-t border-white/5 py-6 text-center text-[10px] font-bold uppercase tracking-widest text-white/40">
        © 2026 Lavie Home. Tất cả quyền được bảo lưu.
      </div>
    </footer>
  );
}
