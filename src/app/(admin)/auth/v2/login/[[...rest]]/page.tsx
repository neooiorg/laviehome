import { SignIn } from '@clerk/nextjs';

export default function LoginV2() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <SignIn path="/auth/v2/login" fallbackRedirectUrl="/dashboard" />
    </div>
  );
}
