import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { BottomNav } from "@/components/bottom-nav";
import { CustomerTextContent } from "@/components/customer-text-content";
import { SiteHeader } from "@/components/site-header";
import { getCustomerContentConfig } from "@/lib/settings-actions";

const guideImages = [
  {
    src: "/images/guides/guide-step-1.jpg",
    width: 1414,
    height: 2000,
    title: "Bước 1",
    alt: "Ảnh hướng dẫn bước 1 khi đặt phòng LavieHome",
  },
  {
    src: "/images/guides/guide-step-2.jpg",
    width: 1414,
    height: 2000,
    title: "Bước 2",
    alt: "Ảnh hướng dẫn bước 2 khi đặt phòng LavieHome",
  },
  {
    src: "/images/guides/guide-step-3.jpg",
    width: 1414,
    height: 2000,
    title: "Bước 3",
    alt: "Ảnh hướng dẫn bước 3 khi đặt phòng LavieHome",
  },
];

export const metadata: Metadata = {
  title: "Hướng dẫn sử dụng | LavieHome",
  description: "Hướng dẫn tìm phòng, đặt phòng, thanh toán và nhận hỗ trợ khi sử dụng hệ thống LavieHome.",
};

export default async function GuidePage() {
  const content = await getCustomerContentConfig();

  return (
    <main className="site-shell min-h-dvh text-white">
      <SiteHeader />
      <div className="mx-auto w-[min(100%-2rem,1040px)] pb-20 pt-32">
        <article className="page-panel p-6 md:p-9">
          <p className="eyebrow">LavieHome self check-in 24/7</p>
          <h1 className="mt-2 text-3xl font-extrabold leading-tight tracking-[-0.025em] text-pink-100 md:text-5xl">
            Hướng dẫn sử dụng
          </h1>
          <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-5 md:p-6">
            <CustomerTextContent content={content.guide} />
            <p className="mt-5 text-sm font-semibold leading-7 text-white/70">
              Xem thêm{" "}
              <Link href="/rules" className="font-bold text-pink-200 hover:underline">
                nội quy và quy định
              </Link>{" "}
              trước khi nhận phòng.
            </p>
          </section>

          <section className="mt-10 space-y-6">
            <div>
              <p className="eyebrow">Ảnh minh họa</p>
              <h2 className="mt-2 text-2xl font-extrabold text-white">Các bước thao tác</h2>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              {guideImages.map((image) => (
                <figure
                  key={image.src}
                  className="overflow-hidden rounded-3xl border-2 border-white/12 bg-[#1b111f] shadow-[4px_4px_0px_rgba(255,255,255,0.06)]"
                >
                  <figcaption className="border-b border-white/10 px-4 py-3 text-xs font-black uppercase tracking-widest text-pink-200">
                    {image.title}
                  </figcaption>
                  <Image
                    src={image.src}
                    alt={image.alt}
                    width={image.width}
                    height={image.height}
                    sizes="(max-width: 1024px) 100vw, 33vw"
                    className="h-auto w-full"
                  />
                </figure>
              ))}
            </div>
          </section>
        </article>
      </div>
      <BottomNav />
    </main>
  );
}
