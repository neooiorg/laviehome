"use client";

import * as React from "react";
import Image from "next/image";
import { Copy, Trash2, Check, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ImageUpload } from "@/components/image-upload";

interface MediaFile {
  name: string;
  url: string;
  size: number;
  createdAt: string;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function MediaClient({ files }: { files: MediaFile[] }) {
  const router = useRouter();
  const [copied, setCopied] = React.useState<string | null>(null);
  const [deleting, setDeleting] = React.useState<string | null>(null);
  const [uploadOpen, setUploadOpen] = React.useState(false);
  const [uploadedUrls, setUploadedUrls] = React.useState<string[]>([]);

  async function handleCopy(url: string) {
    await navigator.clipboard.writeText(window.location.origin + url);
    setCopied(url);
    setTimeout(() => setCopied(null), 2000);
  }

  async function handleDelete(name: string) {
    if (!confirm(`Xóa ảnh "${name}"?`)) return;
    setDeleting(name);
    await fetch(`/api/upload/${name}`, { method: "DELETE" });
    setDeleting(null);
    router.refresh();
  }

  function handleUploadDone() {
    setUploadOpen(false);
    setUploadedUrls([]);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
          <DialogTrigger asChild>
            <Button>
              <Upload className="mr-2 size-4" />
              Upload ảnh mới
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Upload ảnh</DialogTitle>
            </DialogHeader>
            <ImageUpload value={uploadedUrls} onChange={setUploadedUrls} />
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setUploadOpen(false)}>Hủy</Button>
              <Button onClick={handleUploadDone} disabled={uploadedUrls.length === 0}>
                Xong
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {files.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-16 text-muted-foreground">
          <Upload className="mb-3 size-10 opacity-30" />
          <p className="text-sm">Chưa có ảnh nào. Hãy upload ảnh đầu tiên!</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {files.map((file) => (
            <div key={file.name} className="group relative flex flex-col overflow-hidden rounded-lg border bg-card">
              <div className="relative aspect-square bg-muted">
                <Image
                  src={file.url}
                  alt={file.name}
                  fill
                  className="object-cover"
                  sizes="200px"
                  unoptimized
                />
                <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 transition-opacity group-hover:opacity-100 bg-black/40">
                  <button
                    type="button"
                    onClick={() => handleCopy(file.url)}
                    className="rounded-full bg-white/90 p-2 hover:bg-white"
                    title="Copy URL"
                  >
                    {copied === file.url ? (
                      <Check className="size-4 text-green-600" />
                    ) : (
                      <Copy className="size-4" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(file.name)}
                    disabled={deleting === file.name}
                    className="rounded-full bg-white/90 p-2 hover:bg-white disabled:opacity-50"
                    title="Xóa"
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </button>
                </div>
              </div>
              <div className="px-2 py-1.5">
                <p className="truncate text-xs text-muted-foreground">{formatBytes(file.size)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
