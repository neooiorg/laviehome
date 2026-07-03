import Link from "next/link";

import { ExternalLink } from "lucide-react";

import { Button } from "@/components/ui/button";
import PageContainer from "@/components/layout/page-container";

export default function Page() {
  return (
    <PageContainer pageTitle="Chat" pageDescription="Xem trước màn hình chat. Mở trong tab mới để trải nghiệm đầy đủ.">
      <div className="flex flex-1 flex-col gap-2">
        <div className="flex justify-end">
          <Button asChild variant="ghost" size="sm">
            <Link href="/chat" target="_blank" rel="noreferrer">
              <ExternalLink className="mr-1.5 size-3.5" />
              Mở tab mới
            </Link>
          </Button>
        </div>
        <iframe src="/chat" title="Chat preview" className="min-h-[600px] flex-1 rounded-lg border bg-background" />
      </div>
    </PageContainer>
  );
}
