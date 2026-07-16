import PageContainer from '@/components/layout/page-container';
import { getAllMenuItems } from '@/lib/menu-actions';
import { getBranches } from '@/lib/homestay-dashboard';
import { MenuItemsTable } from './_components/menu-items-table';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Menu Items - Admin Dashboard',
  description: 'Quản lý menu items cho đặt phòng',
};

export default async function MenuItemsPage() {
  const [menuItems, branches] = await Promise.all([getAllMenuItems(), getBranches()]);

  return (
    <PageContainer>
      <MenuItemsTable items={menuItems} branches={branches} />
    </PageContainer>
  );
}
