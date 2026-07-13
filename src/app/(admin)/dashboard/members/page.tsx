import PageContainer from '@/components/layout/page-container';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { query } from '@/lib/postgres';
import { InviteMemberForm } from './_components/invite-member-form';
import { MembersList } from './_components/members-list';

export interface AdminUser extends Record<string, unknown> {
  id: string;
  name: string;
  email: string;
  role: string;
  emailVerified: boolean;
  createdAt: string;
}

async function getMembers(): Promise<AdminUser[]> {
  return query<AdminUser>(
    `SELECT id, name, email, role, "emailVerified", "createdAt" FROM auth_user ORDER BY "createdAt" ASC`
  );
}

export default async function MembersPage() {
  const members = await getMembers();

  return (
    <PageContainer
      pageTitle='Thành viên'
      pageDescription='Mời và quản lý tài khoản admin.'
    >
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
            <MembersList members={members} />
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
