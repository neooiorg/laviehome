import type { Metadata } from "next";

import { BottomNav } from "@/components/bottom-nav";
import { SiteHeader } from "@/components/site-header";

const cancellationRules = [
  "Hủy phòng trước 24 tiếng so với giờ nhận phòng: chịu phí 30% giá trị đặt phòng.",
  "Hủy phòng trong khoảng 6-23 tiếng trước giờ nhận phòng: chịu phí 40% giá trị đặt phòng.",
  "Hủy phòng trong khoảng 3-6 tiếng trước giờ nhận phòng: không được hoàn tiền, chỉ được bảo lưu đặt phòng (tùy theo chính sách từng thời điểm).",
  "Cận giờ nhận phòng (nghĩa là trong khoảng chưa đến 3 tiếng là đến giờ nhận phòng), quý khách có công việc đột xuất tùy vào thời điểm nhân viên sẽ hỗ trợ đổi giờ hoặc bảo lưu 1 phần.",
];

export const metadata: Metadata = {
  title: "Chính sách hủy phòng & hoàn tiền | LavieHome",
  description: "Chính sách hủy phòng và hoàn tiền của LavieHome theo thời gian thông báo trước giờ nhận phòng.",
};

export default function CancellationPolicyPage() {
  return (
    <main className="site-shell min-h-dvh text-white">
      <SiteHeader />
      <div className="mx-auto w-[min(100%-2rem,860px)] pb-20 pt-32">
        <article className="page-panel p-6 md:p-9">
          <p className="eyebrow">Thông tin đặt phòng</p>
          <h1 className="mt-2 text-3xl font-extrabold leading-tight tracking-[-0.025em] text-pink-100 md:text-5xl">
            Chính sách hủy phòng & hoàn tiền
          </h1>

          <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-5 md:p-6">
            <h2 className="text-base font-extrabold text-white md:text-lg">Chính sách hủy phòng</h2>
            <p className="mt-4 text-sm font-semibold leading-7 text-white/70">
              Mức phí hủy phòng sẽ được tính dựa trên thời gian thông báo trước so với giờ nhận phòng đã xác nhận, cụ thể
              như sau:
            </p>
            <ul className="mt-4 list-disc space-y-3 pl-5 text-sm font-semibold leading-7 text-white/70">
              {cancellationRules.map((rule) => (
                <li key={rule}>{rule}</li>
              ))}
            </ul>
          </section>

          <p className="mt-6 rounded-3xl border border-pink-400/25 bg-pink-500/10 p-5 text-sm font-semibold leading-7 text-pink-100">
            LavieHome cam kết áp dụng chính sách hủy phòng một cách công bằng và minh bạch. Toàn bộ thông tin về phí hủy
            sẽ được thông báo rõ ràng cho khách hàng trước khi xác nhận hủy phòng.
          </p>
        </article>
      </div>
      <BottomNav />
    </main>
  );
}
