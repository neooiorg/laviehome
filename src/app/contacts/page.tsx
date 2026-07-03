import Link from 'next/link';
import { ArrowRight, BedDouble, MapPin, MessageCircle, Phone } from 'lucide-react';

import { SiteHeader } from '@/components/site-header';
import { BottomNav } from '@/components/bottom-nav';
import { getPublicBranches, getPublicRooms } from '@/lib/homestay-dashboard';
import { compactPhone } from '@/lib/format';

export default async function ContactsPage() {
  const [branches, rooms] = await Promise.all([getPublicBranches(), getPublicRooms()]);

  return (
    <main className='site-shell min-h-dvh text-white'>
      <SiteHeader />
      <div className='mx-auto w-[min(100%-2rem,1360px)] pb-16 pt-32'>
        <section className='mb-8 space-y-4'>
          <div className='flex flex-wrap gap-2'>
            <span className='bg-pink-600 text-white font-extrabold text-[10px] uppercase tracking-wider px-3 py-1 rounded-md border border-white'>
              📍 BẢN ĐỒ CHI NHÁNH
            </span>
            <span className='bg-purple-600 text-white font-extrabold text-[10px] uppercase tracking-wider px-3 py-1 rounded-md border border-white'>
              📞 HỖ TRỢ 24/7
            </span>
          </div>
          <div>
            <p className='eyebrow'>Thông tin liên hệ</p>
            <h1 className='mt-2 text-3xl font-extrabold leading-tight tracking-[-0.025em] md:text-5xl'>Hệ thống chi nhánh</h1>
            <p className='mt-3 max-w-[62ch] text-sm font-semibold leading-6 text-white/62 md:text-[0.95rem]'>
              Chọn một cơ sở bên dưới để xem hotline, số lượng phòng và liên kết bản đồ của từng chi nhánh Lavie Home.
            </p>
          </div>
        </section>

        <section className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
          {branches.map((branch) => {
            const branchRooms = rooms.filter((room) => room.branch_id === branch.id);
            const parts = branch.name.split(' - ');
            const city = parts[0];
            const address = parts.slice(1).join(' - ') || 'Chi nhánh';

            return (
              <article
                key={branch.id}
                className='flex flex-col gap-4 rounded-3xl border-2 border-white/15 bg-[#1b111f] p-5 shadow-[4px_4px_0px_rgba(255,255,255,0.05)] hover:border-pink-500 hover:shadow-[6px_6px_0px_#f35abd] hover:-translate-y-1 transition-all duration-150'
              >
                <div>
                  <p className='eyebrow'>{city}</p>
                  <h2 className='mt-2 text-lg font-extrabold'>{address}</h2>
                </div>
                <div className='space-y-3 text-sm font-semibold text-white/72'>
                  <div className='flex items-start gap-3'>
                    <MapPin size={18} className='mt-0.5 shrink-0 text-pink-200' />
                    <span>
                      {branch.name}
                    </span>
                  </div>
                  <div className='flex items-start gap-3'>
                    <Phone size={18} className='mt-0.5 shrink-0 text-pink-200' />
                    <span>{branch.hotline}</span>
                  </div>
                  <div className='flex items-start gap-3'>
                    <BedDouble size={18} className='mt-0.5 shrink-0 text-pink-200' />
                    <span>{branchRooms.length} phòng đang hoạt động</span>
                  </div>
                </div>
                <div className='mt-auto flex flex-col gap-3.5 pt-2'>
                  <a
                    className='primary-button w-full text-center'
                    href={`tel:${compactPhone(branch.hotline)}`}
                  >
                    <Phone size={16} /> Gọi hotline
                  </a>
                  <div className='grid grid-cols-2 gap-3'>
                    <a
                      className='inline-flex items-center justify-center gap-1.5 rounded-xl border-2 border-blue-500 bg-blue-600/10 py-2.5 text-xs font-extrabold uppercase tracking-wider text-blue-300 shadow-[3px_3px_0px_#3b82f6] hover:shadow-[5px_5px_0px_#3b82f6] hover:-translate-y-0.5 transition-all cursor-pointer duration-150'
                      href={`https://zalo.me/${compactPhone(branch.hotline)}`}
                      target='_blank'
                      rel='noopener noreferrer'
                    >
                      <MessageCircle size={16} /> Zalo
                    </a>
                    <a
                      className='inline-flex items-center justify-center gap-1.5 rounded-xl border-2 border-white/20 bg-white/5 py-2.5 text-xs font-extrabold uppercase tracking-wider text-white shadow-[3px_3px_0px_rgba(255,255,255,0.15)] hover:shadow-[5px_5px_0px_white] hover:border-white hover:-translate-y-0.5 transition-all cursor-pointer duration-150'
                      href={branch.google_maps_link}
                      target='_blank'
                      rel='noopener noreferrer'
                    >
                      Bản đồ <ArrowRight size={14} />
                    </a>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      </div>
      <BottomNav />
    </main>
  );
}
