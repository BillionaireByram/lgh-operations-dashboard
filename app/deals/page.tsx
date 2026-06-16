import { Suspense } from "react";
import { CommandShell, PageSection } from "../components/CommandShell";
import { DateRangeControls } from "../components/DateRangeControls";
import { RecentDeals } from "../components/RecentDeals";
import { resolveDateRange } from "@/lib/date-range";

export const revalidate = 60;
export const dynamic = "force-dynamic";

function Skeleton() {
  return <div className="h-96 animate-pulse rounded-lg border border-white/10 bg-white/5" />;
}

export default async function DealsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = searchParams ? await searchParams : {};
  const range = resolveDateRange(params);

  return (
    <CommandShell
      active="deals"
      eyebrow="Deals"
      title="See the money Trevor won."
      subtitle="Review recent buyers, cash collected, and where each buyer came from."
    >
      <div className="grid grid-cols-1 gap-5">
        <DateRangeControls range={range} basePath="/deals" compact />

        <PageSection label="Money" title="Recent deals">
          <Suspense fallback={<Skeleton />}>
            <RecentDeals range={range} />
          </Suspense>
        </PageSection>
      </div>
    </CommandShell>
  );
}
