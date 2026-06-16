import { Suspense } from "react";
import { CommandShell, PageSection } from "../components/CommandShell";
import { RecentDeals } from "../components/RecentDeals";

export const revalidate = 60;
export const dynamic = "force-dynamic";

function Skeleton() {
  return <div className="h-96 animate-pulse rounded-lg border border-white/10 bg-white/5" />;
}

export default function DealsPage() {
  return (
    <CommandShell
      active="deals"
      eyebrow="Deals"
      title="See the money Trevor won."
      subtitle="Review recent buyers, cash collected, and where each buyer came from."
    >
      <PageSection label="Money" title="Recent deals">
        <Suspense fallback={<Skeleton />}>
          <RecentDeals />
        </Suspense>
      </PageSection>
    </CommandShell>
  );
}
