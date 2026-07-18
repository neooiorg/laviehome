import { Clock, Phone, Wrench } from "lucide-react";

import { BrandWordmark } from "@/components/brand-wordmark";
import { compactPhone } from "@/lib/format";

export function MaintenanceScreen({ hotline }: { hotline?: string }) {
  return (
    <main className="site-shell flex min-h-dvh flex-col items-center justify-center px-6 py-16 text-center text-white">
      <div className="relative z-[1] flex w-full max-w-lg flex-col items-center">
        <BrandWordmark className="mb-10" />

        <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-[#f6d76f]/40 bg-[#f6d76f]/10 text-[#f6d76f] shadow-[0_8px_30px_rgba(246,215,111,0.2)]">
          <Wrench size={34} />
        </div>

        <h1 className="mt-7 text-2xl font-extrabold tracking-[-0.02em] sm:text-3xl">
          Đang bảo trì hệ thống
        </h1>
        <p className="mt-3 max-w-md text-sm font-semibold leading-6 text-white/60">
          Lavie Home đang được nâng cấp để phục vụ bạn tốt hơn. Vui lòng quay lại sau ít phút. Rất xin lỗi vì sự bất
          tiện này!
        </p>

        <p className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-white/55">
          <Clock size={14} className="text-[#f6d76f]" /> Chúng tôi sẽ trở lại trong thời gian sớm nhất
        </p>

        {hotline && (
          <a
            href={`tel:${compactPhone(hotline)}`}
            className="primary-button mt-8 px-7 py-3.5"
          >
            <Phone size={17} /> Gọi hotline {hotline}
          </a>
        )}
      </div>
    </main>
  );
}
