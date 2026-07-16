import { Manrope } from 'next/font/google';

const manrope = Manrope({
  subsets: ['latin', 'vietnamese'],
  variable: '--font-manrope',
  display: 'swap',
});

export const fontManrope = manrope;

// Applied on <body> in the root layout so `--font-manrope` resolves to the
// next/font-loaded family. `--font-sans` (globals.css) points at it.
export const fontVariables = manrope.variable;
