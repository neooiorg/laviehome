"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"email" | "otp">("email");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return;

    setLoading(true);
    setError(null);

    const { error: err } = await authClient.emailOtp.sendVerificationOtp({
      email: trimmed,
      type: "sign-in",
    });

    setLoading(false);

    if (err) {
      setError(err.message ?? "Không thể gửi mã. Vui lòng thử lại.");
    } else {
      setStep("otp");
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.trim();
    if (!code || code.length !== 6) return;

    setLoading(true);
    setError(null);

    const { error: err } = await authClient.signIn.emailOtp({
      email: email.trim(),
      otp: code,
    });

    setLoading(false);

    if (err) {
      setError(err.message ?? "Mã không hợp lệ hoặc đã hết hạn.");
    } else {
      router.push("/dashboard");
    }
  };

  if (step === "otp") {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center px-6">
        <div className="w-full max-w-sm">
          <div className="mb-8 text-center">
            <div className="mb-4 inline-flex size-14 items-center justify-center overflow-hidden rounded-2xl border bg-card shadow-sm">
              <Image
                src="/lavie-icon.png"
                alt="Lavie Home"
                width={56}
                height={56}
                className="size-full object-contain p-1.5"
                priority
              />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Nhập mã OTP</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Chúng tôi đã gửi mã 6 chữ số đến
            </p>
            <p className="mt-0.5 text-sm font-medium">{email}</p>
          </div>

          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="otp">Mã xác nhận</Label>
              <Input
                id="otp"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                disabled={loading}
                autoFocus
                required
                className="text-center text-xl tracking-widest"
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button
              type="submit"
              className="w-full"
              disabled={loading || otp.length !== 6}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Đang xác nhận...
                </>
              ) : (
                "Đăng nhập"
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Chưa nhận được mã?{" "}
            <button
              className="underline underline-offset-2 hover:text-foreground transition-colors"
              onClick={() => {
                setStep("email");
                setOtp("");
                setError(null);
              }}
            >
              Gửi lại
            </button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mb-5 inline-flex size-14 items-center justify-center overflow-hidden rounded-2xl border bg-card shadow-sm">
            <Image
              src="/lavie-icon.png"
              alt="Lavie Home"
              width={56}
              height={56}
              className="size-full object-contain p-1.5"
              priority
            />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Đăng nhập quản trị</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Nhập email tài khoản để nhận mã đăng nhập Lavie Home
          </p>
        </div>

        <form onSubmit={handleSendOtp} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="ten@laviehome.vn"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              autoFocus
              required
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button
            type="submit"
            className="w-full"
            disabled={loading || !email.trim()}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Đang gửi...
              </>
            ) : (
              "Gửi mã OTP"
            )}
          </Button>
        </form>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Chỉ tài khoản được cấp phép mới có thể đăng nhập.
        </p>
      </div>
    </div>
  );
}
