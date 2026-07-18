import { NextResponse } from "next/server";
import { query } from "@/lib/postgres";
import { auth } from "@/lib/auth";
import { randomUUID } from "crypto";

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as { email?: string; name?: string; role?: string };
  const email = body.email?.trim().toLowerCase();
  const name = body.name?.trim();
  const role = body.role === "admin" ? "admin" : "member";

  if (!email) {
    return NextResponse.json({ error: "Email là bắt buộc." }, { status: 400 });
  }

  // Only pre-provisioned accounts can request an OTP (auth uses disableSignUp).
  const existing = await query<{ id: string }>(
    `SELECT id FROM auth_user WHERE email = $1`,
    [email]
  );

  if (existing.length > 0) {
    return NextResponse.json(
      { error: "Tài khoản với email này đã tồn tại." },
      { status: 409 }
    );
  }

  await query(
    `INSERT INTO auth_user (id, name, email, "emailVerified", role, "createdAt", "updatedAt")
     VALUES ($1, $2, $3, false, $4, now(), now())`,
    [randomUUID(), name || email, email, role]
  );

  return NextResponse.json({ success: true });
}
