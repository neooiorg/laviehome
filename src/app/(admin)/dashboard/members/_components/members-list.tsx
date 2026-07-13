'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Loader2, Trash2 } from 'lucide-react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { getInitials } from '@/lib/utils';
import type { AdminUser } from '../page';

function roleLabel(role: string) {
  switch (role) {
    case 'admin':
      return 'Quản trị viên';
    case 'member':
      return 'Thành viên';
    default:
      return role;
  }
}

export function MembersList({ members }: { members: AdminUser[] }) {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const router = useRouter();

  const handleRemove = async (id: string, email: string) => {
    setPendingId(id);
    try {
      const res = await fetch(`/api/members/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        toast.error('Không thể xoá thành viên.');
        return;
      }
      toast.success(`Đã xoá ${email}.`);
      router.refresh();
    } catch {
      toast.error('Không thể xoá thành viên.');
    } finally {
      setPendingId(null);
    }
  };

  return (
    <div className='flex flex-col gap-4'>
      <h3 className='text-sm font-medium text-muted-foreground'>
        Thành viên ({members.length})
      </h3>
      <div className='rounded-lg border'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Thành viên</TableHead>
              <TableHead>Vai trò</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className='w-16' />
            </TableRow>
          </TableHeader>
          <TableBody>
            {!members.length ? (
              <TableRow>
                <TableCell colSpan={4} className='text-center text-muted-foreground'>
                  Chưa có thành viên nào.
                </TableCell>
              </TableRow>
            ) : (
              members.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>
                    <div className='flex items-center gap-3'>
                      <Avatar className='h-8 w-8'>
                        <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                      </Avatar>
                      <div className='flex flex-col'>
                        <span className='text-sm font-medium'>{member.name}</span>
                        <span className='text-xs text-muted-foreground'>{member.email}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant='secondary'>{roleLabel(member.role)}</Badge>
                  </TableCell>
                  <TableCell>
                    {member.emailVerified ? (
                      <Badge variant='outline' className='text-emerald-600 border-emerald-200'>
                        Đã xác thực
                      </Badge>
                    ) : (
                      <Badge variant='outline' className='text-amber-600 border-amber-200'>
                        Chờ đăng nhập
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant='ghost'
                      size='icon'
                      disabled={pendingId === member.id}
                      onClick={() => handleRemove(member.id, member.email)}
                      aria-label='Xoá thành viên'
                    >
                      {pendingId === member.id ? (
                        <Loader2 className='h-4 w-4 animate-spin' />
                      ) : (
                        <Trash2 className='h-4 w-4 text-destructive' />
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
