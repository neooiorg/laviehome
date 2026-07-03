import {
  BedDouble,
  BookOpen,
  Building2,
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
    id: 1,
    label: "Quản lý",
    items: [
      {
        id: "bookings",
        title: "Bookings",
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
    ],
  },
];
