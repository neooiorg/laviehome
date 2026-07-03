import { defineRouteConfig } from "@medusajs/admin-sdk";
import { CalendarMini } from "@medusajs/icons";
import { Badge, Container, Heading, Table, Text } from "@medusajs/ui";
import { useEffect, useState } from "react";

type Booking = {
  id: string;
  room_name: string;
  branch_name: string;
  customer_name: string;
  customer_phone: string;
  date_label: string;
  time_range: string;
  amount: number;
  status: string;
  guest_count: number;
  has_car: boolean;
  has_decoration: boolean;
  discount_code: string | null;
  notes: string | null;
  cccd_front: string | null;
  cccd_back: string | null;
  created_at: string;
};

export const config = defineRouteConfig({
  label: "Đặt Phòng",
  icon: CalendarMini,
});

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  function load() {
    setLoading(true);
    setError("");
    fetch("/admin/bookings")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setBookings(d.bookings ?? []);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <Container>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Heading level="h1">Quản lý Đặt Phòng</Heading>
          <Text size="small" className="text-ui-fg-subtle mt-1">
            Danh sách tất cả đặt phòng từ website
          </Text>
        </div>
        <button
          onClick={load}
          className="txt-compact-small-plus text-ui-fg-subtle hover:text-ui-fg-base transition-colors"
        >
          Làm mới
        </button>
      </div>

      {error && (
        <div className="rounded-lg bg-ui-bg-base border border-ui-border-error px-4 py-3 mb-4">
          <Text size="small" className="text-ui-fg-error">{error}</Text>
        </div>
      )}

      {loading ? (
        <Text size="small" className="text-ui-fg-subtle">Đang tải...</Text>
      ) : bookings.length === 0 ? (
        <div className="flex items-center justify-center py-16">
          <Text size="small" className="text-ui-fg-subtle">Chưa có booking nào.</Text>
        </div>
      ) : (
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Phòng / Chi nhánh</Table.HeaderCell>
              <Table.HeaderCell>Khách hàng</Table.HeaderCell>
              <Table.HeaderCell>Ngày · Khung giờ</Table.HeaderCell>
              <Table.HeaderCell>Số tiền</Table.HeaderCell>
              <Table.HeaderCell>Trạng thái</Table.HeaderCell>
              <Table.HeaderCell>Ngày tạo</Table.HeaderCell>
              <Table.HeaderCell></Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {bookings.map((b) => (
              <>
                <Table.Row
                  key={b.id}
                  className="cursor-pointer"
                  onClick={() => setExpanded(expanded === b.id ? null : b.id)}
                >
                  <Table.Cell>
                    <div className="flex flex-col">
                      <Text size="small" weight="plus">{b.room_name}</Text>
                      <Text size="xsmall" className="text-ui-fg-subtle">{b.branch_name}</Text>
                    </div>
                  </Table.Cell>
                  <Table.Cell>
                    <div className="flex flex-col">
                      <Text size="small">{b.customer_name || "—"}</Text>
                      <Text size="xsmall" className="text-ui-fg-subtle">{b.customer_phone || "—"}</Text>
                    </div>
                  </Table.Cell>
                  <Table.Cell>
                    <div className="flex flex-col">
                      <Text size="small">{b.date_label}</Text>
                      <Text size="xsmall" className="text-ui-fg-subtle">{b.time_range}</Text>
                    </div>
                  </Table.Cell>
                  <Table.Cell>
                    <Text size="small" weight="plus">
                      {b.amount?.toLocaleString("vi-VN")}đ
                    </Text>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge
                      size="2xsmall"
                      color={b.status === "Chờ thanh toán" ? "orange" : "green"}
                    >
                      {b.status}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>
                    <Text size="xsmall" className="text-ui-fg-subtle">
                      {new Date(b.created_at).toLocaleString("vi-VN")}
                    </Text>
                  </Table.Cell>
                  <Table.Cell>
                    <Text size="xsmall" className="text-ui-fg-subtle">
                      {expanded === b.id ? "▲" : "▼"}
                    </Text>
                  </Table.Cell>
                </Table.Row>

                {expanded === b.id && (
                  <Table.Row key={`${b.id}-detail`}>
                    <Table.Cell colSpan={7}>
                      <div className="py-3 px-1 flex flex-col gap-3">
                        <div className="flex flex-wrap gap-x-8 gap-y-1">
                          <Text size="small">
                            <span className="text-ui-fg-subtle">Số người: </span>
                            {b.guest_count}
                            {b.has_car && " · 🚗"}
                            {b.has_decoration && " · 🎉"}
                          </Text>
                          {b.discount_code && (
                            <Text size="small">
                              <span className="text-ui-fg-subtle">Mã giảm: </span>
                              <span className="text-ui-fg-interactive">{b.discount_code}</span>
                            </Text>
                          )}
                          {b.notes && (
                            <Text size="small">
                              <span className="text-ui-fg-subtle">Ghi chú: </span>
                              {b.notes}
                            </Text>
                          )}
                          <Text size="xsmall" className="text-ui-fg-muted font-mono">
                            ID: {b.id}
                          </Text>
                        </div>

                        {(b.cccd_front || b.cccd_back) && (
                          <div className="flex gap-4">
                            {b.cccd_front && (
                              <div className="flex flex-col gap-1">
                                <Text size="xsmall" className="text-ui-fg-subtle uppercase tracking-wider">Mặt trước</Text>
                                <a href={b.cccd_front} target="_blank" rel="noopener noreferrer">
                                  <img
                                    src={b.cccd_front}
                                    alt="CCCD mặt trước"
                                    className="h-28 rounded-lg border border-ui-border-base object-cover hover:opacity-80 transition-opacity cursor-pointer"
                                  />
                                </a>
                              </div>
                            )}
                            {b.cccd_back && (
                              <div className="flex flex-col gap-1">
                                <Text size="xsmall" className="text-ui-fg-subtle uppercase tracking-wider">Mặt sau</Text>
                                <a href={b.cccd_back} target="_blank" rel="noopener noreferrer">
                                  <img
                                    src={b.cccd_back}
                                    alt="CCCD mặt sau"
                                    className="h-28 rounded-lg border border-ui-border-base object-cover hover:opacity-80 transition-opacity cursor-pointer"
                                  />
                                </a>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </Table.Cell>
                  </Table.Row>
                )}
              </>
            ))}
          </Table.Body>
        </Table>
      )}
    </Container>
  );
}
