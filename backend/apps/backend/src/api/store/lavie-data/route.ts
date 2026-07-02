import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);

  try {
    // 1. Fetch Sales Channels (Branches)
    const { data: salesChannels } = await query.graph({
      entity: "sales_channel",
      fields: ["id", "name", "description", "is_disabled", "metadata"]
    });

    // Filter out Medusa's Default Sales Channel and keep only our branches
    const branches = salesChannels
      .filter((sc: any) => sc.metadata?.branch_id !== undefined)
      .map((channel: any) => ({
        id: Number(channel.metadata?.branch_id ?? 0),
        name: (channel.name || "").replace("Branch: ", ""),
        active: channel.is_disabled ? 0 : 1,
        hotline: channel.metadata?.hotline ?? "",
        google_maps_link: channel.metadata?.google_maps_link ?? "",
        classic_booking_enabled: Number(channel.metadata?.classic_booking_enabled ?? 0)
      }))
      .sort((a: any, b: any) => a.id - b.id);

    // 2. Fetch Products (Rooms)
    const { data: products } = await query.graph({
      entity: "product",
      fields: ["id", "title", "handle", "status", "description", "thumbnail", "images.url", "metadata", "variants.prices.amount", "created_at"]
    });

    const rooms = products
      .filter((p: any) => p.metadata?.room_id !== undefined && p.status === "published")
      .map((product: any) => ({
        id: Number(product.metadata?.room_id ?? 0),
        branch_id: Number(product.metadata?.branch_id ?? 0),
        card_name: product.title,
        branch_name: product.metadata?.branch_name ?? "",
        room_amenities: product.metadata?.room_amenities ?? [],
        price_from: Number(product.variants?.[0]?.prices?.[0]?.amount ?? 0),
        price_to: Number(product.metadata?.price_to ?? 0),
        full_day_price: Number(product.metadata?.full_day_price ?? 0),
        main_image: product.thumbnail ?? "",
        is_classic: Number(product.metadata?.is_classic ?? 0),
        images: product.images?.map((img: any) => img.url) ?? [],
        created_at: product.created_at ?? ""
      }))
      .sort((a: any, b: any) => b.created_at.localeCompare(a.created_at));

    res.status(200).json({ branches, rooms });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}
