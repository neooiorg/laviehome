import { readFile, unlink } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";

const CONTENT_TYPES: Record<string, string> = {
  webp: "image/webp",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
};

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;

  if (filename.includes("/") || filename.includes("\\") || filename.includes("..")) {
    return new NextResponse("Invalid filename", { status: 400 });
  }

  const filepath = path.join(process.cwd(), "public", "uploads", filename);

  try {
    const buffer = await readFile(filepath);
    const ext = filename.split(".").pop()?.toLowerCase() ?? "";
    const contentType = CONTENT_TYPES[ext] ?? "application/octet-stream";
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
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

  // Prevent directory traversal
  if (filename.includes("/") || filename.includes("\\") || filename.includes("..")) {
    return NextResponse.json({ error: "Invalid filename" }, { status: 400 });
  }

  const filepath = path.join(process.cwd(), "public", "uploads", filename);

  try {
    await unlink(filepath);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}
