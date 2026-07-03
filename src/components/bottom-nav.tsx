"use client";

import Link from "next/link";
import { Home, MapPin, Phone, Search } from "lucide-react";
import { compactPhone } from "@/lib/format";

export function BottomNav({ hotline = "0909123456" }: { hotline?: string }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-4 border-t border-white/10 bg-[#1b1024]/95 px-2 py-2 backdrop-blur-xl md:hidden">
      <Link className="bottom-link" href="/#rooms">
        <Home size={18} /> Trang chủ
      </Link>
      <Link className="bottom-link" href="/checking">
        <Search size={18} /> Tra cứu
      </Link>
      <a className="bottom-link" href={`tel:${compactPhone(hotline)}`}>
        <Phone size={18} /> Gọi ngay
      </a>
      <Link className="bottom-link" href="/contacts">
        <MapPin size={18} /> Địa chỉ
      </Link>
    </nav>
  );
}
