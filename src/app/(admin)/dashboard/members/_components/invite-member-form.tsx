'use client';

import { useState } from 'react';
import { useOrganization } from '@clerk/nextjs';
import { toast } from 'sonner';

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
import { Icons } from '@/components/icons';

const ROLE_OPTIONS = [
  { value: 'org:member', label: 'Thành viên' },
  { value: 'org:admin', label: 'Quản trị viên' }
];

export function InviteMemberForm() {
  const { organization, invitations } = useOrganization();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('org:member');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization) return;

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      toast.error('Vui lòng nhập địa chỉ email.');
      return;
    }

    setIsSubmitting(true);
    try {
      await organization.inviteMember({ emailAddress: trimmedEmail, role });
      await invitations?.revalidate?.();
      toast.success(`Đã gửi lời mời đến ${trimmedEmail}.`);
      setEmail('');
      setRole('org:member');
    } catch (err) {
      const message =
        (err as { errors?: { message?: string }[] })?.errors?.[0]?.message ??
        'Không thể gửi lời mời. Vui lòng thử lại.';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className='flex flex-col gap-4 sm:flex-row sm:items-end'>
      <div className='flex-1 space-y-2'>
        <Label htmlFor='invite-email'>Email</Label>
        <Input
          id='invite-email'
          type='email'
          placeholder='ten@example.com'
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isSubmitting}
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
      <Button type='submit' disabled={isSubmitting}>
        {isSubmitting ? (
          <Icons.spinner className='mr-2 h-4 w-4 animate-spin' />
        ) : (
          <Icons.add className='mr-2 h-4 w-4' />
        )}
        Mời
      </Button>
    </form>
  );
}
