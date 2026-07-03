import Link from "next/link";
import { Pencil } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getPublicBranches, getAllRooms } from "@/lib/homestay-dashboard";

import { CreateRoomDialog } from "./_components/create-room-dialog";

function money(value: number) {
  return new Intl.NumberFormat("vi-VN").format(value);
}

export default async function Page() {
  const [rooms, branches] = await Promise.all([getAllRooms(), getPublicBranches()]);

  return (
    <Card>
      <CardHeader className="border-b has-data-[slot=card-action]:grid-cols-1 md:has-data-[slot=card-action]:grid-cols-[1fr_auto]">
        <div>
          <CardTitle className="text-xl leading-none">Phòng</CardTitle>
          <CardDescription>Danh sách tất cả phòng ({rooms.length} phòng).</CardDescription>
        </div>
        <div data-slot="card-action" className="flex items-start justify-end">
          <CreateRoomDialog branches={branches} />
        </div>
      </CardHeader>
      <CardContent className="px-0">
        <Table className="**:data-[slot='table-cell']:px-4 **:data-[slot='table-head']:px-4">
          <TableHeader className="[&_tr]:border-t">
            <TableRow>
              <TableHead className="py-4 font-normal">Tên phòng</TableHead>
              <TableHead className="py-4 font-normal">Chi nhánh</TableHead>
              <TableHead className="py-4 font-normal">Giá</TableHead>
              <TableHead className="py-4 font-normal">Cả ngày</TableHead>
              <TableHead className="py-4 font-normal">Tiện ích</TableHead>
              <TableHead className="py-4 font-normal">Loại</TableHead>
              <TableHead className="py-4 font-normal" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rooms.map((room) => (
              <TableRow key={room.id}>
                <TableCell className="font-medium">{room.card_name}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{room.branch_name}</TableCell>
                <TableCell className="whitespace-nowrap text-sm">
                  {money(room.price_from)}đ – {money(room.price_to)}đ
                </TableCell>
                <TableCell className="whitespace-nowrap text-sm">{money(room.full_day_price)}đ</TableCell>
                <TableCell>
                  <Badge variant="secondary">{room.room_amenities.length} tiện ích</Badge>
                </TableCell>
                <TableCell>
                  {room.is_classic === 1 && <Badge variant="outline">Classic</Badge>}
                </TableCell>
                <TableCell className="text-right">
                  <Button asChild size="sm" variant="ghost">
                    <Link href={`/dashboard/rooms/${room.id}`}>
                      <Pencil className="mr-1.5 size-3.5" />
                      Sửa
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
