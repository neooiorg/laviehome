'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Loader2, UserPlus } from 'lucide-react';

const ROLE_OPTIONS = [
  { value: 'member', label: 'Thành viên' },
  { value: 'admin', label: 'Quản trị viên' }
];

export function InviteMemberForm() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('member');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedEmail = email.trim();
    const trimmedName = name.trim();
    if (!trimmedEmail) {
      toast.error('Vui lòng nhập địa chỉ email.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/members/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmedEmail, name: trimmedName || trimmedEmail, role }),
      });

      const data = await res.json() as { error?: string };
      if (!res.ok) {
        toast.error(data.error ?? 'Không thể cấp phát tài khoản. Vui lòng thử lại.');
        return;
      }

      toast.success(`Đã cấp phát tài khoản cho ${trimmedEmail}. Họ có thể đăng nhập bằng OTP.`);
      setEmail('');
      setName('');
      setRole('member');
      router.refresh();
    } catch {
      toast.error('Không thể cấp phát tài khoản. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className='flex flex-col gap-4'>
      <div className='flex flex-col gap-4 sm:flex-row sm:items-end'>
        <div className='flex-1 space-y-2'>
          <Label htmlFor='invite-name'>Tên</Label>
          <Input
            id='invite-name'
            type='text'
            placeholder='Nguyễn Văn A'
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isSubmitting}
          />
        </div>
        <div className='flex-1 space-y-2'>
          <Label htmlFor='invite-email'>Email</Label>
          <Input
            id='invite-email'
            type='email'
            placeholder='ten@example.com'
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isSubmitting}
            required
          />
        </div>
        <div className='space-y-2 sm:w-48'>
          <Label htmlFor='invite-role'>Vai trò</Label>
          <Select value={role} onValueChange={setRole} disabled={isSubmitting}>
            <SelectTrigger id='invite-role' className='w-full'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ROLE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button type='submit' disabled={isSubmitting || !email.trim()}>
          {isSubmitting ? (
            <Loader2 className='mr-2 h-4 w-4 animate-spin' />
          ) : (
            <UserPlus className='mr-2 h-4 w-4' />
          )}
          Cấp phát
        </Button>
      </div>
    </form>
  );
}
