import PageContainer from "@/components/layout/page-container";
import { getDiscountCodes } from "@/lib/homestay-dashboard";

import { DiscountsClient } from "./_components/discounts-client";

export default async function Page() {
  const codes = await getDiscountCodes();
  return (
    <PageContainer>
      <DiscountsClient codes={codes} />
    </PageContainer>
  );
}
