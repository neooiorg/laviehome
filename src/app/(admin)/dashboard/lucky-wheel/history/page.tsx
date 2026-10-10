import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import PageContainer from "@/components/layout/page-container";
import { auth } from "@/lib/auth";
import { getLuckyWheelAdminReport } from "@/lib/lucky-wheel-admin";

import { LuckyWheelHistoryTable } from "../_components/lucky-wheel-history-table";

export const metadata: Metadata = {
  title: "Lịch sử lượt quay - Vòng quay may mắn",
};

export const dynamic = "force-dynamic";

export default async function LuckyWheelHistoryPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/auth/v2/login");
  if (session.user.role !== "admin") redirect("/unauthorized");

  const report = await getLuckyWheelAdminReport({ includeSpins: true });

  return (
    <PageContainer
      pageTitle="Lịch sử lượt quay"
      pageDescription={`Đang lưu ${report.totalSpins.toLocaleString("vi-VN")} lượt quay; hiển thị 500 lượt mới nhất.`}
    >
      <LuckyWheelHistoryTable spins={report.spins} />
    </PageContainer>
  );
}
