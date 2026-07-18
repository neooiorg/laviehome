'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Loader2, Pencil, Trash2 } from 'lucide-react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
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

function EditMemberDialog({ member }: { member: AdminUser }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(member.name);
  const [role, setRole] = useState(member.role);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/members/${member.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() || member.email, role })
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        toast.error(data.error ?? 'Không thể cập nhật thành viên.');
        return;
      }
      toast.success('Đã cập nhật thành viên.');
      setOpen(false);
      router.refresh();
    } catch {
      toast.error('Không thể cập nhật thành viên.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        variant='ghost'
        size='icon'
        onClick={() => setOpen(true)}
        aria-label='Sửa thành viên'
      >
        <Pencil className='h-4 w-4' />
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sửa thành viên</DialogTitle>
        </DialogHeader>
        <div className='flex flex-col gap-4 py-2'>
          <div className='space-y-2'>
            <Label htmlFor={`edit-name-${member.id}`}>Tên</Label>
            <Input
              id={`edit-name-${member.id}`}
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={saving}
            />
          </div>
          <div className='space-y-2'>
            <Label>Email</Label>
            <Input value={member.email} disabled readOnly />
          </div>
          <div className='space-y-2'>
            <Label htmlFor={`edit-role-${member.id}`}>Vai trò</Label>
            <Select value={role} onValueChange={setRole} disabled={saving}>
              <SelectTrigger id={`edit-role-${member.id}`} className='w-full'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='member'>Thành viên</SelectItem>
                <SelectItem value='admin'>Quản trị viên</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant='outline' onClick={() => setOpen(false)} disabled={saving}>
            Huỷ
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
            Lưu
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function MembersList({ members }: { members: AdminUser[] }) {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const router = useRouter();

  const handleRemove = async (id: string, email: string) => {
    setPendingId(id);
    try {
      const res = await fetch(`/api/members/${id}`, { method: 'DELETE' });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        toast.error(data.error ?? 'Không thể xoá thành viên.');
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
              <TableHead className='w-24' />
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
                    <div className='flex items-center justify-end gap-1'>
                      <EditMemberDialog member={member} />
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant='ghost'
                            size='icon'
                            disabled={pendingId === member.id}
                            aria-label='Xoá thành viên'
                          >
                            {pendingId === member.id ? (
                              <Loader2 className='h-4 w-4 animate-spin' />
                            ) : (
                              <Trash2 className='h-4 w-4 text-destructive' />
                            )}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Xoá thành viên?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tài khoản {member.email} sẽ bị xoá và không thể đăng nhập nữa.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Huỷ</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleRemove(member.id, member.email)}
                            >
                              Xoá
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
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
