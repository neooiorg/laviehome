import { notFound } from "next/navigation";

import { getPublicBranches, getRoomById } from "@/lib/homestay-dashboard";

import { RoomEditForm } from "./_components/room-edit-form";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [room, branches] = await Promise.all([
    getRoomById(Number(id)),
    getPublicBranches(),
  ]);

  if (!room) notFound();

  return (
    <div className="p-6">
      <RoomEditForm room={room} branches={branches} />
    </div>
  );
}
