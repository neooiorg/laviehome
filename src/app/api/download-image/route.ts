import { NextRequest, NextResponse } from "next/server";

const FALLBACK_FILENAME = "lavie-home-room.jpg";

function filenameFromUrl(url: URL) {
  const name = decodeURIComponent(url.pathname.split("/").filter(Boolean).pop() ?? "");
  return name.includes(".") ? name : FALLBACK_FILENAME;
}

function resolveImageUrl(req: NextRequest) {
  const src = req.nextUrl.searchParams.get("src");

  if (!src) {
    return null;
  }

  if (src.startsWith("/")) {
    return new URL(src, req.nextUrl.origin);
  }

  try {
    const url = new URL(src);
    return url.protocol === "http:" || url.protocol === "https:" ? url : null;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const imageUrl = resolveImageUrl(req);

  if (!imageUrl) {
    return NextResponse.json({ error: "Invalid image URL" }, { status: 400 });
  }

  try {
    const response = await fetch(imageUrl, { cache: "no-store" });
    const contentType = response.headers.get("content-type") ?? "application/octet-stream";

    if (!response.ok || !contentType.startsWith("image/")) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    const body = await response.arrayBuffer();

    return new NextResponse(body, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filenameFromUrl(imageUrl)}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return NextResponse.json({ error: "Download failed" }, { status: 500 });
  }
}
