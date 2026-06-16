import { Suspense } from "react";
import { CommandShell, PageSection } from "../components/CommandShell";
import { KpiTrend } from "../components/KpiTrend";
import { DateRangeControls } from "../components/DateRangeControls";
import { FunnelDiagram } from "../components/FunnelDiagram";
import { resolveDateRange } from "@/lib/date-range";

export const revalidate = 60;
export const dynamic = "force-dynamic";

function Skeleton() {
  return <div className="h-96 animate-pulse rounded-lg border border-white/10 bg-white/5" />;
}

export default async function FunnelPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = searchParams ? await searchParams : {};
  const range = resolveDateRange(params);

  return (
    <CommandShell
      active="intelligence"
      eyebrow="Funnel"
      title="See the path from lead to deal."
      subtitle="Know how many people signed up, got called, booked a call, and bought."
    >
      <DateRangeControls range={range} basePath="/funnel" compact />

      <PageSection label="Funnel map" title="How leads move to money">
        <Suspense fallback={<Skeleton />}>
          <FunnelDiagram range={range} />
        </Suspense>
      </PageSection>

      <PageSection label="Daily numbers" title="Ads, leads, calls, and sales">
        <Suspense fallback={<Skeleton />}>
          <KpiTrend range={range} />
        </Suspense>
      </PageSection>
    </CommandShell>
  );
}
