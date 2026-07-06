'use client';

import { useOrganization } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

import PageContainer from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Icons } from '@/components/icons';

import { InviteMemberForm } from './_components/invite-member-form';
import { MembersList } from './_components/members-list';

export default function MembersPage() {
  const { organization, isLoaded } = useOrganization();
  const router = useRouter();

  return (
    <PageContainer
      pageTitle='Thành viên'
      pageDescription='Mời và quản lý thành viên trong tổ chức của bạn.'
      isLoading={!isLoaded}
    >
      {!organization ? (
        <div className='flex flex-1 flex-col items-center justify-center gap-4 py-16 text-center'>
          <p className='text-muted-foreground'>
            Bạn cần chọn hoặc tạo một tổ chức trước khi mời thành viên.
          </p>
          <Button onClick={() => router.push('/dashboard/workspaces')}>
            <Icons.add className='mr-2 h-4 w-4' />
            Tạo tổ chức
          </Button>
        </div>
      ) : (
        <div className='flex flex-col gap-6'>
          <Card>
            <CardHeader>
              <CardTitle className='text-lg'>Mời thành viên mới</CardTitle>
            </CardHeader>
            <CardContent>
              <InviteMemberForm />
            </CardContent>
          </Card>

          <Card>
            <CardContent className='pt-6'>
              <MembersList />
            </CardContent>
          </Card>
        </div>
      )}
    </PageContainer>
  );
}
