"use client";

import * as React from "react";
import { useDropzone } from "react-dropzone";
import { X, Upload, Loader2, ArrowLeft, ArrowRight } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { AlertModal } from "@/components/modal/alert-modal";

interface ImageUploadProps {
  value: string[];
  onChange: (urls: string[]) => void;
  maxFiles?: number;
  single?: boolean;
  className?: string;
}

export function ImageUpload({
  value,
  onChange,
  maxFiles = 10,
  single = false,
  className,
}: ImageUploadProps) {
  const [uploading, setUploading] = React.useState(false);
  const [pendingDeleteIndex, setPendingDeleteIndex] = React.useState<number | null>(null);

  async function uploadFile(file: File): Promise<string | null> {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    if (!res.ok) return null;
    const data = await res.json();
    return data.url as string;
  }

  const onDrop = React.useCallback(
    async (accepted: File[]) => {
      if (!accepted.length) return;

      const slots = single ? 1 : maxFiles - value.length;
      const files = accepted.slice(0, slots);
      if (!files.length) return;

      setUploading(true);
      const urls = await Promise.all(files.map(uploadFile));
      const valid = urls.filter(Boolean) as string[];

      if (single) {
        onChange(valid.slice(0, 1));
      } else {
        onChange([...value, ...valid]);
      }
      setUploading(false);
    },
    [value, onChange, single, maxFiles]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    maxFiles: single ? 1 : maxFiles,
    disabled: uploading || (single ? value.length > 0 : value.length >= maxFiles),
  });

  function remove(index: number) {
    onChange(value.filter((_, i) => i !== index));
    setPendingDeleteIndex(null);
  }

  function moveLeft(index: number) {
    if (index === 0) return;
    const next = [...value];
    [next[index - 1], next[index]] = [next[index], next[index - 1]];
    onChange(next);
  }

  function moveRight(index: number) {
    if (index === value.length - 1) return;
    const next = [...value];
    [next[index], next[index + 1]] = [next[index + 1], next[index]];
    onChange(next);
  }

  const canUploadMore = single ? value.length === 0 : value.length < maxFiles;

  return (
    <>
    <AlertModal
      isOpen={pendingDeleteIndex !== null}
      onClose={() => setPendingDeleteIndex(null)}
      onConfirm={() => pendingDeleteIndex !== null && remove(pendingDeleteIndex)}
      title="Xóa ảnh?"
      description="Ảnh này sẽ bị xóa khỏi danh sách. Bạn có chắc không?"
    />
    <div className={cn("flex flex-col gap-3", className)}>
      {value.length > 0 && (
        <div className={cn("grid gap-2", single ? "grid-cols-1" : "grid-cols-3 sm:grid-cols-4")}>
          {value.map((url, i) => (
            <div key={url + i} className="group relative aspect-square overflow-hidden rounded-lg border bg-muted">
              <Image
                src={url}
                alt={`Ảnh ${i + 1}`}
                fill
                className="object-cover"
                sizes="200px"
                unoptimized={url.startsWith("/api/upload/")}
              />
              <div className="absolute inset-0 flex items-start justify-between gap-1 p-1 opacity-0 transition-opacity group-hover:opacity-100 bg-black/20">
                {!single && (
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => moveLeft(i)}
                      disabled={i === 0}
                      className="rounded bg-white/80 p-0.5 text-xs disabled:opacity-30 hover:bg-white"
                    >
                      <ArrowLeft className="size-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveRight(i)}
                      disabled={i === value.length - 1}
                      className="rounded bg-white/80 p-0.5 text-xs disabled:opacity-30 hover:bg-white"
                    >
                      <ArrowRight className="size-3" />
                    </button>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setPendingDeleteIndex(i)}
                  className="ml-auto rounded bg-white/80 p-0.5 hover:bg-white"
                >
                  <X className="size-3 text-destructive" />
                </button>
              </div>
              {!single && i === 0 && (
                <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white">
                  Chính
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {canUploadMore && (
        <div
          {...getRootProps()}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 text-sm text-muted-foreground transition-colors",
            isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30",
            uploading && "pointer-events-none opacity-60"
          )}
        >
          <input {...getInputProps()} />
          {uploading ? (
            <>
              <Loader2 className="mb-2 size-6 animate-spin" />
              <span>Đang tải lên...</span>
            </>
          ) : (
            <>
              <Upload className="mb-2 size-6" />
              <span>{isDragActive ? "Thả ảnh vào đây" : "Kéo thả hoặc click để chọn ảnh"}</span>
              <span className="mt-1 text-xs">PNG, JPG, WebP — tối đa 5 MB</span>
            </>
          )}
        </div>
      )}
    </div>
    </>
  );
}
