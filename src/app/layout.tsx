import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import './globals.css';

export const metadata: Metadata = {
  title: 'Lavie Home - Đặt Phòng Tự Check-in Tự Động 24/7',
  description:
    'Website đặt phòng Lavie Home với chọn chi nhánh, xem phòng, lịch đặt phòng demo và thông tin liên hệ.'
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider publishableKey={process.env.CLERK_PUBLISHABLE_KEY}>
      <html lang='vi' className='dark h-full antialiased' data-theme='lavie'>
        <body className='min-h-full flex flex-col bg-background text-foreground font-sans'>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
