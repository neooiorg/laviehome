import { notFound } from "next/navigation";

import { getBranchById } from "@/lib/homestay-dashboard";

import { BranchEditForm } from "./_components/branch-edit-form";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const branch = await getBranchById(Number(id));

  if (!branch) notFound();

  return (
    <div className="mx-auto max-w-lg">
      <BranchEditForm branch={branch} />
    </div>
  );
}
