import { notFound } from "next/navigation";
import { getBranchById } from "@/lib/homestay-dashboard";
import { EditBranchForm } from "./_components/edit-branch-form";

export default async function EditBranchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const branch = await getBranchById(Number(id));
  if (!branch) notFound();
  return <EditBranchForm branch={branch} />;
}
