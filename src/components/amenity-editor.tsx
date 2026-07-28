"use client";

import * as React from "react";
import { ChevronDown, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  AMENITY_ICONS,
  amenityIconByKey,
  autoIconKey,
  effectiveIconKey,
  formatAmenity,
  parseAmenity,
} from "@/lib/amenity-icons";

function IconPickerPopover({
  selectedKey,
  onSelect,
  trigger,
}: {
  selectedKey: string;
  onSelect: (key: string) => void;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent align="start" className="w-64">
        <p className="mb-1 px-0.5 text-xs font-medium text-muted-foreground">Chọn icon</p>
        <div className="grid grid-cols-5 gap-1">
          {AMENITY_ICONS.map(({ key, label, Icon }) => (
            <button
              key={key}
              type="button"
              title={label}
              onClick={() => {
                onSelect(key);
                setOpen(false);
              }}
              className={cn(
                "flex items-center justify-center rounded-md p-2 text-foreground/80 transition-colors hover:bg-foreground/10",
                selectedKey === key && "bg-primary/15 text-primary ring-1 ring-primary/40"
              )}
            >
              <Icon className="size-4" />
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function AmenityEditor({
  value,
  onChange,
}: {
  value: string[];
  onChange: (next: string[]) => void;
}) {
  const [text, setText] = React.useState("");
  const [iconKey, setIconKey] = React.useState("check");
  const [userPickedIcon, setUserPickedIcon] = React.useState(false);

  // Auto-suggest an icon from the typed text until the user overrides it.
  React.useEffect(() => {
    if (!userPickedIcon) setIconKey(text.trim() ? autoIconKey(text) : "check");
  }, [text, userPickedIcon]);

  function add() {
    const t = text.trim();
    if (!t) return;
    onChange([...value, formatAmenity(iconKey, t)]);
    setText("");
    setIconKey("check");
    setUserPickedIcon(false);
  }

  function setChipIcon(index: number, key: string) {
    onChange(
      value.map((raw, i) => (i === index ? formatAmenity(key, parseAmenity(raw).text) : raw))
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-1.5">
        {value.length === 0 && (
          <span className="text-sm text-muted-foreground">Chưa có tiện ích nào.</span>
        )}
        {value.map((raw, i) => {
          const { text: label } = parseAmenity(raw);
          const ChipIcon = amenityIconByKey(effectiveIconKey(raw));
          return (
            <Badge key={i} variant="secondary" className="gap-1 py-1 pr-1 pl-1.5">
              <IconPickerPopover
                selectedKey={effectiveIconKey(raw)}
                onSelect={(key) => setChipIcon(i, key)}
                trigger={
                  <button
                    type="button"
                    title="Đổi icon"
                    className="inline-flex items-center rounded p-0.5 hover:bg-foreground/10"
                  >
                    <ChipIcon className="size-3.5" />
                  </button>
                }
              />
              <span>{label}</span>
              <button
                type="button"
                title="Xóa"
                onClick={() => onChange(value.filter((_, j) => j !== i))}
                className="inline-flex items-center rounded p-0.5 hover:bg-foreground/10"
              >
                <X className="size-3" />
              </button>
            </Badge>
          );
        })}
      </div>
      <div className="flex gap-2">
        <IconPickerPopover
          selectedKey={iconKey}
          onSelect={(key) => {
            setIconKey(key);
            setUserPickedIcon(true);
          }}
          trigger={
            <Button type="button" variant="outline" size="sm" className="shrink-0 gap-1 px-2">
              {React.createElement(amenityIconByKey(iconKey), { className: "size-4" })}
              <ChevronDown className="size-3 opacity-60" />
            </Button>
          }
        />
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Thêm tiện ích..."
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
        />
        <Button type="button" size="sm" variant="outline" onClick={add}>
          Thêm
        </Button>
      </div>
    </div>
  );
}
