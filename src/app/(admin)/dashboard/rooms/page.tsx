import PageContainer from "@/components/layout/page-container";
import { getAllRooms, getPublicBranches } from "@/lib/homestay-dashboard";

import { RoomsClient } from "./_components/rooms-client";

export default async function Page() {
  const [rooms, branches] = await Promise.all([getAllRooms(), getPublicBranches()]);
  return (
    <PageContainer>
      <RoomsClient rooms={rooms} branches={branches} />
    </PageContainer>
  );
}
