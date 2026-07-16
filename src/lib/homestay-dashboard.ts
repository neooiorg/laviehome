import 'server-only';

import { type NormalizedBookingRecord, fetchRawBookings, normalizeBookingRecord } from '@/lib/booking-records';
import { normalizeDateLabelToIso } from '@/lib/booking-slots';
import { money } from '@/lib/format';
import { query } from '@/lib/postgres';

export type DashboardMetric = {
  label: string;
  value: string;
  note: string;
};

export type BookingStatus = 'Chờ thanh toán' | 'Đã thanh toán' | 'Đã xác nhận' | 'Chờ cọc' | 'Đang ở' | 'Hoàn tất';

export type BookingSnapshot = {
  id: string;
  guestName: string;
  customerName: string | null;
  customerPhone: string | null;
  room: RoomSummary['room'];
  branch: BranchSummary['branch'];
  stayDate: string;
  dateLabel: string;
  timeRange: string;
  channel: string;
  status: BookingStatus;
  amount: number;
  menuItemsTotal: number;
  guestCount: number | null;
  hasCar: boolean;
  hasDecoration: boolean;
  discountCode: string | null;
  notes: string | null;
  cccdFront: string | null;
  cccdBack: string | null;
  createdAt: string;
};

export type BranchSummary = {
  branch: BranchRow;
  city: string;
  address: string;
  roomCount: number;
  averageFrom: number;
  topRoom: RoomRow | null;
  status: 'Đang mở' | 'Tạm ngưng';
  classic: boolean;
};

export type RoomSummary = {
  room: RoomRow;
  branch: BranchRow;
  amenityCount: number;
  priceBand: string;
  highlight: string;
  isFeatured: boolean;
};

export type TrendPoint = {
  month: string;
  bookings: number;
  premium: number;
  occupancy: number;
};

export type AlertItem = {
  title: string;
  detail: string;
  tone: 'info' | 'warning' | 'critical';
};

export type GuestSummary = {
  guestName: string;
  bookings: number;
  branches: string[];
  latestStay: string;
  totalSpent: number;
};

export type BookingStatusPoint = {
  status: BookingStatus;
  count: number;
  share: number;
};

export type PriceBandPoint = {
  label: string;
  count: number;
  share: number;
};

export type BranchRow = {
  id: number;
  name: string;
  active: number;
  hotline: string;
  google_maps_link: string;
  classic_booking_enabled: number;
};

export type RoomRow = {
  id: number;
  branch_id: number;
  card_name: string;
  branch_name: string;
  room_amenities: string[];
  price_from: number;
  price_to: number;
  full_day_price: number;
  main_image: string;
  is_classic: number;
  images: string[];
  // Per-time-slot prices indexed by slot position; null/absent → use defaults.
  slot_prices?: (number | null)[] | null;
  created_at?: string;
};

export type DiscountCode = {
  code: string;
  percent: number;
  description: string;
  active: boolean;
  max_uses: number;
  used_count: number;
  expires_at: string | null;
  created_at: string;
};

function splitBranchName(name: string) {
  const [city, ...rest] = name.split(' - ');

  return {
    city,
    address: rest.join(' - ') || name
  };
}

function getPriceBand(priceFrom: number) {
  if (priceFrom < 200000) return 'Dưới 200k';
  if (priceFrom < 250000) return '200k - 249k';
  if (priceFrom < 300000) return '250k - 299k';
  return 'Từ 300k';
}

function formatMonth(monthKey: string) {
  return new Date(`${monthKey}-01T00:00:00.000Z`).toLocaleDateString('vi-VN', {
    month: '2-digit',
    year: '2-digit'
  });
}

function getBookingDisplayTotal(input: {
  amount: number | string | null | undefined;
  menuItemsTotal?: number | string | null | undefined;
}) {
  return Number(input.amount ?? 0) + Number(input.menuItemsTotal ?? 0);
}

export async function getBranches(): Promise<BranchRow[]> {
  return query<BranchRow>('select * from branches order by id');
}

