"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";

interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;
  title?: string;
  description?: string;
}

export function AlertModal({
  isOpen,
  onClose,
  onConfirm,
  loading = false,
  title = "Bạn có chắc không?",
  description = "Hành động này không thể hoàn tác.",
}: AlertModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <Modal title={title} description={description} isOpen={isOpen} onClose={onClose}>
      <div className="flex w-full items-center justify-end gap-2 pt-6">
        <Button disabled={loading} variant="outline" onClick={onClose}>
          Hủy
        </Button>
        <Button disabled={loading} variant="destructive" onClick={onConfirm}>
          {loading ? "Đang xử lý..." : "Xác nhận"}
        </Button>
      </div>
    </Modal>
  );
}
