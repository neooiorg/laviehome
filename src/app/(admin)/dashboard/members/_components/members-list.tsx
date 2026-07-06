'use client';

import { useState } from 'react';
import { useOrganization } from '@clerk/nextjs';
import { toast } from 'sonner';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import { Icons } from '@/components/icons';
import { getInitials } from '@/lib/utils';

function roleLabel(role: string) {
  switch (role) {
    case 'org:admin':
      return 'Quản trị viên';
    case 'org:member':
      return 'Thành viên';
    default:
      return role.replace(/^org:/, '');
  }
}

export function MembersList() {
  const { memberships, invitations } = useOrganization({
    memberships: { infinite: true, keepPreviousData: true },
    invitations: { infinite: true, keepPreviousData: true, status: ['pending'] }
  });

  const [pendingId, setPendingId] = useState<string | null>(null);

  type Membership = NonNullable<NonNullable<typeof memberships>['data']>[number];
  type Invitation = NonNullable<NonNullable<typeof invitations>['data']>[number];

  const handleRemoveMember = async (membership: Membership) => {
    setPendingId(membership.id);
    try {
      await membership.destroy();
      await memberships?.revalidate?.();
      toast.success('Đã xoá thành viên.');
    } catch {
      toast.error('Không thể xoá thành viên.');
    } finally {
      setPendingId(null);
    }
  };

  const handleRevoke = async (invitation: Invitation) => {
    setPendingId(invitation.id);
    try {
      await invitation.revoke();
      await invitations?.revalidate?.();
      toast.success('Đã thu hồi lời mời.');
    } catch {
      toast.error('Không thể thu hồi lời mời.');
    } finally {
      setPendingId(null);
    }
  };

  return (
    <div className='flex flex-col gap-8'>
      <section>
        <h3 className='mb-3 text-sm font-medium text-muted-foreground'>
          Thành viên ({memberships?.data?.length ?? 0})
        </h3>
        <div className='rounded-lg border'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Thành viên</TableHead>
                <TableHead>Vai trò</TableHead>
                <TableHead className='w-16' />
              </TableRow>
            </TableHeader>
            <TableBody>
              {!memberships?.data?.length ? (
                <TableRow>
                  <TableCell colSpan={3} className='text-center text-muted-foreground'>
                    Chưa có thành viên nào.
                  </TableCell>
                </TableRow>
              ) : (
                memberships.data.map((membership) => {
                  const u = membership.publicUserData;
                  const name = [u?.firstName, u?.lastName].filter(Boolean).join(' ') || u?.identifier || '—';
                  return (
                    <TableRow key={membership.id}>
                      <TableCell>
                        <div className='flex items-center gap-3'>
                          <Avatar className='h-8 w-8'>
                            <AvatarImage src={u?.imageUrl || undefined} alt={name} />
                            <AvatarFallback>{getInitials(name)}</AvatarFallback>
                          </Avatar>
                          <div className='flex flex-col'>
                            <span className='text-sm font-medium'>{name}</span>
                            <span className='text-xs text-muted-foreground'>{u?.identifier}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant='secondary'>{roleLabel(membership.role)}</Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant='ghost'
                          size='icon'
                          disabled={pendingId === membership.id}
                          onClick={() => handleRemoveMember(membership)}
                          aria-label='Xoá thành viên'
                        >
                          {pendingId === membership.id ? (
                            <Icons.spinner className='h-4 w-4 animate-spin' />
                          ) : (
                            <Icons.trash className='h-4 w-4 text-destructive' />
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </section>

      {!!invitations?.data?.length && (
        <section>
          <h3 className='mb-3 text-sm font-medium text-muted-foreground'>
            Lời mời đang chờ ({invitations.data.length})
          </h3>
          <div className='rounded-lg border'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Vai trò</TableHead>
                  <TableHead className='w-16' />
                </TableRow>
              </TableHeader>
              <TableBody>
                {invitations.data.map((invitation) => (
                  <TableRow key={invitation.id}>
                    <TableCell className='text-sm'>{invitation.emailAddress}</TableCell>
                    <TableCell>
                      <Badge variant='outline'>{roleLabel(invitation.role)}</Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant='ghost'
                        size='icon'
                        disabled={pendingId === invitation.id}
                        onClick={() => handleRevoke(invitation)}
                        aria-label='Thu hồi lời mời'
                      >
                        {pendingId === invitation.id ? (
                          <Icons.spinner className='h-4 w-4 animate-spin' />
                        ) : (
                          <Icons.close className='h-4 w-4' />
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>
      )}
    </div>
  );
}
