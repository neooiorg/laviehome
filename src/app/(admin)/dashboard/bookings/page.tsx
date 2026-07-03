import { getBookingSnapshots, getAllRooms, getPublicBranches } from "@/lib/homestay-dashboard";

import { Bookings } from "./_components/bookings";

export default async function Page() {
  const [bookings, branches, rooms] = await Promise.all([
    getBookingSnapshots(300),
    getPublicBranches(),
    getAllRooms(),
  ]);
  return <Bookings bookings={bookings} branches={branches} rooms={rooms} />;
}
