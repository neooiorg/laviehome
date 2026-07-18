import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import PageContainer from "@/components/layout/page-container";
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
    <PageContainer
      pageTitle={`Chỉnh sửa phòng #${room.id}`}
      pageDescription={room.card_name}
    >
      <div className="mb-4">
        <Link
          href="/dashboard/rooms"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Danh sách phòng
        </Link>
      </div>
      <RoomEditForm room={room} branches={branches} />
    </PageContainer>
  );
}
