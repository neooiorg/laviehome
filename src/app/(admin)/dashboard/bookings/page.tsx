import { getBookingSnapshots } from "@/lib/homestay-dashboard";

import { Bookings } from "./_components/bookings";

export default async function Page() {
  const bookings = await getBookingSnapshots(100);
  return <Bookings bookings={bookings} />;
}
