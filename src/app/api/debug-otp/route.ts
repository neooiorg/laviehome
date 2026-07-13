import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { Pool } from "pg";
import { Resend } from "resend";

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

export async function POST(req: Request) {
  const { email } = await req.json() as { email?: string };
  const logs: string[] = [];

  // 1. Check user in auth_user
  try {
    const r = await pool.query("SELECT id, email, name FROM auth_user WHERE email = $1", [email]);
    logs.push(`auth_user rows: ${r.rowCount} — ${JSON.stringify(r.rows)}`);
  } catch (e) {
    logs.push(`auth_user query error: ${e instanceof Error ? e.message : String(e)}`);
  }

  // 2. Try Resend directly
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const result = await resend.emails.send({
      from: "Lavie Home <noreply@laviehome.vn>",
      to: email ?? "test@test.com",
      subject: "TEST OTP: 123456",
      html: "<p>Test email from debug endpoint. OTP: <b>123456</b></p>",
    });
    logs.push(`resend result: ${JSON.stringify(result)}`);
  } catch (e) {
    logs.push(`resend error: ${e instanceof Error ? e.message : String(e)}`);
  }

  return NextResponse.json({ logs });
}
