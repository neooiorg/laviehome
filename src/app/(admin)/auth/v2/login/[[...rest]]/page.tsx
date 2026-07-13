"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Loader2, CheckCircle2 } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return;

    setLoading(true);
    setError(null);

    const { error: err } = await authClient.signIn.magicLink({
      email: trimmed,
      callbackURL: "/dashboard",
    });

    setLoading(false);

    if (err) {
      setError(err.message ?? "Không thể gửi link đăng nhập. Vui lòng thử lại.");
    } else {
      setSent(true);
    }
  };

  if (sent) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center px-6 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
          <CheckCircle2 className="size-7 text-primary" />
        </div>
        <h2 className="mb-2 text-xl font-semibold">Kiểm tra email của bạn</h2>
        <p className="mb-1 text-sm text-muted-foreground">
          Chúng tôi đã gửi link đăng nhập đến
        </p>
        <p className="mb-6 text-sm font-medium">{email}</p>
        <p className="text-xs text-muted-foreground">
          Link có hiệu lực trong 15 phút.{" "}
          <button
            className="underline underline-offset-2 hover:text-foreground transition-colors"
            onClick={() => { setSent(false); setEmail(""); }}
          >
            Thử email khác
          </button>
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Mail className="size-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Đăng nhập</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Nhập email để nhận link đăng nhập
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <Button type="submit" className="w-full" disabled={loading || !email.trim()}>
            {loading ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Đang gửi...
              </>
            ) : (
              "Gửi link đăng nhập"
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
