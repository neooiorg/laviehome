import type { Column } from "@tanstack/react-table";
import type { CSSProperties } from "react";

export function getCommonPinningStyles<TData>({
  column,
}: {
  column: Column<TData>;
}): CSSProperties {
  const isPinned = column.getIsPinned();
  const isLastLeft = isPinned === "left" && column.getIsLastColumn("left");
  const isFirstRight = isPinned === "right" && column.getIsFirstColumn("right");

  return {
    boxShadow: isLastLeft
      ? "-4px 0 4px -4px hsl(var(--border)) inset"
      : isFirstRight
        ? "4px 0 4px -4px hsl(var(--border)) inset"
        : undefined,
    left: isPinned === "left" ? `${column.getStart("left")}px` : undefined,
    right: isPinned === "right" ? `${column.getAfter("right")}px` : undefined,
    opacity: isPinned ? 0.97 : 1,
    position: isPinned ? "sticky" : "relative",
    background: isPinned ? "hsl(var(--background))" : undefined,
    width: column.getSize(),
    zIndex: isPinned ? 1 : 0,
  };
}
