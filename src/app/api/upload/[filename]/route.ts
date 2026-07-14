import { Pool } from "pg";
import { NextResponse } from "next/server";

let pool: Pool | null = null;
function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    });
  }
  return pool;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;

  if (filename.includes("/") || filename.includes("\\") || filename.includes("..")) {
    return new NextResponse("Invalid filename", { status: 400 });
  }

  try {
    const db = getPool();
    const { rows } = await db.query(
      "SELECT data, mime_type FROM uploads WHERE filename = $1",
      [filename]
    );

    if (!rows.length) {
      return new NextResponse("Not found", { status: 404 });
    }

    return new NextResponse(rows[0].data, {
      headers: {
        "Content-Type": rows[0].mime_type,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;

  if (filename.includes("/") || filename.includes("\\") || filename.includes("..")) {
    return NextResponse.json({ error: "Invalid filename" }, { status: 400 });
  }

  try {
    const db = getPool();
    const { rowCount } = await db.query(
      "DELETE FROM uploads WHERE filename = $1",
      [filename]
    );
    if (!rowCount) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
