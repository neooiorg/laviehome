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

  const currentUser = {
    id: session?.user?.id ?? "1",
    name: session?.user?.name ?? "Admin User",
    email: session?.user?.email ?? "admin@laviehome.vn",
    avatar: session?.user?.image ?? "",
    role: "admin",
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
