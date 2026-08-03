import type { Metadata } from "next";

import { BottomNav } from "@/components/bottom-nav";
import { CustomerTextContent } from "@/components/customer-text-content";
import { SiteHeader } from "@/components/site-header";
import { getCustomerContentConfig } from "@/lib/settings-actions";

export const metadata: Metadata = {
  title: "Chính sách hủy phòng & hoàn tiền | LavieHome",
  description: "Chính sách hủy phòng và hoàn tiền của LavieHome theo thời gian thông báo trước giờ nhận phòng.",
};

export default async function CancellationPolicyPage() {
  const content = await getCustomerContentConfig();

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
            <CustomerTextContent content={content.cancellationPolicy} />
          </section>
        </article>
      </div>
      <BottomNav />
    </main>
  );
}
