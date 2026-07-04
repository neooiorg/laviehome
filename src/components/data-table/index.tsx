"use client";
"use no memo";

import type * as React from "react";
import { flexRender, type Table as TanstackTable } from "@tanstack/react-table";

import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { getCommonPinningStyles } from "@/lib/data-table";

interface DataTableProps<TData> extends React.ComponentProps<"div"> {
  table: TanstackTable<TData>;
  actionBar?: React.ReactNode;
  emptyMessage?: string;
  /** @deprecated use children instead */
  toolbar?: React.ReactNode;
}

export function DataTable<TData>({
  table,
  actionBar,
  emptyMessage = "Không có dữ liệu.",
  toolbar,
  children,
}: DataTableProps<TData>) {
  const content = children ?? toolbar;

  return (
    <div className="flex flex-1 flex-col gap-4">
      {content && <div className="px-4 pt-4">{content}</div>}

      <div className="overflow-hidden rounded-lg border mx-4">
        <ScrollArea className="w-full">
          <Table>
            <TableHeader className="bg-muted sticky top-0 z-10">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      colSpan={header.colSpan}
                      style={getCommonPinningStyles({ column: header.column })}
                      className="py-3 font-medium text-sm"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() ? "selected" : undefined}
                    className="border-border/60 hover:bg-muted/40"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        style={getCommonPinningStyles({ column: cell.column })}
                        className="py-3 align-middle"
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={table.getAllColumns().length}
                    className="h-24 text-center text-sm text-muted-foreground"
                  >
                    {emptyMessage}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>

      <div className="flex flex-col gap-2.5 px-4 pb-4">
        <DataTablePagination table={table} />
        {actionBar &&
          table.getFilteredSelectedRowModel().rows.length > 0 &&
          actionBar}
      </div>
    </div>
  );
}
