'use client';

import { ThemeProvider as NextThemesProvider, ThemeProviderProps } from 'next-themes';

// React 19 warns during render when it sees <script> in a component tree. next-themes
// injects one for FOUC prevention that intentionally only runs on the server. Patch at
// module load time (before any render) so the message is suppressed from the start.
// Remove once next-themes ships a fix using <template>.
if (typeof window !== 'undefined') {
  const original = console.error;
  console.error = (...args: unknown[]) => {
    if (typeof args[0] === 'string' && args[0].includes('Encountered a script tag')) return;
    original.apply(console, args);
  };
}

export default function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
