import { readdir, stat } from "fs/promises";
import path from "path";
import { MediaClient } from "./_components/media-client";

export const dynamic = "force-dynamic";

export default async function MediaPage() {
  const uploadsDir = path.join(process.cwd(), "public", "uploads");

  let files: { name: string; url: string; size: number; createdAt: string }[] = [];

  try {
    const entries = await readdir(uploadsDir);
    const imageEntries = entries.filter((f) => !f.startsWith("."));

    files = await Promise.all(
      imageEntries.map(async (name) => {
        const info = await stat(path.join(uploadsDir, name));
        return {
          name,
          url: `/api/upload/${name}`,
          size: info.size,
          createdAt: info.birthtime.toISOString(),
        };
      })
    );

    files.sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1));
  } catch {
    // uploads dir doesn't exist yet — show empty state
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Thư viện ảnh</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {files.length} ảnh đã upload
        </p>
      </div>
      <MediaClient files={files} />
    </div>
  );
}
