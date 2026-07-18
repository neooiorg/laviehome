import Link from "next/link";
import { Home, Search } from "lucide-react";

import { BrandWordmark } from "@/components/brand-wordmark";
import "../styles/customer.css";

export const metadata = {
  title: "Không tìm thấy trang",
};

export default function NotFound() {
  return (
    <main className="site-shell flex min-h-dvh flex-col items-center justify-center px-6 py-16 text-center text-white">
      <div className="relative z-[1] flex w-full max-w-lg flex-col items-center">
        <Link href="/" aria-label="Về trang chủ">
          <BrandWordmark className="mb-10" />
        </Link>

        <p
          className="bg-gradient-to-br from-[#ff8fd9] via-[#f35abd] to-[#f6d76f] bg-clip-text text-[7rem] font-black leading-none text-transparent drop-shadow-[0_8px_30px_rgba(243,90,189,0.35)] sm:text-[9rem]"
          aria-hidden="true"
        >
          404
        </p>

        <h1 className="mt-2 text-2xl font-extrabold tracking-[-0.02em] sm:text-3xl">
          Ôi, trang này không tồn tại
        </h1>
        <p className="mt-3 max-w-md text-sm font-semibold leading-6 text-white/60">
          Trang bạn tìm có thể đã được chuyển đi hoặc không còn nữa. Hãy quay lại trang chủ để tiếp tục đặt phòng nhé.
        </p>

        <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <Link className="primary-button px-7 py-3.5" href="/">
            <Home size={17} /> Về trang chủ
          </Link>
          <Link
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border-2 border-white/20 bg-white/5 px-7 py-3.5 text-sm font-extrabold text-white transition-all duration-150 hover:-translate-y-0.5 hover:border-white hover:bg-white/10"
            href="/checking"
          >
            <Search size={17} /> Tra cứu đặt phòng
          </Link>
        </div>
      </div>
    </main>
  );
}
