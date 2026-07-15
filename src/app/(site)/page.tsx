import { LavieHomeApp } from '@/components/lavie-home-app';
import { getPublicBranches, getPublicRooms } from '@/lib/homestay-dashboard';
import { getAllMenuItems } from '@/lib/menu-actions';

export default async function Home() {
  const [branches, rooms, menuItems] = await Promise.all([getPublicBranches(), getPublicRooms(), getAllMenuItems()]);

  return <LavieHomeApp branches={branches} rooms={rooms} menuItems={menuItems} />;
}
