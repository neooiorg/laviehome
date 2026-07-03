"use client";

import * as React from "react";

import { ExternalLink } from "lucide-react";

import { Switch } from "@/components/ui/switch";
import { TableCell, TableRow } from "@/components/ui/table";
import { toggleBranchActive, toggleBranchClassic } from "@/lib/branch-actions";

interface BranchRowData {
  id: number;
  name: string;
  active: number;
  hotline: string;
  google_maps_link: string;
  classic_booking_enabled: number;
}

export function BranchRow({ branch }: { branch: BranchRowData }) {
  const [active, setActive] = React.useState(branch.active === 1);
  const [classic, setClassic] = React.useState(branch.classic_booking_enabled === 1);

  async function handleActive(checked: boolean) {
    setActive(checked);
    await toggleBranchActive(branch.id, checked);
  }

  async function handleClassic(checked: boolean) {
    setClassic(checked);
    await toggleBranchClassic(branch.id, checked);
  }

  return (
    <TableRow>
      <TableCell className="font-medium">{branch.name}</TableCell>
      <TableCell>{branch.hotline}</TableCell>
      <TableCell>
        {branch.google_maps_link ? (
          <a
            href={branch.google_maps_link}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
          >
            Bản đồ <ExternalLink className="size-3" />
          </a>
        ) : (
          <span className="text-muted-foreground text-sm">—</span>
        )}
      </TableCell>
      <TableCell>
        <Switch checked={active} onCheckedChange={handleActive} aria-label="Bật/tắt chi nhánh" />
      </TableCell>
      <TableCell>
        <Switch checked={classic} onCheckedChange={handleClassic} aria-label="Bật/tắt booking classic" />
      </TableCell>
    </TableRow>
  );
}
