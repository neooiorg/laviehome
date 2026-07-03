import PageContainer from "@/components/layout/page-container";
import { getPublicBranches } from "@/lib/homestay-dashboard";

import { BranchesClient } from "./_components/branches-client";

export default async function Page() {
  const branches = await getPublicBranches();
  return (
    <PageContainer>
      <BranchesClient branches={branches} />
    </PageContainer>
  );
}
