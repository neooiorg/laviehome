"use client";

import * as React from "react";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface TruncatedCellProps {
  /** The full text to display; also shown in the tooltip when truncated. */
  text: string;
  /**
   * Extra classes for the visible text. Pass a `max-w-[…]` to change how wide
   * the cell can grow before it truncates (default `max-w-[220px]`), plus any
   * font/colour utilities. Tailwind-merge resolves conflicts, last one wins.
   */
  className?: string;
}

/**
 * A data-table cell that truncates long text with an ellipsis and reveals the
 * full value in a shadcn tooltip — but only when the text is actually cut off,
 * so short values don't get a pointless tooltip. Prevents long strings from
 * blowing out the table layout.
 */
export function TruncatedCell({ text, className }: TruncatedCellProps) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const [isTruncated, setIsTruncated] = React.useState(false);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const check = () => setIsTruncated(el.scrollWidth > el.clientWidth + 1);
    check();

    const observer = new ResizeObserver(check);
    observer.observe(el);
    return () => observer.disconnect();
  }, [text]);

  const span = (
    <span ref={ref} className={cn("block max-w-[220px] truncate", className)}>
      {text}
    </span>
  );

  if (!isTruncated) return span;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{span}</TooltipTrigger>
      <TooltipContent className="max-w-sm break-words">{text}</TooltipContent>
    </Tooltip>
  );
}
