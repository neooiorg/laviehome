import type { Metadata } from "next";

import PageContainer from "@/components/layout/page-container";
import { getLuckyWheelAdminReport } from "@/lib/lucky-wheel-admin";

import { LuckyWheelHistoryTable } from "../_components/lucky-wheel-history-table";

export const metadata: Metadata = {
  title: "Lịch sử lượt quay - Vòng quay may mắn",
};

export const dynamic = "force-dynamic";

export default async function LuckyWheelHistoryPage() {
  const report = await getLuckyWheelAdminReport();

  return (
    <PageContainer
      pageTitle="Lịch sử lượt quay"
      pageDescription={`Đang lưu ${report.spins.length.toLocaleString("vi-VN")} lượt quay. Số điện thoại được che để bảo vệ thông tin khách hàng.`}
    >
      <LuckyWheelHistoryTable spins={report.spins} />
    </PageContainer>
  );
}
