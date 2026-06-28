import { defineRouteConfig } from "@medusajs/admin-sdk";
import { Channels } from "@medusajs/icons";
import { useEffect } from "react";

const SalesChannelsPage = () => {
  useEffect(() => {
    window.location.href = "/app/settings/sales-channels";
  }, []);

  return null;
};

export const config = defineRouteConfig({
  label: "Kênh bán hàng",
  icon: Channels,
});

export default SalesChannelsPage;