async function getActiveCatalogRooms(): Promise<RoomRow[]> {
  return query<RoomRow>('select * from rooms where is_classic = 0 order by id desc');
}

export async function getPublicBranches() {
  return getBranches();
}

export async function getPublicRooms() {
  return getActiveCatalogRooms();
}

function makeFallbackRoom(booking: NormalizedBookingRecord): RoomRow {
  return {
    id: booking.roomId ?? 0,
    branch_id: booking.branchId ?? 0,
    card_name: booking.roomName || 'Chưa rõ phòng',
    branch_name: booking.branchName || 'Chưa rõ chi nhánh',
    room_amenities: booking.room?.room_amenities ?? [],
    price_from: booking.room?.price_from ?? booking.raw.amount,
    price_to: booking.room?.price_to ?? booking.raw.amount,
    full_day_price: booking.room?.full_day_price ?? booking.raw.amount,
    main_image: booking.room?.main_image ?? '',
    is_classic: booking.room?.is_classic ?? 0,
    images: booking.room?.images ?? []
  };
}

function makeFallbackBranch(booking: NormalizedBookingRecord): BranchRow {
  return {
    id: booking.branchId ?? 0,
    name: booking.branchName || 'Chưa rõ chi nhánh',
    active: booking.branch?.active ?? 0,
    hotline: booking.branch?.hotline ?? '',
    google_maps_link: booking.branch?.google_maps_link ?? '',
    classic_booking_enabled: booking.branch?.classic_booking_enabled ?? 0
  };
}

function toBookingSnapshot(booking: NormalizedBookingRecord): BookingSnapshot {
  const stayDate = booking.stayDate ?? '';

  return {
    id: booking.raw.id,
    guestName: booking.guestName,
    room: booking.room ? ({ ...booking.room } as RoomRow) : makeFallbackRoom(booking),
    branch: booking.branch ? ({ ...booking.branch, name: booking.branch.name } as BranchRow) : makeFallbackBranch(booking),
    stayDate,
    dateLabel: booking.dateLabel ?? stayDate,
    timeRange: booking.raw.time_range ?? '',
    channel: booking.channel,
    status: booking.raw.status as BookingStatus,
    amount: Number(booking.raw.amount) || 0,
    menuItemsTotal: Number(booking.raw.menu_items_total) || 0,
    customerName: booking.raw.customer_name,
    customerPhone: booking.raw.customer_phone,
    guestCount: booking.raw.guest_count,
    hasCar: booking.raw.has_car ?? false,
    hasDecoration: booking.raw.has_decoration ?? false,
    discountCode: booking.raw.discount_code,
    notes: booking.raw.notes,
    cccdFront: booking.raw.cccd_front,
    cccdBack: booking.raw.cccd_back,
    createdAt: booking.raw.created_at
  };
}

async function getBookings(limit = 12) {
  const [branches, rooms, rawBookings] = await Promise.all([getBranches(), getAllRooms(), fetchRawBookings({ limit })]);

  return rawBookings.map((booking) => normalizeBookingRecord(booking, rooms, branches));
}

export async function getDashboardMetrics(): Promise<DashboardMetric[]> {
  const [branches, catalogRooms] = await Promise.all([getBranches(), getActiveCatalogRooms()]);
  const averagePriceFrom = Math.round(
    catalogRooms.reduce((sum, room) => sum + room.price_from, 0) / Math.max(catalogRooms.length, 1)
  );
  const premiumRooms = catalogRooms.filter((room) => room.price_from >= 250000).length;
  const contentCompleteRooms = catalogRooms.filter((room) => room.images.length > 1).length;

  return [
    {
      label: 'Chi nhánh đang mở',
      value: String(branches.filter((branch) => branch.active === 1).length),
      note: `${branches.length} cơ sở trong hệ thống`
    },
    {
      label: 'Phòng đang bán',
      value: String(catalogRooms.length),
      note: `Tổng ${catalogRooms.length} phòng đang active`
    },
    {
      label: 'Giá khởi điểm TB',
      value: `${money(averagePriceFrom)}đ`,
      note: 'Dựa trên các phòng đang active'
    },
    {
      label: 'Phòng đủ nội dung',
      value: String(contentCompleteRooms),
      note: `${premiumRooms} phòng premium từ 250k`
    }
  ];
}

