import { NextResponse } from "next/server";
import { query } from "@/lib/postgres";
import { auth } from "@/lib/auth";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Prevent self-deletion
  if (session.user.id === id) {
    return NextResponse.json({ error: "Không thể xoá tài khoản của chính mình." }, { status: 400 });
  }

  await query(`DELETE FROM "user" WHERE id = $1`, [id]);

  return NextResponse.json({ success: true });
}
