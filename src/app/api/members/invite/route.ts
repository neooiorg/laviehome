import { NextResponse } from "next/server";
import { query } from "@/lib/postgres";
import { auth } from "@/lib/auth";
import { Resend } from "resend";
import { createElement } from "react";
import { MagicLinkEmail } from "@/emails/magic-link-email";
import { randomUUID } from "crypto";

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json() as { email?: string; name?: string; role?: string };
  const { email, name, role = "member" } = body;

  if (!email) {
    return NextResponse.json({ error: "Email là bắt buộc." }, { status: 400 });
  }

  // Check for existing user
  const existing = await query<{ id: string }>(
    `SELECT id FROM auth_user WHERE email = $1`,
    [email]
  );

  let userId: string;

  if (existing.length > 0) {
    userId = existing[0].id;
  } else {
    // Create new user
    userId = randomUUID();
    await query(
      `INSERT INTO auth_user (id, name, email, "emailVerified", role, "createdAt", "updatedAt")
       VALUES ($1, $2, $3, false, $4, now(), now())`,
      [userId, name ?? email, email, role]
    );
  }

  // Send magic link via Better Auth
  const baseUrl = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
  const token = randomUUID();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  await query(
    `INSERT INTO verification (id, identifier, value, "expiresAt", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, now(), now())
     ON CONFLICT DO NOTHING`,
    [randomUUID(), email, token, expiresAt]
  );

  const magicUrl = `${baseUrl}/api/auth/magic-link/verify?token=${token}&callbackURL=/dashboard`;

  const resend = new Resend(process.env.RESEND_API_KEY);
  await resend.emails.send({
    from: "Lavie Home <noreply@neooi.com>",
    to: email,
    subject: "Bạn được mời vào Lavie Home Dashboard",
    react: createElement(MagicLinkEmail, { url: magicUrl }),
  });

  return NextResponse.json({ success: true });
}