export async function getBranchSummaries(limit = 6): Promise<BranchSummary[]> {
  const [branches, rooms] = await Promise.all([getBranches(), getActiveCatalogRooms()]);

  return branches
    .map((branch) => {
      const branchRooms = rooms.filter((room) => room.branch_id === branch.id);
      const { city, address } = splitBranchName(branch.name);
      const averageFrom = branchRooms.length
        ? Math.round(branchRooms.reduce((sum, room) => sum + room.price_from, 0) / branchRooms.length)
        : 0;

      return {
        branch,
        city,
        address,
        roomCount: branchRooms.length,
        averageFrom,
        topRoom: branchRooms[0] ?? null,
        status: branch.active === 1 ? ('Đang mở' as const) : ('Tạm ngưng' as const),
        classic: branch.classic_booking_enabled === 1
      };
    })
    .sort((a, b) => b.roomCount - a.roomCount || b.averageFrom - a.averageFrom)
    .slice(0, limit);
}

export async function getRoomSummaries(limit = 8): Promise<RoomSummary[]> {
  const [branches, rooms] = await Promise.all([getBranches(), getActiveCatalogRooms()]);

  return rooms.slice(0, limit).map((room) => {
    const branch = branches.find((item) => item.id === room.branch_id) ?? branches[0];

    if (!branch) {
      throw new Error('No branches available');
    }

    const amenityCount = room.room_amenities.length;

    return {
      room,
      branch,
      amenityCount,
      priceBand: getPriceBand(room.price_from),
      highlight: room.room_amenities[0] ?? 'Chưa gắn tiện ích',
      isFeatured: room.price_from >= 250000 || amenityCount >= 8
    };
  });
}

export async function getBookingById(id: string): Promise<BookingSnapshot | null> {
  const [branches, rooms, rawBookings] = await Promise.all([
    getBranches(),
    getAllRooms(),
    fetchRawBookings({ id, limit: 1 })
  ]);
  const booking = rawBookings[0];
  if (!booking) return null;

  return toBookingSnapshot(normalizeBookingRecord(booking, rooms, branches));
}

export async function getBookingSnapshots(limit = 12): Promise<BookingSnapshot[]> {
  const bookings = await getBookings(limit);
  return bookings.map(toBookingSnapshot);
}

export async function getBookingStatusSummary(limit = 12): Promise<BookingStatusPoint[]> {
  const snapshots = await getBookingSnapshots(limit);
  const bookingStatuses: BookingStatus[] = ['Đã xác nhận', 'Chờ cọc', 'Đang ở', 'Hoàn tất'];

  return bookingStatuses.map((status) => {
    const count = snapshots.filter((snapshot) => snapshot.status === status).length;

    return {
      status,
      count,
      share: snapshots.length ? Math.round((count / snapshots.length) * 100) : 0
    };
  });
}

export async function getPriceBands(): Promise<PriceBandPoint[]> {
  const catalogRooms = await getActiveCatalogRooms();
  const bands = [
    {
      label: 'Dưới 200k',
      count: catalogRooms.filter((room) => room.price_from < 200000).length
    },
    {
      label: '200k - 249k',
      count: catalogRooms.filter((room) => room.price_from >= 200000 && room.price_from < 250000).length
    },
    {
      label: '250k - 299k',
      count: catalogRooms.filter((room) => room.price_from >= 250000 && room.price_from < 300000).length
    },
    {
      label: 'Từ 300k',
      count: catalogRooms.filter((room) => room.price_from >= 300000).length
    }
  ];

  return bands.map((band) => ({
    ...band,
    share: catalogRooms.length ? Math.round((band.count / catalogRooms.length) * 100) : 0
  }));
}

