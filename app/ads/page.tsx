import { Suspense } from "react";
import { CommandShell, PageSection } from "../components/CommandShell";
import { DateRangeControls } from "../components/DateRangeControls";
import { Attribution } from "../components/Attribution";
import { resolveDateRange } from "@/lib/date-range";

export const revalidate = 60;
export const dynamic = "force-dynamic";

function Skeleton() {
  return <div className="h-96 animate-pulse rounded-lg border border-white/10 bg-white/5" />;
}

export default async function AdsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = searchParams ? await searchParams : {};
  const range = resolveDateRange(params);

  return (
    <CommandShell
      active="ads"
      eyebrow="Ads"
      title="Know which ads are worth more money."
      subtitle="See known ad sources, campaign names, sign-ups, deals, and cash without mixing in missing-source revenue."
    >
      <div className="grid grid-cols-1 gap-5">
        <DateRangeControls range={range} basePath="/ads" compact />

        <PageSection label="Ad results" title="Known ad attribution">
          <Suspense fallback={<Skeleton />}>
            <Attribution range={range} />
          </Suspense>
        </PageSection>
      </div>
    </CommandShell>
  );
}
