"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { BadgeCheck, Bell, Check, CreditCard, LogOut } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { cn, getInitials } from "@/lib/utils";
import { authClient } from "@/lib/auth-client";

export function AccountSwitcher({
  users,
}: {
  readonly users: ReadonlyArray<{
    readonly id: string;
    readonly name: string;
    readonly email: string;
    readonly avatar: string;
    readonly role: string;
  }>;
}) {
  const [activeUser, setActiveUser] = useState(users[0]);
  const router = useRouter();

  if (!activeUser) {
    return null;
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={activeUser.avatar || undefined} alt={activeUser.name} />
                <AvatarFallback className="rounded-lg">{getInitials(activeUser.name)}</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{activeUser.name}</span>
                <span className="truncate text-muted-foreground text-xs">{activeUser.email}</span>
              </div>
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side="bottom"
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={activeUser.avatar || undefined} alt={activeUser.name} />
                  <AvatarFallback className="rounded-lg">{getInitials(activeUser.name)}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{activeUser.name}</span>
                  <span className="truncate text-muted-foreground text-xs">{activeUser.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {users.length > 1 && (
              <>
                <DropdownMenuGroup>
                  {users.map((user) => (
                    <DropdownMenuItem
                      key={user.email}
                      className={cn("p-0", user.id === activeUser.id && "bg-accent/50")}
                      aria-current={user.id === activeUser.id ? "true" : undefined}
                      onClick={() => setActiveUser(user)}
                    >
                      <div className="flex w-full items-center gap-2 px-1 py-1.5">
                        <Avatar className="size-8 rounded-lg">
                          <AvatarImage src={user.avatar || undefined} alt={user.name} />
                          <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                        </Avatar>
                        <div className="grid min-w-0 flex-1 text-left text-sm leading-tight">
                          <span className="truncate font-semibold">{user.name}</span>
                          <span className="truncate text-xs capitalize text-muted-foreground">{user.role}</span>
                        </div>
                        <span
                          className={cn(
                            "mr-1 flex size-4 items-center justify-center rounded-full text-primary opacity-0",
                            user.id === activeUser.id && "opacity-100",
                          )}
                        >
                          <Check className="size-3" aria-hidden="true" />
                        </span>
                      </div>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <BadgeCheck />
                Tài khoản
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Bell />
                Thông báo
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() =>
                authClient.signOut({
                  fetchOptions: { onSuccess: () => router.push("/auth/v2/login") },
                })
              }
            >
              <LogOut />
              Đăng xuất
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
