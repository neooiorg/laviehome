import { LavieHomeApp } from '@/components/lavie-home-app';
import { getPublicBranches, getPublicRooms } from '@/lib/homestay-dashboard';

export default async function Home() {
  const [branches, rooms] = await Promise.all([getPublicBranches(), getPublicRooms()]);

  return <LavieHomeApp branches={branches} rooms={rooms} />;
}
