"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { BrandWordmark } from "@/components/brand-wordmark";
import { CUSTOMER_CONTACT } from "@/config/customer-info";

export function SiteHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);

  useEffect(() => {
    if (!mobileOpen && !guideOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMobileOpen(false);
        setGuideOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [mobileOpen, guideOpen]);

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-[80] border-b border-white/10 bg-[#100813]/86 backdrop-blur-xl">
        {/* Banner Khuyến Mãi cho Khách Hàng Mới */}
        <div className="w-full bg-gradient-to-r from-pink-600 via-rose-500 to-amber-500 py-2 text-white font-bold relative z-50 shadow-md">
          {/* Desktop Version */}
          <div className="hidden md:flex mx-auto max-w-7xl items-center justify-center gap-2 flex-wrap text-xs md:text-sm px-4">
            <span className="inline-flex items-center gap-1 rounded bg-white/20 px-2.5 py-0.5 text-[10px] md:text-xs font-black uppercase tracking-wider text-white border border-white/10">
              🎁 QUÀ TẶNG LẦN ĐẦU
            </span>
            <span>
              Tặng ngay <strong className="text-yellow-100 font-extrabold">Túi Mù May Mắn</strong> & giảm <strong className="text-yellow-100 font-extrabold">10%</strong> khi đặt phòng lần đầu! Nhập mã:
            </span>
            <span className="inline-block rounded bg-white px-2 py-0.5 font-mono text-xs font-black text-pink-600 shadow-sm border border-pink-100 select-all cursor-pointer">
              LAVIENEW
            </span>
          </div>

          {/* Mobile Version (Marquee Slide) */}
          <div className="md:hidden flex overflow-hidden whitespace-nowrap w-full text-[11px]">
            <div className="custom-marquee-track">
              {/* Slide Item 1 */}
              <div className="custom-marquee-content">
                <span className="inline-flex items-center gap-1 rounded bg-white/20 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-white border border-white/10 shrink-0">
                  🎁 QUÀ TẶNG LẦN ĐẦU
                </span>
                <span>
                  Tặng ngay <strong className="text-yellow-100 font-extrabold">Túi Mù May Mắn</strong> & giảm <strong className="text-yellow-100 font-extrabold">10%</strong> khi đặt phòng lần đầu! Nhập mã: <strong className="bg-white text-pink-600 px-1.5 py-0.5 rounded font-mono text-[10px] font-black mx-1">LAVIENEW</strong>
                </span>
              </div>
              {/* Slide Item 2 (Duplicate for seamless loop) */}
              <div className="custom-marquee-content">
                <span className="inline-flex items-center gap-1 rounded bg-white/20 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-white border border-white/10 shrink-0">
                  🎁 QUÀ TẶNG LẦN ĐẦU
                </span>
                <span>
                  Tặng ngay <strong className="text-yellow-100 font-extrabold">Túi Mù May Mắn</strong> & giảm <strong className="text-yellow-100 font-extrabold">10%</strong> khi đặt phòng lần đầu! Nhập mã: <strong className="bg-white text-pink-600 px-1.5 py-0.5 rounded font-mono text-[10px] font-black mx-1">LAVIENEW</strong>
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto flex w-[min(100%-2rem,1360px)] items-center justify-between gap-5 py-3">
          <Link href="/" className="flex min-w-0 shrink-0 items-center" aria-label="Lavie Home">
            <BrandWordmark />
          </Link>

          <nav className="hidden items-center gap-1.5 lg:flex">
            <Link className="nav-link" href="/#rooms">
              Khám Phá
            </Link>
            <Link className="nav-link" href="/checking">
              Tra Cứu
            </Link>
            <button
              className="nav-link cursor-pointer border-none bg-transparent text-left"
              onClick={() => setGuideOpen(true)}
            >
              Hướng Dẫn
            </button>
            <Link className="nav-link" href="/contacts">
              Chi Nhánh
            </Link>
            <Link
              className="primary-button ml-2 min-h-11 px-5 py-2.5 text-sm"
              href="/#booking"
              style={{ textTransform: "none" }}
            >
              Đặt phòng ngay
            </Link>
          </nav>

          <button
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 transition hover:bg-white/10 active:scale-95 lg:hidden"
            onClick={() => setMobileOpen((value) => !value)}
            aria-expanded={mobileOpen}
            aria-controls="mobile-sidebar"
            aria-label="Mở menu"
          >
            <Menu size={20} strokeWidth={1.5} />
          </button>
        </div>

        <div className={`mobile-drawer-shell lg:hidden ${mobileOpen ? "is-open" : ""}`}>
          <button
            className="mobile-drawer-backdrop"
            onClick={() => setMobileOpen(false)}
            aria-label="Đóng menu"
          />
          <aside
            id="mobile-sidebar"
            className="mobile-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Menu điều hướng"
          >
            <div className="mobile-drawer-head" style={{ justifyContent: "flex-end" }}>
              <button
                className="mobile-drawer-close"
                onClick={() => setMobileOpen(false)}
                aria-label="Đóng menu"
              >
                <X size={20} strokeWidth={1.5} />
              </button>
            </div>

            <nav className="mobile-drawer-nav">
              <Link className="mobile-drawer-link" href="/#rooms" onClick={() => setMobileOpen(false)}>
                Khám Phá Phòng
              </Link>
              <Link className="mobile-drawer-link" href="/checking" onClick={() => setMobileOpen(false)}>
                Tra Cứu Đặt Phòng
              </Link>
              <button
                className="mobile-drawer-link border-none bg-transparent text-left"
                onClick={() => {
                  setMobileOpen(false);
                  setGuideOpen(true);
                }}
              >
                Hướng Dẫn Sử Dụng
              </button>
              <Link className="mobile-drawer-link" href="/contacts" onClick={() => setMobileOpen(false)}>
                Hệ Thống Chi Nhánh
              </Link>
              <Link
                className="mobile-drawer-link is-primary justify-center"
                href="/#booking"
                onClick={() => setMobileOpen(false)}
                style={{ textTransform: "none" }}
              >
                Đặt phòng ngay
              </Link>
            </nav>

            <p className="mobile-drawer-note">Lavie Home self check-in 24/7</p>
          </aside>
        </div>
      </header>

      {guideOpen && (
        <div
          className="guide-modal-overlay fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4"
          onClick={() => setGuideOpen(false)}
        >
          <div
            className="guide-modal-card glass-panel relative w-full max-w-xl overflow-hidden rounded-3xl p-6 md:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="mobile-drawer-close absolute right-4 top-4"
              onClick={() => setGuideOpen(false)}
              aria-label="Đóng hướng dẫn"
            >
              <X size={18} strokeWidth={1.5} />
            </button>

            <h2 className="border-b border-white/10 pb-4 text-center text-xl font-extrabold text-pink-200">
              Hướng Dẫn Sử Dụng
            </h2>

            <div className="mt-6 max-h-[70vh] space-y-6 overflow-y-auto pr-1 text-sm text-white/80">
              <div>
                <h3 className="mb-2 flex items-center gap-2 text-base font-extrabold text-white">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-pink-500/20 text-xs text-pink-200">
                    1
                  </span>
                  Dành cho khách hàng
                </h3>
                <ul className="list-disc space-y-1.5 pl-8 text-white/70">
                  <li>Tìm kiếm phòng phù hợp với yêu cầu của quý khách.</li>
                  <li>Chọn khung giờ và nhấn &quot;Xác nhận đặt phòng&quot;.</li>
                  <li>Nhập thông tin người đặt và hoàn tất thanh toán.</li>
                  <li>Chờ xác nhận tự động hoặc từ lễ tân Lavie Home qua Zalo.</li>
                </ul>
              </div>

              <div>
                <h3 className="mb-2 flex items-center gap-2 text-base font-extrabold text-white">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-pink-500/20 text-xs text-pink-200">
                    2
                  </span>
                  Hủy đơn & hoàn tiền
                </h3>
                <ul className="list-disc space-y-1.5 pl-8 text-white/70">
                  <li>
                    Quý khách vui lòng gọi Hotline{" "}
                    <a href={`tel:${CUSTOMER_CONTACT.telHref}`} className="font-bold text-yellow-200 hover:underline">
                      {CUSTOMER_CONTACT.phoneDisplay}
                    </a>{" "}
                    để yêu cầu hủy.
                  </li>
                  <li>
                    Hoặc liên hệ{" "}
                    <a
                      href={CUSTOMER_CONTACT.zaloUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold text-blue-200 hover:underline"
                    >
                      Zalo Lavie Home {CUSTOMER_CONTACT.phoneDisplay}
                    </a>{" "}
                    để được hỗ trợ.
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="mb-2 flex items-center gap-2 text-base font-extrabold text-white">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-pink-500/20 text-xs text-pink-200">
                    3
                  </span>
                  Hỗ trợ phát sinh
                </h3>
                <ul className="list-disc space-y-1.5 pl-8 text-white/70">
                  <li>Lavie Home sẵn sàng hỗ trợ 24/7 mọi vấn đề liên quan dịch vụ.</li>
                  <li>Vui lòng tuân thủ quy định an ninh tại chi nhánh.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

