import { NextResponse } from "next/server";

export async function GET() {
  try {
    const { auth } = await import("@/lib/auth");
    return NextResponse.json({ status: "auth module loaded ok", plugins: ["emailOTP"] });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    const stack = e instanceof Error ? e.stack : undefined;
    return NextResponse.json({ error: msg, stack }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json() as { email?: string };
    const { auth } = await import("@/lib/auth");

    const result = await auth.api.sendVerificationOTP({
      body: { email: body.email ?? "test@test.com", type: "sign-in" },
    }).catch((e: unknown) => ({ error: e instanceof Error ? e.message : String(e) }));

    return NextResponse.json({ result });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    const stack = e instanceof Error ? e.stack : undefined;
    return NextResponse.json({ error: msg, stack }, { status: 500 });
  }
}
