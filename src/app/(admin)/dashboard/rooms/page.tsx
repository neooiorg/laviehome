import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getPublicRooms } from "@/lib/homestay-dashboard";

function money(value: number) {
  return new Intl.NumberFormat("vi-VN").format(value);
}

export default async function Page() {
  const rooms = await getPublicRooms();

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle className="text-xl leading-none">Phòng</CardTitle>
        <CardDescription>Danh sách phòng đang bán ({rooms.length} phòng).</CardDescription>
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
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
