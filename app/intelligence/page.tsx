import { Suspense } from "react";
import { CommandShell, PageSection } from "../components/CommandShell";
import { DateRangeControls } from "../components/DateRangeControls";
import { WeeklyIntelligence } from "../components/WeeklyIntelligence";
import { FunnelDiagram } from "../components/FunnelDiagram";
import { KpiTrend } from "../components/KpiTrend";
import { resolveDateRange } from "@/lib/date-range";

export const revalidate = 60;
export const dynamic = "force-dynamic";

function Skeleton({ height = "h-64" }: { height?: string }) {
  return <div className={`animate-pulse rounded-lg border border-white/10 bg-white/5 ${height}`} />;
}

export default async function IntelligencePage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = searchParams ? await searchParams : {};
  const range = resolveDateRange(params);

  return (
    <CommandShell
      active="intelligence"
      eyebrow="Intelligence"
      title="Know the leak. Fix the next move."
      subtitle="Commander turns the funnel numbers into a simple weekly recommendation."
    >
      <DateRangeControls range={range} basePath="/intelligence" compact />

      <PageSection label="Closed loop" title="Weekly recommendation">
        <Suspense fallback={<Skeleton />}>
          <WeeklyIntelligence range={range} />
        </Suspense>
      </PageSection>

      <PageSection label="Funnel map" title="Where the money is moving">
        <Suspense fallback={<Skeleton height="h-96" />}>
          <FunnelDiagram range={range} />
        </Suspense>
      </PageSection>

      <PageSection label="Trend" title="Daily proof">
        <Suspense fallback={<Skeleton height="h-96" />}>
          <KpiTrend range={range} />
        </Suspense>
      </PageSection>
    </CommandShell>
  );
}
