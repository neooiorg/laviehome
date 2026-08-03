import type { Metadata } from "next";

import { BottomNav } from "@/components/bottom-nav";
import { CustomerTextContent } from "@/components/customer-text-content";
import { SiteHeader } from "@/components/site-header";
import { getCustomerContentConfig } from "@/lib/settings-actions";

export const metadata: Metadata = {
  title: "Nội quy và quy định | LavieHome",
  description: "Các lưu ý checkin, checkout, điều khoản cấm và quy định giữ gìn vệ sinh tại LavieHome Cần Thơ.",
};

export default async function RulesPage() {
  const content = await getCustomerContentConfig();

  return (
    <main className="site-shell min-h-dvh text-white">
      <SiteHeader />
      <div className="mx-auto w-[min(100%-2rem,920px)] pb-20 pt-32">
        <article className="page-panel p-6 md:p-9">
          <p className="eyebrow">LavieHome Cần Thơ</p>
          <h1 className="mt-2 text-3xl font-extrabold leading-tight tracking-[-0.025em] text-pink-100 md:text-5xl">
            Nội quy và quy định
          </h1>
          <p className="mt-5 text-sm font-semibold leading-7 text-white/70 md:text-base">
            Chào mừng quý khách đến với không gian nghỉ dưỡng của LavieHome tại Cần Thơ. Nội dung bên dưới được cập nhật trực tiếp từ admin.
          </p>

          <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-5 md:p-6">
            <CustomerTextContent content={content.rules} />
          </section>
        </article>
      </div>
      <BottomNav />
    </main>
  );
}
