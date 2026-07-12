import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import PageContainer from "@/components/layout/page-container";
import { getAllRooms, getPublicBranches } from "@/lib/homestay-dashboard";
import { CreateBookingForm } from "./_components/create-booking-form";

export default async function CreateBookingPage() {
  const [rooms, branches] = await Promise.all([getAllRooms(), getPublicBranches()]);

  return (
    <PageContainer>
      <div className="mb-6 flex items-center gap-3">
        <Link href="/dashboard/bookings" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="size-4" />
          Danh sách đặt phòng
        </Link>
      </div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Tạo đặt phòng</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Điền thông tin để tạo booking mới.</p>
      </div>
      <CreateBookingForm rooms={rooms} branches={branches} />
    </PageContainer>
  );
}
