import React from 'react';
import { SidebarTrigger } from '../ui/sidebar';
import { Separator } from '../ui/separator';
import { BreadcrumbNav } from '@/app/(admin)/dashboard/_components/sidebar/breadcrumb-nav';
import { LayoutControls } from '@/app/(admin)/dashboard/_components/sidebar/layout-controls';
import { ThemeModeToggle } from '../themes/theme-mode-toggle';
import { NotificationCenter } from '@/features/notifications/components/notification-center';

export default function Header() {
  return (
    <header className='bg-background/60 sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between gap-2 backdrop-blur-md md:h-14'>
      <div className='flex items-center gap-2 px-4'>
        <SidebarTrigger className='-ml-1' />
        <Separator orientation='vertical' className='mr-2 h-4' />
        <BreadcrumbNav />
      </div>

      <div className='flex items-center gap-2 px-4'>
        <ThemeModeToggle />
        <NotificationCenter />
        <LayoutControls />
      </div>
    </header>
  );
}
