import { notFound } from "next/navigation";
import { getDiscountByCode } from "@/lib/homestay-dashboard";
import { EditDiscountForm } from "./_components/edit-discount-form";

export default async function EditDiscountPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: code } = await params;
  const discount = await getDiscountByCode(code);
  if (!discount) notFound();
  return <EditDiscountForm discount={discount} />;
}
