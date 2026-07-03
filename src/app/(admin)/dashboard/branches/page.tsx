import Link from "next/link";
import { Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getPublicBranches } from "@/lib/homestay-dashboard";

import { BranchRow } from "./_components/branch-row";
import { CreateBranchDialog } from "./_components/create-branch-dialog";

export default async function Page() {
  const branches = await getPublicBranches();

  return (
    <Card>
      <CardHeader className="border-b has-data-[slot=card-action]:grid-cols-1 md:has-data-[slot=card-action]:grid-cols-[1fr_auto]">
        <div>
          <CardTitle className="text-xl leading-none">Chi nhánh</CardTitle>
          <CardDescription>Quản lý trạng thái hoạt động và booking classic từng chi nhánh.</CardDescription>
        </div>
        <div data-slot="card-action" className="flex items-start justify-end">
          <CreateBranchDialog />
        </div>
      </CardHeader>
      <CardContent className="px-0">
        <Table className="**:data-[slot='table-cell']:px-4 **:data-[slot='table-head']:px-4">
          <TableHeader className="[&_tr]:border-t">
            <TableRow>
              <TableHead className="py-4 font-normal">Tên</TableHead>
              <TableHead className="py-4 font-normal">Hotline</TableHead>
              <TableHead className="py-4 font-normal">Bản đồ</TableHead>
              <TableHead className="py-4 font-normal">Đang mở</TableHead>
              <TableHead className="py-4 font-normal">Booking classic</TableHead>
              <TableHead className="py-4 font-normal" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {branches.map((branch) => (
              <BranchRow key={branch.id} branch={branch}>
                <Button asChild size="sm" variant="ghost">
                  <Link href={`/dashboard/branches/${branch.id}`}>
                    <Pencil className="mr-1 size-3.5" />
                    Sửa
                  </Link>
                </Button>
              </BranchRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
