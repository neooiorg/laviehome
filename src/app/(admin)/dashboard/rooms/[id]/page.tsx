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
    <div className="mx-auto max-w-2xl">
      <RoomEditForm room={room} branches={branches} />
    </div>
  );
}
