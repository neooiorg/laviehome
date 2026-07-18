"use client";

import { useShallow } from "zustand/react/shallow";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { sidebarItems } from "@/navigation/sidebar/sidebar-items";
import { usePreferencesStore } from "@/stores/preferences/preferences-provider";
import { authClient } from "@/lib/auth-client";

import { NavMain } from "./nav-main";
import { OrgSwitcher } from "./org-switcher";
import { AccountSwitcher } from "./account-switcher";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: session } = authClient.useSession();
  const { sidebarVariant, sidebarCollapsible, isSynced } = usePreferencesStore(
    useShallow((s) => ({
      sidebarVariant: s.values.sidebar_variant,
      sidebarCollapsible: s.values.sidebar_collapsible,
      isSynced: s.isSynced,
    })),
  );

  const variant = isSynced ? sidebarVariant : props.variant;
  const collapsible = isSynced ? sidebarCollapsible : props.collapsible;

  const sessionUser = session?.user as
    | { id: string; name?: string | null; email?: string; image?: string | null; role?: string }
    | undefined;

  const currentUser = {
    id: sessionUser?.id ?? "",
    name: sessionUser?.name?.trim() || sessionUser?.email || "Tài khoản",
    email: sessionUser?.email ?? "",
    avatar: sessionUser?.image ?? "",
    role: sessionUser?.role ?? "member",
  };

  return (
    <Sidebar {...props} variant={variant} collapsible={collapsible}>
      <SidebarHeader>
        <OrgSwitcher />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={sidebarItems} />
      </SidebarContent>
      <SidebarFooter>
        <AccountSwitcher users={[currentUser]} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
