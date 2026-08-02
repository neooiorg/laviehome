import type { Metadata } from "next";

import { BottomNav } from "@/components/bottom-nav";
import { SiteHeader } from "@/components/site-header";

const sections = [
  {
    title: "1. CÁC LƯU Ý KHI CHECKIN/CHECKOUT",
    items: [
      "Bạn vui lòng check in đúng khung giờ đã đặt để công tác vệ sinh phòng và quá trình rà soát cam ẩn được hoàn tất theo đúng quy trình.",
      "Muốn nhận phòng sớm hoặc trả phòng trễ, vui lòng liên hệ Hotline 0706595899 trước ít nhất 2 giờ để chúng tôi kiểm tra tình trạng phòng và hỗ trợ (phát sinh phụ phí 60k/h).",
      "Quý khách tự lấy chìa khóa/mật khẩu khóa số theo hướng dẫn trực tiếp sau khi đã thanh toán đặt phòng hoặc được gửi qua tin nhắn Zalo trước giờ nhận phòng.",
      "Khi trả phòng: vui lòng khóa cửa cẩn thận và đặt chìa khóa đúng vị trí ban đầu.",
      "Quý khách vui lòng tự bảo quản tư trang cá nhân và kiểm tra kỹ trước khi rời phòng; homestay không chịu trách nhiệm với vật dụng cá nhân bỏ quên hoặc thất lạc.",
    ],
  },
  {
    title: "2. ĐIỀU KHOẢN CẤM",
    items: [
      "Sử dụng, tàng trữ, mua bán ma túy, chất kích thích hoặc chất cấm theo quy định pháp luật.",
      "Tàng trữ vũ khí, vật liệu cháy nổ, hóa chất độc hại hoặc vật dụng nguy hiểm.",
      "Mua bán dâm, môi giới mại dâm hoặc tổ chức đánh bạc dưới mọi hình thức.",
      "Mọi vi phạm nghiêm trọng về pháp luật sẽ bị buộc rời khỏi Home ngay lập tức và không bồi hoàn. Khách phải đủ 16 tuổi; nếu cố ý đặt phòng khi 1 trong 2 chưa đủ tuổi, khách sẽ hoàn toàn tự chịu trách nhiệm trước pháp luật.",
    ],
  },
  {
    title: "3. CÁC LƯU Ý VỀ GIỮ GÌN VỆ SINH VÀ TRẬT TỰ CHUNG",
    items: [
      "Sau 22:00, vui lòng tiết chế âm lượng tránh gây ảnh hưởng tới các khách lưu trú khác.",
      "Không mang thú cưng vào homestay trừ khi có thỏa thuận trước với bên phía Home.",
      "Không tự ý di chuyển, tháo lắp hoặc mang đồ nội thất ra khỏi vị trí ban đầu trong phòng.",
      "Không sử dụng, chế biến đồ ăn nặng mùi/bám mùi lâu trong phòng. Vui lòng thu gom rác vào thùng, dọn dẹp bếp và rửa chén đĩa sau khi sử dụng. Trong trường hợp nhiều chén đĩa/rác chưa được xử lí và trả về đúng vị trí ban đầu, Home xin phép phụ phí 100k phí dọn dẹp.",
    ],
  },
];

export const metadata: Metadata = {
  title: "Nội quy và quy định | LavieHome",
  description: "Các lưu ý checkin, checkout, điều khoản cấm và quy định giữ gìn vệ sinh tại LavieHome Cần Thơ.",
};

export default function RulesPage() {
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
            Chào mừng quý khách đến với không gian nghỉ dưỡng của LavieHome tại Cần Thơ! Để đảm bảo trải nghiệm an toàn,
            thoải mái và riêng tư nhất cho tất cả mọi người, kính mong quý khách vui lòng đọc kỹ và tuân thủ các quy định
            dưới đây trước khi nhận phòng nhé.
          </p>

          <div className="mt-8 space-y-6">
            {sections.map((section) => (
              <section key={section.title} className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 md:p-6">
                <h2 className="text-base font-extrabold text-white md:text-lg">{section.title}</h2>
                <ul className="mt-4 list-disc space-y-3 pl-5 text-sm font-semibold leading-7 text-white/70">
                  {section.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </article>
      </div>
      <BottomNav />
    </main>
  );
}
