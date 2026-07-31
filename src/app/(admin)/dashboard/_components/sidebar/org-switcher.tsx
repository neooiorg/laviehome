"use client";

import { useState } from "react";

import { ChevronsUpDown } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { APP_CONFIG } from "@/config/app-config";
import { cn, getInitials } from "@/lib/utils";

export interface Organization {
  id: string;
  name: string;
  logo?: string;
  plan?: string;
}

export function OrgSwitcher({ orgs }: { orgs?: Organization[] }) {
  const defaultOrgs: Organization[] = orgs || [
    {
      id: "1",
      name: APP_CONFIG.name,
      logo: "/lavie-icon.png",
      plan: "Admin",
    },
  ];

  const [activeOrg, setActiveOrg] = useState(defaultOrgs[0]);

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="size-8 shrink-0 rounded-lg">
                <AvatarImage src={activeOrg.logo} alt={activeOrg.name} className="object-cover" />
                <AvatarFallback className="rounded-lg bg-sidebar-primary text-sidebar-primary-foreground text-xs">
                  {getInitials(activeOrg.name)}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{activeOrg.name}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {activeOrg.plan || "Organization"}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            align="start"
            side="bottom"
            sideOffset={4}
          >
            <DropdownMenuGroup>
              {defaultOrgs.map((org) => (
                <DropdownMenuItem
                  key={org.id}
                  onClick={() => setActiveOrg(org)}
                  className={cn(
                    "cursor-pointer",
                    org.id === activeOrg.id && "bg-accent"
                  )}
                >
                  <Avatar className="mr-2 size-8 rounded-lg">
                    <AvatarImage
                      src={org.logo}
                      alt={org.name}
                      className="object-cover"
                    />
                    <AvatarFallback className="rounded-lg bg-sidebar-primary text-sidebar-primary-foreground text-xs">
                      {getInitials(org.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-1 flex-col">
                    <span className="text-sm font-medium">{org.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {org.plan}
                    </span>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
