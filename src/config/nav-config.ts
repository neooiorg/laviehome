import { NavGroup } from '@/types';

/**
 * Navigation configuration for Lavie Home dashboard
 *
 * Used for both the sidebar navigation and Cmd+K bar (KBar).
 * Items are organized into groups, each rendered with a SidebarGroupLabel.
 */
export const navGroups: NavGroup[] = [
  {
    label: 'Tổng quan',
    items: [
      {
        title: 'Dashboard',
        url: '/dashboard/overview',
        icon: 'dashboard',
        isActive: false,
        shortcut: ['d', 'd'],
        items: []
      }
    ]
  },
  {
    label: 'Quản lý',
    items: [
      {
        title: 'Đặt phòng',
        url: '/dashboard/bookings',
        icon: 'billing',
        isActive: false,
        shortcut: ['b', 'b'],
        items: []
      },
      {
        title: 'Chi nhánh',
        url: '/dashboard/branches',
        icon: 'workspace',
        isActive: false,
        items: []
      },
      {
        title: 'Phòng',
        url: '/dashboard/rooms',
        icon: 'product',
        isActive: false,
        items: []
      },
      {
        title: 'Thư viện ảnh',
        url: '/dashboard/media',
        icon: 'media',
        isActive: false,
        items: []
      },
      {
        title: 'Mã giảm giá',
        url: '/dashboard/discounts',
        icon: 'palette',
        isActive: false,
        items: []
      },
      {
        title: 'Khách hàng',
        url: '/dashboard/customers',
        icon: 'teams',
        isActive: false,
        shortcut: ['u', 'u'],
        items: []
      }
    ]
  },
  {
    label: 'Báo cáo',
    items: [
      {
        title: 'Thống kê',
        url: '/dashboard/analytics',
        icon: 'kanban',
        isActive: false,
        items: []
      },
    ]
  },
];
