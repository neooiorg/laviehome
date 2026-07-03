'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function adminLogin(formData: FormData) {
  const password = formData.get('password') as string;
  const secret = process.env.ADMIN_SECRET;

  if (!secret || password !== secret) {
    return { error: 'Mật khẩu không đúng.' };
  }

  const cookieStore = await cookies();
  cookieStore.set('admin_session', secret, {
    httpOnly: true,
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
    sameSite: 'lax',
  });

  redirect('/dashboard/bookings');
}

export async function adminLogout() {
  const cookieStore = await cookies();
  cookieStore.delete('admin_session');
  redirect('/auth/login');
}
