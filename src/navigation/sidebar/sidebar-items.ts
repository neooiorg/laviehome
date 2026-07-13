import {
  BedDouble,
  BookOpen,
  Building2,
  LayoutDashboard,
  Tag,
  UtensilsCrossed,
  Users,
  type LucideIcon,
} from "lucide-react";

export type NavBadge = "new" | "soon";

export interface NavSubItem {
  id: string;
  title: string;
  url: string;
  icon?: LucideIcon;
  badge?: NavBadge;
  disabled?: boolean;
  newTab?: boolean;
}

interface NavItemBase {
  id: string;
  title: string;
  icon?: LucideIcon;
  badge?: NavBadge;
  disabled?: boolean;
  newTab?: boolean;
}

export interface NavMainLinkItem extends NavItemBase {
  url: string;
  subItems?: never;
}

export interface NavMainParentItem extends NavItemBase {
  subItems: NavSubItem[];
}

export type NavMainItem = NavMainLinkItem | NavMainParentItem;

export interface NavGroup {
  id: number;
  label?: string;
  items: NavMainItem[];
}

export const sidebarItems: NavGroup[] = [
  {
    id: 0,
    label: "Tổng quan",
    items: [
      {
        id: "overview",
        title: "Dashboard",
        url: "/dashboard/overview",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    id: 1,
    label: "Quản lý",
    items: [
      {
        id: "bookings",
        title: "Đặt phòng",
        url: "/dashboard/bookings",
        icon: BookOpen,
      },
      {
        id: "branches",
        title: "Chi nhánh",
        url: "/dashboard/branches",
        icon: Building2,
      },
      {
        id: "rooms",
        title: "Phòng",
        url: "/dashboard/rooms",
        icon: BedDouble,
      },
      {
        id: "menu-items",
        title: "Menu Items",
        url: "/dashboard/menu-items",
        icon: UtensilsCrossed,
      },
      {
        id: "discounts",
        title: "Mã giảm giá",
        url: "/dashboard/discounts",
        icon: Tag,
      },
      {
        id: "customers",
        title: "Khách hàng",
        url: "/dashboard/customers",
        icon: Users,
      },
    ],
  },
];
