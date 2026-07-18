import type { ReactNode } from "react";
import Image from "next/image";

import { BedDouble, ShieldCheck } from "lucide-react";

import { Separator } from "@/components/ui/separator";
import { APP_CONFIG } from "@/config/app-config";

export default function Layout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <main>
      <div className="grid h-dvh justify-center p-2 lg:grid-cols-2">
        <div className="relative order-2 hidden h-full rounded-3xl bg-primary lg:flex">
          <div className="absolute top-10 space-y-3 px-10 text-primary-foreground">
            <div className="inline-flex items-center justify-center rounded-2xl bg-white/95 p-2.5 shadow-sm">
              <Image
                src="/lavie-home-logo.png"
                alt="Lavie Home"
                width={140}
                height={44}
                className="h-9 w-auto"
                priority
              />
            </div>
            <h1 className="font-semibold text-2xl">{APP_CONFIG.name}</h1>
            <p className="max-w-sm text-sm text-primary-foreground/80">
              Hệ thống quản trị đặt phòng homestay Lavie Home — quản lý đặt phòng, phòng,
              chi nhánh, khuyến mãi và khách hàng ở cùng một nơi.
            </p>
          </div>

          <div className="absolute bottom-10 flex w-full justify-between px-10">
            <div className="flex-1 space-y-1 text-primary-foreground">
              <BedDouble className="mb-1 size-5" />
              <h2 className="font-medium">Quản lý tập trung</h2>
              <p className="text-sm text-primary-foreground/80">
                Theo dõi đặt phòng theo thời gian thực, cập nhật phòng và chi nhánh chỉ trong vài thao tác.
              </p>
            </div>
            <Separator orientation="vertical" className="mx-3 h-auto!" />
            <div className="flex-1 space-y-1 text-primary-foreground">
              <ShieldCheck className="mb-1 size-5" />
              <h2 className="font-medium">Truy cập an toàn</h2>
              <p className="text-sm text-primary-foreground/80">
                Chỉ tài khoản được cấp phép mới đăng nhập, xác thực bằng mã OTP gửi qua email.
              </p>
            </div>
          </div>
        </div>
        <div className="relative order-1 flex h-full">{children}</div>
      </div>
    </main>
  );
}
