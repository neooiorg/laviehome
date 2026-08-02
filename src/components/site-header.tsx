"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { BrandWordmark } from "@/components/brand-wordmark";

export function SiteHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!mobileOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMobileOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [mobileOpen]);

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-[80] border-b border-white/10 bg-[#100813]/86 backdrop-blur-xl">
        {/* Banner Khuyến Mãi cho Khách Hàng Mới */}
        <div className="w-full bg-gradient-to-r from-pink-600 via-rose-500 to-amber-500 py-2 text-white font-bold relative z-50 shadow-md">
          {/* Desktop Version */}
          <div className="hidden md:flex mx-auto max-w-7xl items-center justify-center gap-2 flex-wrap text-xs md:text-sm px-4">
            <span className="inline-flex items-center gap-1 rounded bg-white/20 px-2.5 py-0.5 text-[10px] md:text-xs font-black uppercase tracking-wider text-white border border-white/10">
              ƯU ĐÃI LẦN ĐẦU
            </span>
            <span>
              Giảm ngay <strong className="text-yellow-100 font-extrabold">10%</strong> khi đặt phòng lần đầu! Nhập mã:
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
                  ƯU ĐÃI LẦN ĐẦU
                </span>
                <span>
                  Giảm ngay <strong className="text-yellow-100 font-extrabold">10%</strong> khi đặt phòng lần đầu! Nhập mã: <strong className="bg-white text-pink-600 px-1.5 py-0.5 rounded font-mono text-[10px] font-black mx-1">LAVIENEW</strong>
                </span>
              </div>
              {/* Slide Item 2 (Duplicate for seamless loop) */}
              <div className="custom-marquee-content">
                <span className="inline-flex items-center gap-1 rounded bg-white/20 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-white border border-white/10 shrink-0">
                  ƯU ĐÃI LẦN ĐẦU
                </span>
                <span>
                  Giảm ngay <strong className="text-yellow-100 font-extrabold">10%</strong> khi đặt phòng lần đầu! Nhập mã: <strong className="bg-white text-pink-600 px-1.5 py-0.5 rounded font-mono text-[10px] font-black mx-1">LAVIENEW</strong>
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
            <Link className="nav-link" href="/guide">
              Hướng Dẫn
            </Link>
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
              <Link className="mobile-drawer-link" href="/guide" onClick={() => setMobileOpen(false)}>
                Hướng Dẫn Sử Dụng
              </Link>
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

    </>
  );
}

