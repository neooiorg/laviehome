import { NextResponse } from "next/server";
import { query } from "@/lib/postgres";
import { auth } from "@/lib/auth";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = (await req.json()) as { name?: string; role?: string };
  const name = body.name?.trim();
  const role = body.role;

  if (role !== undefined && role !== "admin" && role !== "member") {
    return NextResponse.json({ error: "Vai trò không hợp lệ." }, { status: 400 });
  }

  // Don't let an admin lock themselves out by demoting their own account.
  if (session.user.id === id && role === "member") {
    return NextResponse.json(
      { error: "Không thể tự hạ quyền tài khoản của chính mình." },
      { status: 400 }
    );
  }

  const rows = await query<{ id: string }>(
    `UPDATE auth_user
        SET name = COALESCE($2, name),
            role = COALESCE($3, role),
            "updatedAt" = now()
      WHERE id = $1
      RETURNING id`,
    [id, name || null, role ?? null]
  );

  if (rows.length === 0) {
    return NextResponse.json({ error: "Không tìm thấy thành viên." }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}

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

  try {
    // Remove dependent rows first. auth_session / ba_verification cascade, but
    // an auth_account row (if the table exists) can have a FK without cascade
    // and block the delete — clean it up defensively.
    await query(`DELETE FROM auth_account WHERE "userId" = $1`, [id]).catch(() => {});
    await query(`DELETE FROM auth_session WHERE "userId" = $1`, [id]).catch(() => {});

    const rows = await query<{ id: string }>(
      `DELETE FROM auth_user WHERE id = $1 RETURNING id`,
      [id]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: "Không tìm thấy thành viên." }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Lỗi không xác định";
    return NextResponse.json({ error: `Không thể xoá thành viên: ${message}` }, { status: 500 });
  }
}
