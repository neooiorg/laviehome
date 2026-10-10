import type { Metadata } from "next";

import PageContainer from "@/components/layout/page-container";
import { getLuckyWheelAdminReport } from "@/lib/lucky-wheel-admin";
import { getLuckyWheelConfig } from "@/lib/lucky-wheel-settings";

import { LuckyWheelAdmin } from "./_components/lucky-wheel-admin";

export const metadata: Metadata = {
  title: "Vòng quay may mắn - Admin Dashboard",
};

export const dynamic = "force-dynamic";

export default async function LuckyWheelPage() {
  const [config, report] = await Promise.all([
    getLuckyWheelConfig(),
    getLuckyWheelAdminReport(),
  ]);

  return (
    <PageContainer
      pageTitle="Vòng quay may mắn"
      pageDescription="Cấu hình phần thưởng và theo dõi voucher đã phát cho khách."
    >
      <LuckyWheelAdmin initialConfig={config} report={report} />
    </PageContainer>
  );
}
