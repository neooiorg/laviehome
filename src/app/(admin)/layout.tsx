import type { ReactNode } from 'react';

import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { fontVars } from '@/lib/fonts/registry';
import { PREFERENCE_DEFAULTS } from '@/lib/preferences/preferences-config';
import { ThemeBootScript } from '@/scripts/theme-boot';
import { PreferencesStoreProvider } from '@/stores/preferences/preferences-provider';

import './globals.css';

export default function AdminLayout({ children }: { children: ReactNode }) {
  const {
    theme_mode,
    theme_preset,
    content_layout,
    navbar_style,
    sidebar_variant,
    sidebar_collapsible,
    font,
  } = PREFERENCE_DEFAULTS;

  return (
    <div
      className={`${fontVars} min-h-screen antialiased`}
      data-theme-mode={theme_mode}
      data-theme-preset={theme_preset}
      data-content-layout={content_layout}
      data-navbar-style={navbar_style}
      data-sidebar-variant={sidebar_variant}
      data-sidebar-collapsible={sidebar_collapsible}
      data-font={font}
    >
      <ThemeBootScript />
      <TooltipProvider>
        <PreferencesStoreProvider initialValues={PREFERENCE_DEFAULTS}>
          {children}
          <Toaster />
        </PreferencesStoreProvider>
      </TooltipProvider>
    </div>
  );
}
