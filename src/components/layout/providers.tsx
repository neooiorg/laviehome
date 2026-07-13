'use client';
import React from 'react';
import { ActiveThemeProvider } from '../themes/active-theme';
import { TooltipProvider } from '@/components/ui/tooltip';
import QueryProvider from './query-provider';

export default function Providers({
  activeThemeValue,
  children
}: {
  activeThemeValue: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <ActiveThemeProvider initialTheme={activeThemeValue}>
        <QueryProvider>
          <TooltipProvider>{children}</TooltipProvider>
        </QueryProvider>
      </ActiveThemeProvider>
    </>
  );
}
