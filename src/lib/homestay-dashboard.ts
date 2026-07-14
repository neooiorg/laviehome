import 'server-only';

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

type BookingRow = {
  id: string;
  room_id: number;
  branch_id: number;
  guest_name: string;
  customer_name: string | null;
  customer_phone: string | null;
  stay_date: string;
  time_range: string;
  channel: string;
  status: BookingStatus;
  amount: number;
  menu_items_total: number;
  guest_count: number | null;
  has_car: boolean;
  has_decoration: boolean;
  discount_code: string | null;
  notes: string | null;
  cccd_front: string | null;
  cccd_back: string | null;
  created_at: string;
  card_name: string;
  branch_name: string;
  room_amenities: string[];
  price_from: number;
  price_to: number;
  full_day_price: number;
  main_image: string;
  is_classic: number;
  images: string[];
  branch_hotline: string;
  branch_maps: string;
  branch_active: number;
  branch_classic: number;
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

async function getBookings(limit = 12) {
  return query<BookingRow>(
    `
    select
      b.id,
      b.room_id,
      b.branch_id,
      b.guest_name,
      b.customer_name,
      b.customer_phone,
      b.stay_date::text,
      b.time_range,
      b.channel,
      b.status,
      b.amount,
      coalesce(b.menu_items_total, 0) as menu_items_total,
      b.guest_count,
      b.has_car,
      b.has_decoration,
      b.discount_code,
      b.notes,
      b.cccd_front,
      b.cccd_back,
      b.created_at::text,
      r.card_name,
      r.branch_name,
      r.room_amenities,
      r.price_from,
      r.price_to,
      r.full_day_price,
      r.main_image,
      r.is_classic,
      r.images,
      br.hotline as branch_hotline,
      br.google_maps_link as branch_maps,
      br.active as branch_active,
      br.classic_booking_enabled as branch_classic
    from bookings b
    join rooms r on r.id = b.room_id
    join branches br on br.id = b.branch_id
    order by b.created_at desc
    limit $1
    `,
    [limit]
  );
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
  const rows = await query<BookingRow>(
    `
    select
      b.id, b.room_id, b.branch_id, b.guest_name, b.customer_name, b.customer_phone,
      b.stay_date::text, b.time_range, b.channel, b.status, b.amount,
      coalesce(b.menu_items_total, 0) as menu_items_total,
      b.guest_count,
      b.has_car, b.has_decoration, b.discount_code, b.notes, b.cccd_front, b.cccd_back,
      b.created_at::text,
      coalesce(r.card_name, b.room_name, '') as card_name,
      coalesce(r.branch_name, b.branch_name, '') as branch_name,
      coalesce(r.room_amenities, '{}') as room_amenities,
      coalesce(r.price_from, b.amount, 0) as price_from,
      coalesce(r.price_to, b.amount, 0) as price_to,
      coalesce(r.full_day_price, 0) as full_day_price,
      r.main_image, r.is_classic, r.images,
      br.hotline as branch_hotline, br.google_maps_link as branch_maps,
      br.active as branch_active, br.classic_booking_enabled as branch_classic
    from bookings b
    left join rooms r on r.id = b.room_id
    left join branches br on br.id = b.branch_id
    where upper(b.id) = upper($1)
    limit 1
    `,
    [id]
  );
  if (!rows[0]) return null;
  const booking = rows[0];
  return {
    id: booking.id,
    guestName: booking.guest_name,
    room: {
      id: booking.room_id,
      branch_id: booking.branch_id,
      card_name: booking.card_name,
      branch_name: booking.branch_name,
      room_amenities: booking.room_amenities,
      price_from: booking.price_from,
      price_to: booking.price_to,
      full_day_price: booking.full_day_price,
      main_image: booking.main_image,
      is_classic: booking.is_classic,
      images: booking.images,
    },
    branch: {
      id: booking.branch_id,
      name: booking.branch_name,
      active: booking.branch_active,
      hotline: booking.branch_hotline,
      google_maps_link: booking.branch_maps,
      classic_booking_enabled: booking.branch_classic,
    },
    stayDate: booking.stay_date?.slice(0, 10) ?? '',
    dateLabel: booking.stay_date
      ? new Date(booking.stay_date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
      : '',
    timeRange: booking.time_range,
    channel: booking.channel,
    status: booking.status,
    amount: booking.amount,
    menuItemsTotal: Number(booking.menu_items_total) || 0,
    customerName: booking.customer_name,
    customerPhone: booking.customer_phone,
    guestCount: booking.guest_count,
    hasCar: booking.has_car ?? false,
    hasDecoration: booking.has_decoration ?? false,
    discountCode: booking.discount_code,
    notes: booking.notes,
    cccdFront: booking.cccd_front,
    cccdBack: booking.cccd_back,
    createdAt: booking.created_at,
  };
}

export async function getBookingSnapshots(limit = 12): Promise<BookingSnapshot[]> {
  const bookings = await getBookings(limit);

  return bookings.map((booking) => ({
    id: booking.id,
    guestName: booking.guest_name,
    room: {
      id: booking.room_id,
      branch_id: booking.branch_id,
      card_name: booking.card_name,
      branch_name: booking.branch_name,
      room_amenities: booking.room_amenities,
      price_from: booking.price_from,
      price_to: booking.price_to,
      full_day_price: booking.full_day_price,
      main_image: booking.main_image,
      is_classic: booking.is_classic,
      images: booking.images
    },
    branch: {
      id: booking.branch_id,
      name: booking.branch_name,
      active: booking.branch_active,
      hotline: booking.branch_hotline,
      google_maps_link: booking.branch_maps,
      classic_booking_enabled: booking.branch_classic
    },
    stayDate: booking.stay_date.slice(0, 10),
    dateLabel: new Date(booking.stay_date).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }),
    timeRange: booking.time_range,
    channel: booking.channel,
    status: booking.status,
    amount: booking.amount,
    menuItemsTotal: Number(booking.menu_items_total) || 0,
    customerName: booking.customer_name,
    customerPhone: booking.customer_phone,
    guestCount: booking.guest_count,
    hasCar: booking.has_car ?? false,
    hasDecoration: booking.has_decoration ?? false,
    discountCode: booking.discount_code,
    notes: booking.notes,
    cccdFront: booking.cccd_front,
    cccdBack: booking.cccd_back,
    createdAt: booking.created_at
  }));
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
    const monthKey = booking.stay_date.slice(0, 7);
    byMonth.set(monthKey, (byMonth.get(monthKey) ?? 0) + 1);
    if (booking.price_from >= 250000) {
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
  const total = bookings.reduce((sum, booking) => sum + booking.amount, 0);
  const average = bookings.length ? Math.round(total / bookings.length) : 0;
  const highest = bookings.reduce((max, booking) => Math.max(max, booking.amount), 0);
  const lowest = bookings.reduce((min, booking) => Math.min(min, booking.amount), bookings[0]?.amount ?? 0);

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
    const current = guests.get(booking.guest_name);
    const nextTotal = (current?.totalSpent ?? 0) + booking.amount;
    const nextBookings = (current?.bookings ?? 0) + 1;
    const nextBranches = new Set([...(current?.branches ?? []), booking.branch_name]);

    guests.set(booking.guest_name, {
      guestName: booking.guest_name,
      bookings: nextBookings,
      branches: [...nextBranches],
      latestStay: new Date(booking.stay_date).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }),
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
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (branchId) {
    params.push(branchId);
    conditions.push(`b.branch_id = $${params.length}`);
  }
  if (dateFrom) {
    params.push(dateFrom);
    conditions.push(`b.stay_date >= $${params.length}`);
  }
  if (dateTo) {
    params.push(dateTo);
    conditions.push(`b.stay_date <= $${params.length}`);
  }
  if (status) {
    params.push(status);
    conditions.push(`b.status = $${params.length}`);
  }

  params.push(limit);
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const bookings = await query<BookingRow>(
    `
    select
      b.id, b.room_id, b.branch_id, b.guest_name, b.customer_name, b.customer_phone,
      b.stay_date::text, b.time_range, b.channel, b.status, b.amount,
      coalesce(b.menu_items_total, 0) as menu_items_total,
      b.guest_count,
      b.has_car, b.has_decoration, b.discount_code, b.notes, b.cccd_front, b.cccd_back,
      b.created_at::text,
      r.card_name, r.branch_name, r.room_amenities, r.price_from, r.price_to,
      r.full_day_price, r.main_image, r.is_classic, r.images,
      br.hotline as branch_hotline, br.google_maps_link as branch_maps,
      br.active as branch_active, br.classic_booking_enabled as branch_classic
    from bookings b
    join rooms r on r.id = b.room_id
    join branches br on br.id = b.branch_id
    ${where}
    order by b.created_at desc
    limit $${params.length}
    `,
    params
  );

  return bookings.map((booking) => ({
    id: booking.id,
    guestName: booking.guest_name,
    room: {
      id: booking.room_id,
      branch_id: booking.branch_id,
      card_name: booking.card_name,
      branch_name: booking.branch_name,
      room_amenities: booking.room_amenities,
      price_from: booking.price_from,
      price_to: booking.price_to,
      full_day_price: booking.full_day_price,
      main_image: booking.main_image,
      is_classic: booking.is_classic,
      images: booking.images
    },
    branch: {
      id: booking.branch_id,
      name: booking.branch_name,
      active: booking.branch_active,
      hotline: booking.branch_hotline,
      google_maps_link: booking.branch_maps,
      classic_booking_enabled: booking.branch_classic
    },
    stayDate: booking.stay_date.slice(0, 10),
    dateLabel: new Date(booking.stay_date).toLocaleDateString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    }),
    timeRange: booking.time_range,
    channel: booking.channel,
    status: booking.status,
    amount: booking.amount,
    menuItemsTotal: Number(booking.menu_items_total) || 0,
    customerName: booking.customer_name,
    customerPhone: booking.customer_phone,
    guestCount: booking.guest_count,
    hasCar: booking.has_car ?? false,
    hasDecoration: booking.has_decoration ?? false,
    discountCode: booking.discount_code,
    notes: booking.notes,
    cccdFront: booking.cccd_front,
    cccdBack: booking.cccd_back,
    createdAt: booking.created_at
  }));
}
