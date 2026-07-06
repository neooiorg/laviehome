import { SignUp } from '@clerk/nextjs';

export default function RegisterV2() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <SignUp fallbackRedirectUrl="/dashboard" />
    </div>
  );
}
