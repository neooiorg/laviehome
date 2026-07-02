import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BrandWordmark } from '@/components/brand-wordmark';
import { 
  ArrowLeft, 
  BedDouble, 
  MapPin, 
  MessageCircle, 
  Phone, 
  Sparkles, 
  ShieldCheck, 
  Check, 
  ArrowRight,
  Clock3
} from 'lucide-react';

import { SiteHeader } from '@/components/site-header';
import { getPublicBranches, getPublicRoomById } from '@/lib/homestay-dashboard';
import { money } from '@/lib/format';
import { compactPhone } from '@/lib/format';

const PLACEHOLDER_IMG = 'https://placehold.co/900x650/1b1023/white?text=Anh+phong';
function safeImg(src: string | undefined | null) {
  return src && src.startsWith('http') ? src : PLACEHOLDER_IMG;
}

// Helper to map amenity names to Lucide icons
function getAmenityIcon(amenity: string) {
  const lower = amenity.toLowerCase();
  if (lower.includes('bồn tắm') || lower.includes('tắm')) return BedDouble;
  if (lower.includes('máy chiếu') || lower.includes('chiếu')) return Sparkles;
  if (lower.includes('điều hòa') || lower.includes('máy lạnh')) return ShieldCheck;
  return Check;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function RoomDetailPage({ params }: PageProps) {
  const resolvedParams = await params;
  const roomId = Number(resolvedParams.id);
  
  if (isNaN(roomId)) {
    return notFound();
  }

  const [room, branches] = await Promise.all([
    getPublicRoomById(roomId),
    getPublicBranches()
  ]);

  if (!room) {
    return notFound();
  }

  const branch = branches.find((b) => b.id === room.branch_id) ?? branches[0];
  const validImages = (room.images ?? []).filter((img) => img && img.startsWith('http'));
  const allImages = validImages.length > 0 ? validImages : [safeImg(room.main_image)];

  return (
    <main className="site-shell min-h-dvh text-white flex flex-col justify-between">
      <div>
        <SiteHeader />
        
        <div className="mx-auto w-[min(100%-2rem,1360px)] pb-16 pt-32">
          {/* Back Navigation */}
          <Link 
            href="/" 
            className="group inline-flex items-center gap-2 text-pink-300 font-extrabold text-sm mb-8 hover:text-pink-400 transition-colors"
          >
            <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
            Quay lại trang chủ
          </Link>

          {/* Main Grid Section */}
          <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-8 xl:gap-12 items-start">
            
            {/* Left: Gallery Grid */}
            <div className="space-y-6">
              <div className="border-4 border-white bg-slate-900 rounded-3xl overflow-hidden shadow-[8px_8px_0px_rgba(243,90,189,0.4)] aspect-[16/10] relative">
                <Image
                  src={safeImg(room.main_image)}
                  alt={room.card_name}
                  fill
                  priority
                  className="object-cover"
                />
                <div className="absolute top-4 left-4 bg-pink-600 border-2 border-white text-white px-3 py-1.5 rounded-xl font-extrabold text-xs flex items-center gap-1.5 shadow-[3px_3px_0px_#fff]">
                  ✨ Ảnh phòng thực tế 100%
                </div>
              </div>

              {/* Grid of smaller images */}
              {allImages.length > 1 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {allImages.slice(1, 7).map((imgUrl: string, index) => (
                    <div 
                      key={index}
                      className="border-2 border-white/20 bg-slate-900 rounded-2xl overflow-hidden shadow-[4px_4px_0px_rgba(255,255,255,0.05)] hover:border-pink-300 hover:shadow-[4px_4px_0px_rgba(243,90,189,0.3)] transition-all aspect-[4/3] relative cursor-pointer group"
                    >
                      <Image
                        src={safeImg(imgUrl)}
                        alt={`${room.card_name} - Góc ${index + 2}`}
                        fill
                        className="object-cover transition duration-300 group-hover:scale-105"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Room Specs Panel */}
            <div className="space-y-6">
              <div className="rounded-3xl p-6 border-2 border-white/20 bg-[#1b111f] shadow-[6px_6px_0px_rgba(243,90,189,0.25)] space-y-6">
                
                {/* Branch and Badge */}
                <div className="space-y-2">
                  <span className="inline-block bg-yellow-300 text-black font-extrabold text-[10px] uppercase tracking-wider px-2.5 py-1 rounded border-2 border-slate-950 shadow-[2px_2px_0px_#f43f5e]">
                    {room.branch_name.split(' - ')[0]}
                  </span>
                  <h1 className="text-3xl font-black tracking-tight text-white mt-1">
                    {room.card_name}
                  </h1>
                  <p className="text-white/60 text-xs flex items-center gap-1">
                    <MapPin size={13} className="text-pink-300" />
                    {branch?.name || room.branch_name}
                  </p>
                </div>

                {/* Price Details */}
                <div className="border-t border-b border-white/10 py-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-white/62 text-sm font-semibold flex items-center gap-1">
                      <Clock3 size={15} className="text-pink-200" /> Giá theo khung giờ:
                    </span>
                    <span className="text-lg font-black text-yellow-300">
                      {money(room.price_from)}đ - {money(room.price_to)}đ
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white/62 text-sm font-semibold flex items-center gap-1">
                      <BedDouble size={15} className="text-pink-200" /> Giá qua đêm:
                    </span>
                    <span className="text-lg font-black text-pink-300">
                      {money(room.full_day_price)}đ
                    </span>
                  </div>
                </div>

                {/* Amenities */}
                <div className="space-y-3">
                  <h3 className="text-sm font-black text-white/50 uppercase tracking-widest">
                    Trang bị tiện ích
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {room.room_amenities.map((amenity) => {
                      const Icon = getAmenityIcon(amenity);
                      return (
                        <div 
                          key={amenity}
                          className="flex items-center gap-2 rounded-xl border border-white/5 bg-white/5 p-3 text-xs font-bold text-white/80"
                        >
                          <Icon size={14} className="text-pink-300 shrink-0" />
                          <span>{amenity}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Action CTA Buttons */}
                <div className="space-y-3.5 pt-4">
                  <Link 
                    href="/#booking" 
                    className="primary-button w-full text-center py-4 text-sm font-extrabold uppercase tracking-widest block"
                  >
                    Đặt phòng ngay bây giờ
                  </Link>

                  <a 
                    href={`https://zalo.me/${compactPhone(branch?.hotline ?? '0909123456')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 w-full rounded-xl border-2 border-blue-500 bg-blue-600/10 py-3.5 text-xs font-extrabold uppercase tracking-wider text-blue-300 shadow-[3px_3px_0px_#3b82f6] hover:shadow-[5px_5px_0px_#3b82f6] hover:-translate-y-0.5 transition-all cursor-pointer duration-150"
                  >
                    <MessageCircle size={16} />
                    Liên hệ Zalo chi nhánh
                  </a>

                  {branch?.google_maps_link && (
                    <a 
                      href={branch.google_maps_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 w-full rounded-xl border-2 border-white/20 bg-white/5 py-3.5 text-xs font-extrabold uppercase tracking-wider text-white shadow-[3px_3px_0px_rgba(255,255,255,0.15)] hover:shadow-[5px_5px_0px_white] hover:border-white hover:-translate-y-0.5 transition-all cursor-pointer duration-150"
                    >
                      Bản đồ chỉ đường
                      <ArrowRight size={14} />
                    </a>
                  )}
                </div>

              </div>

              {/* Safety/Privacy note card */}
              <div className="border-2 border-cyan-400 bg-cyan-950/20 rounded-3xl p-5 text-left shadow-[4px_4px_0px_#22d3ee] space-y-2">
                <h4 className="text-xs font-black text-cyan-300 uppercase tracking-widest flex items-center gap-1.5">
                  Bảo mật tuyệt đối
                </h4>
                <p className="text-xs text-white/80 leading-relaxed font-semibold">
                  Hệ thống cửa từ thông minh tự check-in 24/7. Phòng nghỉ cam kết 100% không có camera giám sát bên trong phòng nghỉ.
                </p>
              </div>

            </div>

          </div>
        </div>
      </div>

      {/* Dynamic Cyberpunk Footer Component */}
      <footer className="w-full border-t-2 border-white/10 bg-[#140a16] mt-16">
        <div className="mx-auto w-[min(100%-2rem,1360px)] py-12 grid grid-cols-1 md:grid-cols-3 gap-10 text-left">
          {/* Slogan and Brand Column */}
          <div className="space-y-4">
            <div className="block">
              <BrandWordmark />
            </div>
            <p className="text-xs text-white/60 font-semibold leading-relaxed max-w-[32ch]">
              Không gian nghỉ ngơi riêng tư hoàn hảo với quy trình tự động check-in 24/7 siêu tốc. Tiện nghi, hiện đại và bảo mật tuyệt đối.
            </p>
            <div className="flex gap-3">
              <span className="bg-pink-600/10 text-pink-300 font-bold text-[10px] uppercase tracking-wider px-2.5 py-1 rounded border border-pink-500/30">
                Bảo mật 100%
              </span>
              <span className="bg-yellow-500/10 text-yellow-300 font-bold text-[10px] uppercase tracking-wider px-2.5 py-1 rounded border border-yellow-500/30">
                Ảnh thực tế
              </span>
            </div>
          </div>

          {/* Quick links Column */}
          <div className="space-y-4">
            <h4 className="text-xs font-black text-white/50 uppercase tracking-widest">
              Liên kết nhanh
            </h4>
            <ul className="space-y-2 text-xs font-bold text-white/70">
              <li>
                <Link href="/" className="hover:text-pink-300 transition-colors">
                  Trang chủ
                </Link>
              </li>
              <li>
                <Link href="/checking" className="hover:text-pink-300 transition-colors">
                  Tra cứu đặt phòng
                </Link>
              </li>
              <li>
                <Link href="/contacts" className="hover:text-pink-300 transition-colors">
                  Hệ thống chi nhánh
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Hotline / Zalo Column */}
          <div className="space-y-4">
            <h4 className="text-xs font-black text-white/50 uppercase tracking-widest">
              Hỗ trợ khách hàng
            </h4>
            <div className="space-y-2 text-xs font-bold">
              <a 
                href={`tel:${compactPhone(branch?.hotline ?? '0909123456')}`}
                className="flex items-center gap-2 text-pink-300 hover:text-pink-400 transition-colors"
              >
                <Phone size={14} />
                Hotline: {branch?.hotline ?? '0909 123 456'}
              </a>
              <a 
                href={`https://zalo.me/${compactPhone(branch?.hotline ?? '0909123456')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-blue-300 hover:text-blue-400 transition-colors"
              >
                <MessageCircle size={14} />
                Nhắn Zalo hỗ trợ tức thì
              </a>
              <p className="text-[10px] text-white/40 font-semibold pt-2">
                Hệ thống tổng đài và nhân viên hỗ trợ trực tuyến 24/7.
              </p>
            </div>
          </div>
        </div>
        
        {/* Bottom copyright area */}
        <div className="border-t border-white/5 py-6 text-center text-[10px] font-bold text-white/40 uppercase tracking-widest">
          © 2025 Lavie Home. Tất cả quyền được bảo lưu.
        </div>
      </footer>
    </main>
  );
}
