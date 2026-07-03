import { getDiscountCodes } from "@/lib/homestay-dashboard";

import { DiscountsClient } from "./_components/discounts-client";

export default async function Page() {
  const codes = await getDiscountCodes();
  return <DiscountsClient codes={codes} />;
}
