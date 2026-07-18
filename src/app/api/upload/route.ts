import { randomUUID } from "crypto";
import sharp from "sharp";
import { NextResponse } from "next/server";
import { Pool } from "pg";

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

let pool: Pool | null = null;
function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.PGSSL === 'false' ? false : { rejectUnauthorized: false },
    });
  }
  return pool;
}

async function ensureTable(db: Pool) {
  await db.query(`
    CREATE TABLE IF NOT EXISTS uploads (
      filename  TEXT PRIMARY KEY,
      data      BYTEA NOT NULL,
      mime_type TEXT NOT NULL DEFAULT 'image/webp',
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
}

export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get("file");

  if (!(file instanceof Blob)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Only images are allowed" }, { status: 400 });
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "File exceeds 5 MB limit" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const filename = `${randomUUID()}.webp`;

  const processed = await sharp(buffer)
    .resize({ width: 1920, height: 1920, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 85 })
    .toBuffer();

  const db = getPool();
  await ensureTable(db);
  await db.query(
    `INSERT INTO uploads (filename, data, mime_type) VALUES ($1, $2, $3)
     ON CONFLICT (filename) DO UPDATE SET data = EXCLUDED.data`,
    [filename, processed, "image/webp"]
  );

  return NextResponse.json({ url: `/api/upload/${filename}` });
}
