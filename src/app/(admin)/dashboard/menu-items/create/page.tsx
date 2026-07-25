import PageContainer from '@/components/layout/page-container';
import { getBranches } from '@/lib/homestay-dashboard';
import { MenuItemForm } from '../_components/menu-item-form';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Thêm Menu Item - Admin Dashboard',
};

export default async function CreateMenuItemPage() {
  const branches = await getBranches();

  return (
    <PageContainer>
      <MenuItemForm branches={branches} />
    </PageContainer>
  );
}
