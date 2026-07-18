import KBar from '@/components/kbar';
import { AppSidebar } from './_components/sidebar/app-sidebar';
import Header from '@/components/layout/header';
import { InfoSidebar } from '@/components/layout/info-sidebar';
import { InfobarProvider } from '@/components/ui/infobar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { PREFERENCE_DEFAULTS } from '@/lib/preferences/preferences-config';
import { PreferencesStoreProvider } from '@/stores/preferences/preferences-provider';
import { fontManrope } from '@/components/themes/font.config';
import { cn } from '@/lib/utils';
import { auth } from '@/lib/auth';
import type { Metadata } from 'next';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Lavie Home Dashboard',
  description: 'Quản lý đặt phòng, chi nhánh, phòng và khách hàng Lavie Home.',
  robots: {
    index: false,
    follow: false
  }
};

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect('/auth/v2/login');
  }

  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get('sidebar_state')?.value === 'true';
  return (
    <div className={cn(fontManrope.variable, '[font-family:var(--font-manrope)]')}>
      <PreferencesStoreProvider initialValues={PREFERENCE_DEFAULTS}>
        <KBar>
          <SidebarProvider defaultOpen={defaultOpen}>
            <AppSidebar />
            <SidebarInset>
              <Header />
              <InfobarProvider defaultOpen={false}>
                {children}
                <InfoSidebar side='right' />
              </InfobarProvider>
            </SidebarInset>
          </SidebarProvider>
        </KBar>
      </PreferencesStoreProvider>
    </div>
  );
}