export async function getAmenityLeaderboard(limit = 6) {
  const catalogRooms = await getActiveCatalogRooms();
  const tally = new Map<string, number>();

  for (const room of catalogRooms) {
    for (const amenity of room.room_amenities) {
      const key = amenity.trim();
      tally.set(key, (tally.get(key) ?? 0) + 1);
    }
  }

  return [...tally.entries()]
    .map(([label, count]) => ({
      label,
      count,
      share: catalogRooms.length ? Math.round((count / catalogRooms.length) * 100) : 0
    }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, 'vi'))
    .slice(0, limit);
}

export async function getTrendPoints(): Promise<TrendPoint[]> {
  const bookings = await getBookings(500);
  const byMonth = new Map<string, number>();
  const premiumByMonth = new Map<string, number>();

  for (const booking of bookings) {
    if (!booking.stayDate) continue;
    const monthKey = booking.stayDate.slice(0, 7);
    byMonth.set(monthKey, (byMonth.get(monthKey) ?? 0) + 1);
    if ((booking.room?.price_from ?? booking.raw.amount) >= 250000) {
      premiumByMonth.set(monthKey, (premiumByMonth.get(monthKey) ?? 0) + 1);
    }
  }

  const months = [...new Set([...byMonth.keys(), ...premiumByMonth.keys()])]
    .sort((a, b) => a.localeCompare(b))
    .slice(-6);

  return months.map((monthKey) => {
    const bookingsCount = byMonth.get(monthKey) ?? 0;
    const premiumCount = premiumByMonth.get(monthKey) ?? 0;

    return {
      month: formatMonth(monthKey),
      bookings: bookingsCount,
      premium: premiumCount,
      occupancy: Math.min(100, Math.round(50 + bookingsCount * 4 + premiumCount * 2))
    };
  });
}

export async function getOperationalAlerts(limit = 6): Promise<AlertItem[]> {
  const [branches, rooms] = await Promise.all([getBranches(), getActiveCatalogRooms()]);
  const alerts: AlertItem[] = [];
  const placeholderRooms = rooms.filter((room) => room.main_image.includes('placehold.co'));
  const emptyAmenityRooms = rooms.filter((room) => room.room_amenities.length === 0);
  const inactiveBranches = branches.filter((branch) => branch.active === 0);
  const classicOffBranches = branches.filter((branch) => branch.classic_booking_enabled === 0 && branch.active === 1);

  if (placeholderRooms.length > 0) {
    alerts.push({
      title: 'Ảnh phòng còn placeholder',
      detail: `${placeholderRooms.length} phòng vẫn đang dùng ảnh mẫu, nên thay trước khi đẩy lên site.`,
      tone: 'warning'
    });
  }

  if (emptyAmenityRooms.length > 0) {
    alerts.push({
      title: 'Phòng thiếu tiện ích',
      detail: `${emptyAmenityRooms.length} phòng chưa gắn tiện ích, dễ làm nội dung bị mỏng.`,
      tone: 'critical'
    });
  }

  if (inactiveBranches.length > 0) {
    alerts.push({
      title: 'Chi nhánh tạm ngưng',
      detail: `${inactiveBranches.length} cơ sở đang tắt trạng thái hoạt động.`,
      tone: 'info'
    });
  }

  if (classicOffBranches.length > 0) {
    alerts.push({
      title: 'Chưa bật booking classic',
      detail: `${classicOffBranches.length} chi nhánh đang chờ kích hoạt booking theo giờ.`,
      tone: 'warning'
    });
  }

  const premiumRooms = rooms.filter((room) => room.price_from >= 250000).length;
  alerts.push({
    title: 'Ưu tiên phòng premium',
    detail: `${premiumRooms} phòng có giá từ 250k trở lên, nên đưa lên vị trí nổi bật.`,
    tone: 'info'
  });

  return alerts.slice(0, limit);
}

export async function getRevenueSummary(limit = 12) {
  const bookings = await getBookingSnapshots(limit);
  const totals = bookings.map((booking) =>
    getBookingDisplayTotal({ amount: booking.amount, menuItemsTotal: booking.menuItemsTotal })
  );
  const total = totals.reduce((sum, amount) => sum + amount, 0);
  const average = totals.length ? Math.round(total / totals.length) : 0;
  const highest = totals.reduce((max, amount) => Math.max(max, amount), 0);
  const lowest = totals.reduce((min, amount) => Math.min(min, amount), totals[0] ?? 0);

  return {
    total,
    average,
    highest,
    lowest,
    bookings
  };
}

