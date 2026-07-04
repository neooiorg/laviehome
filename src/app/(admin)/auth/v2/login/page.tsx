import { SignIn } from '@clerk/nextjs';

export default function LoginV2() {
  return (
    <div className="flex items-center justify-center">
      <SignIn fallbackRedirectUrl="/dashboard" />
    </div>
  );
}
