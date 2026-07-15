import PageContainer from "@/components/layout/page-container";
import { getBookingSnapshots, getPublicBranches } from "@/lib/homestay-dashboard";

import { Bookings } from "./_components/bookings";

export default async function Page() {
  const [bookings, branches] = await Promise.all([
    getBookingSnapshots(300),
    getPublicBranches(),
  ]);
  return (
    <PageContainer>
      <Bookings bookings={bookings} branches={branches} />
    </PageContainer>
  );
}