export async function getGuestSummaries(limit = 8): Promise<GuestSummary[]> {
  const bookings = await getBookings(50);
  const guests = new Map<string, GuestSummary>();

  for (const booking of bookings) {
    const guestName = booking.guestName || 'Khách lẻ';
    const current = guests.get(guestName);
    const nextTotal =
      (current?.totalSpent ?? 0) +
      getBookingDisplayTotal({
        amount: booking.raw.amount,
        menuItemsTotal: booking.raw.menu_items_total,
      });
    const nextBookings = (current?.bookings ?? 0) + 1;
    const nextBranches = new Set([...(current?.branches ?? []), booking.branchName]);

    guests.set(guestName, {
      guestName,
      bookings: nextBookings,
      branches: [...nextBranches],
      latestStay: booking.dateLabel ?? booking.stayDate ?? '',
      totalSpent: nextTotal
    });
  }

  return [...guests.values()]
    .sort((a, b) => b.totalSpent - a.totalSpent || b.bookings - a.bookings || a.guestName.localeCompare(b.guestName, 'vi'))
    .slice(0, limit);
}

export function moneyRange(room: RoomSummary['room']) {
  return `${money(room.price_from)}đ - ${money(room.price_to)}đ`;
}

export async function getPublicRoomById(id: number): Promise<RoomRow | null> {
  const results = await query<RoomRow>('select * from rooms where id = $1', [id]);
  return results[0] ?? null;
}

export async function getRoomById(id: number): Promise<RoomRow | null> {
  const results = await query<RoomRow>('select * from rooms where id = $1', [id]);
  return results[0] ?? null;
}

export async function getAllRooms(): Promise<RoomRow[]> {
  return query<RoomRow>('select * from rooms order by id desc');
}

export async function getBranchById(id: number): Promise<BranchRow | null> {
  const results = await query<BranchRow>('select * from branches where id = $1', [id]);
  return results[0] ?? null;
}

export async function getDiscountByCode(code: string): Promise<DiscountCode | null> {
  const results = await query<DiscountCode>(
    `select code, percent, description, active, max_uses, used_count,
            expires_at::text as expires_at, created_at::text as created_at
     from discount_codes where code = $1`,
    [code]
  );
  return results[0] ?? null;
}

export async function getDiscountCodes(): Promise<DiscountCode[]> {
  // Cast timestamps to text so they arrive as ISO strings (not JS Date objects),
  // matching the DiscountCode type. The edit sheet calls expires_at.slice(...),
  // which would throw if pg returned a Date.
  return query<DiscountCode>(
    `select code, percent, description, active, max_uses, used_count,
            expires_at::text as expires_at, created_at::text as created_at
     from discount_codes order by created_at desc`
  );
}

export async function getBookingSnapshotsFiltered(options?: {
  limit?: number;
  branchId?: number;
  dateFrom?: string;
  dateTo?: string;
  status?: BookingStatus;
}): Promise<BookingSnapshot[]> {
  const { limit = 100, branchId, dateFrom, dateTo, status } = options ?? {};
  const normalizedDateFrom = normalizeDateLabelToIso(dateFrom);
  const normalizedDateTo = normalizeDateLabelToIso(dateTo);
  const bookings = await getBookings(Math.max(limit * 3, 300));

  return bookings
    .filter((booking) => !branchId || booking.branchId === branchId)
    .filter((booking) => !status || booking.raw.status === status)
    .filter((booking) => !normalizedDateFrom || (!!booking.stayDate && booking.stayDate >= normalizedDateFrom))
    .filter((booking) => !normalizedDateTo || (!!booking.stayDate && booking.stayDate <= normalizedDateTo))
    .slice(0, limit)
    .map(toBookingSnapshot);
}
