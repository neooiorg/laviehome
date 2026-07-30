import { LavieHomeApp } from '@/components/lavie-home-app';
import { getPublicBranches, getPublicRooms } from '@/lib/homestay-dashboard';
import { getAllMenuItems } from '@/lib/menu-actions';
import { getComboPromoConfig } from '@/lib/settings-actions';

export default async function Home() {
  const [branches, rooms, menuItems, comboPromo] = await Promise.all([
    getPublicBranches(),
    getPublicRooms(),
    getAllMenuItems(),
    getComboPromoConfig(),
  ]);

  return <LavieHomeApp branches={branches} rooms={rooms} menuItems={menuItems} comboPromo={comboPromo} />;
}
