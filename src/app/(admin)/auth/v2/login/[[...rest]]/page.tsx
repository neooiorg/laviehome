import { SignIn } from '@clerk/nextjs';

export default function LoginV2() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      {/* forceRedirectUrl guarantees admins always land on the dashboard after
          login, even if a stray ?redirect_url param is present in the URL. */}
      <SignIn path="/auth/v2/login" fallbackRedirectUrl="/dashboard" forceRedirectUrl="/dashboard" />
    </div>
  );
}
