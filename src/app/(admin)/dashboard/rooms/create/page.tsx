import { getPublicBranches } from "@/lib/homestay-dashboard";
import { CreateRoomForm } from "./_components/create-room-form";

export default async function CreateRoomPage() {
  const branches = await getPublicBranches();
  return <CreateRoomForm branches={branches} />;
}
