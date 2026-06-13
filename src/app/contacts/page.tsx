"use client";

import { useState, useRef } from "react";
import { MapPin, Phone, MessageCircle, ArrowRight, BedDouble } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { activeBranches, compactPhone, roomsByBranch } from "@/lib/tete-data";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

export default function ContactsPage() {
  const [selectedBranchId, setSelectedBranchId] = useState(activeBranches[0]?.id ?? 30);
  const selectedBranch = activeBranches.find((b) => b.id === selectedBranchId) || activeBranches[0];
  const branchRooms = roomsByBranch(selectedBranchId);
  const containerRef = useRef<HTMLDivElement>(null);

  // Initial page entrance animation
  useGSAP(() => {
    const tl = gsap.timeline();
    tl.from(".contacts-header-animate", {
      opacity: 0,
      y: 30,
      duration: 0.6,
      stagger: 0.1,
      ease: "power3.out",
    })
    .from(".branch-card-animate", {
      opacity: 0,
      y: 15,
      duration: 0.5,
      stagger: 0.08,
      ease: "power3.out",
    }, "-=0.3");
  }, { scope: containerRef });

  // Animation triggered when selected branch changes
  useGSAP(() => {
    gsap.fromTo(".details-card-animate", 
      { opacity: 0, scale: 0.98, y: 15 },
      { opacity: 1, scale: 1, y: 0, duration: 0.5, ease: "power3.out" }
    );
  }, { dependencies: [selectedBranchId], scope: containerRef });

  return (
    <main className="site-shell min-h-dvh text-white" ref={containerRef}>
      <SiteHeader />
      <div className="mx-auto w-[min(100%-2rem,1360px)] pb-16 pt-32">
        <section className="mb-8">
          <p className="eyebrow contacts-header-animate">Thông tin liên hệ</p>
          <h1 className="mt-2 text-3xl font-extrabold leading-tight tracking-[-0.025em] md:text-5xl contacts-header-animate">
            Hệ thống chi nhánh
          </h1>
          <p className="mt-3 max-w-[62ch] text-sm font-semibold leading-6 text-white/62 md:text-[0.95rem] contacts-header-animate">
            Vui lòng chọn cơ sở bên dưới để xem chi tiết thông tin liên hệ, hotline, số lượng phòng và bản đồ chỉ đường.
          </p>
        </section>

        {/* Branch Selector Grid */}
        <section className="mb-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {activeBranches.map((branch) => {
            const parts = branch.name.split(" - ");
            const city = parts[0];
            const address = parts.slice(1).join(" - ") || "Chi nhánh";
            const isSelected = selectedBranchId === branch.id;

            return (
              <button
                key={branch.id}
                className={`flex flex-col items-start text-left p-4 rounded-2xl border transition-all duration-200 cursor-pointer branch-card-animate ${
                  isSelected
                    ? "border-pink-300 bg-gradient-to-br from-pink-500/20 to-yellow-500/5 text-white shadow-[0_0_20px_rgba(243,90,189,0.15)]"
                    : "border-white/10 bg-white/5 text-white hover:-translate-y-0.5 hover:bg-white/8 hover:border-white/20"
                }`}
                onClick={() => setSelectedBranchId(branch.id)}
              >
                <span className={`text-[0.66rem] font-extrabold uppercase tracking-wider mb-2 px-2.5 py-1 rounded-lg ${
                  isSelected ? "bg-pink-500/30 text-pink-200" : "bg-white/10 text-white/60"
                }`}>
                  {city}
                </span>
                <span className="text-sm font-bold leading-snug">
                  {address}
                </span>
              </button>
            );
          })}
        </section>

        {/* Details Card Panel */}
        {selectedBranch && (
          <section className="glass-panel rounded-3xl p-6 md:p-8 grid gap-8 lg:grid-cols-[1fr_480px] details-card-animate">
            <div className="flex flex-col justify-between">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-xl border border-pink-300/30 bg-pink-300/10 px-3 py-1.5 text-xs font-extrabold text-pink-200 uppercase tracking-wider">
                  Chi nhánh hoạt động
                </span>
                <h2 className="mt-4 text-2xl font-extrabold text-white md:text-3xl leading-tight">
                  Tê Tê Home - {selectedBranch.name.split(" - ").slice(1).join(" - ")}
                </h2>

                <div className="mt-8 space-y-6 text-sm">
                  <div className="flex items-start gap-4">
                    <div className="flex shrink-0 items-center justify-center w-10 h-10 rounded-xl bg-white/5 border border-white/10 text-pink-200">
                      <MapPin size={20} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white/50 uppercase tracking-wider">Địa chỉ</p>
                      <p className="mt-1 text-base font-bold text-white/90">
                        {selectedBranch.name.split(" - ").slice(1).join(" - ") === "30 Tháng 4"
                          ? "Số 30 Tháng 4, Phường 5, Thành phố Cà Mau"
                          : selectedBranch.name.split(" - ").slice(1).join(" - ") === "Chung Thành Châu"
                          ? "Số 12 Chung Thành Châu, Phường 5, Thành phố Cà Mau"
                          : selectedBranch.name.split(" - ").slice(1).join(" - ") === "Cái Khế - Trần Quang Khải"
                          ? "26 Trần Quang Khải, Phường Cái Khế, Quận Ninh Kiều, Cần Thơ"
                          : selectedBranch.name.split(" - ").slice(1).join(" - ") === "Trần Thị Nhượng"
                          ? "Số 45 Trần Thị Nhượng, Phường 4, Thành phố Cao Lãnh"
                          : "Số 88 Trần Văn Giàu, Phường An Hòa, Thành phố Rạch Giá"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="flex shrink-0 items-center justify-center w-10 h-10 rounded-xl bg-white/5 border border-white/10 text-pink-200">
                      <Phone size={20} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white/50 uppercase tracking-wider">Hotline hỗ trợ</p>
                      <p className="mt-1 text-base font-bold text-white/90">{selectedBranch.hotline}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="flex shrink-0 items-center justify-center w-10 h-10 rounded-xl bg-white/5 border border-white/10 text-pink-200">
                      <BedDouble size={20} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white/50 uppercase tracking-wider">Quy mô cơ sở</p>
                      <p className="mt-1 text-base font-bold text-white/90">
                        Tổng số {branchRooms.length} phòng đang hoạt động
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex flex-wrap gap-4">
                <a 
                  className="primary-button px-6 min-h-12 text-sm" 
                  href={`tel:${compactPhone(selectedBranch.hotline)}`}
                >
                  <Phone size={16} /> Gọi Hotline
                </a>
                <a 
                  className="primary-button px-6 min-h-12 text-sm bg-blue-600/20 border border-blue-500/30 text-blue-200 hover:bg-blue-600/30 transition-all duration-200" 
                  href={`https://zalo.me/${compactPhone(selectedBranch.hotline)}`}
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  <MessageCircle size={16} /> Nhắn Zalo
                </a>
                <a 
                  className="primary-button px-6 min-h-12 text-sm bg-white/5 border border-white/10 text-white hover:bg-white/10" 
                  href={selectedBranch.google_maps_link}
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  Chỉ đường <ArrowRight size={16} className="ml-1" />
                </a>
              </div>
            </div>

            {/* Map Iframe Column */}
            <div className="h-[320px] lg:h-[400px] w-full rounded-2xl overflow-hidden border border-white/10 relative bg-white/5 shadow-2xl">
              <iframe
                title={`Bản đồ chỉ đường tới ${selectedBranch.name}`}
                src={`https://maps.google.com/maps?q=${encodeURIComponent(
                  selectedBranch.name.split(" - ").slice(1).join(" - ") === "Cái Khế - Trần Quang Khải"
                    ? "Tê Tê Home - Cái Khế"
                    : selectedBranch.name.split(" - ").slice(1).join(" - ") === "30 Tháng 4"
                    ? "Tê Tê Home - 30 Tháng 4"
                    : selectedBranch.name.split(" - ").slice(1).join(" - ") === "Chung Thành Châu"
                    ? "Tê Tê Home - Chung Thành Châu"
                    : selectedBranch.name.split(" - ").slice(1).join(" - ") === "Trần Thị Nhượng"
                    ? "Tê Tê Home - Trần Thị Nhượng"
                    : "Tê Tê Home - Trần Văn Giàu"
                )}&t=&z=16&ie=UTF8&iwloc=&output=embed`}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
