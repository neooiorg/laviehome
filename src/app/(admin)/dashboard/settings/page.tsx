import PageContainer from "@/components/layout/page-container";
import {
  getBookingHoldMinutes,
  getComboPromoConfig,
  getMaintenanceMode,
  getOnlinePaymentEnabled,
} from "@/lib/settings-actions";

import { PaymentSettings } from "./_components/payment-settings";
import { MaintenanceSettings } from "./_components/maintenance-settings";
import { ComboPromoSettings } from "./_components/combo-promo-settings";
import { BookingHoldSettings } from "./_components/booking-hold-settings";

export const metadata = {
  title: "Cài đặt - Admin Dashboard",
};

export default async function SettingsPage() {
  const [onlinePaymentEnabled, maintenanceMode, comboPromoConfig, bookingHoldMinutes] = await Promise.all([
    getOnlinePaymentEnabled(),
    getMaintenanceMode(),
    getComboPromoConfig(),
    getBookingHoldMinutes(),
  ]);

  return (
    <PageContainer>
      <div className="mb-4">
        <h1 className="text-2xl font-bold tracking-tight">Cài đặt</h1>
        <p className="mt-1 text-sm text-muted-foreground">Cấu hình hệ thống Lavie Home.</p>
      </div>
      <div className="grid max-w-2xl gap-4">
        <PaymentSettings initialEnabled={onlinePaymentEnabled} />
        <BookingHoldSettings initialMinutes={bookingHoldMinutes} />
        <ComboPromoSettings initialConfig={comboPromoConfig} />
        <MaintenanceSettings initialEnabled={maintenanceMode} />
      </div>
    </PageContainer>
  );
}
