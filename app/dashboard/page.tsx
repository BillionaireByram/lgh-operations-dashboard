import { Suspense } from "react";
import { CommandShell, greeting, PageSection } from "../components/CommandShell";
import { TodayStrip } from "../components/TodayStrip";
import { KpiTrend } from "../components/KpiTrend";
import { HealthBar } from "../components/HealthBar";
import { DateRangeControls } from "../components/DateRangeControls";
import { RevenueOpsOverview } from "../components/RevenueOpsOverview";
import { HybridFunnelOverview } from "../components/HybridFunnelOverview";
import { resolveDateRange } from "@/lib/date-range";

export const revalidate = 60;
export const dynamic = "force-dynamic";

function Skeleton({ height = "h-32" }: { height?: string }) {
  return <div className={`rounded-lg border border-white/10 bg-white/5 ${height} animate-pulse`} />;
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = searchParams ? await searchParams : {};
  const range = resolveDateRange(params);

  return (
    <CommandShell
      active="dashboard"
      eyebrow="LGH"
      title={`${greeting()}, Trevor. Here is what matters today.`}
      subtitle="See new leads, calls, booked calls, deals, and cash without digging through tools."
    >
      <div className="grid grid-cols-1 gap-5">
        <DateRangeControls range={range} compact />

        <PageSection label="Scoreboard" title="Cash, deals, calls, and booked calls">
          <Suspense fallback={<Skeleton height="h-96" />}>
            <RevenueOpsOverview range={range} />
          </Suspense>
        </PageSection>

        <Suspense fallback={<Skeleton />}>
          <TodayStrip />
        </Suspense>

        <PageSection label="Hybrid VSL" title="Who needs to be pushed or booked">
          <Suspense fallback={<Skeleton height="h-96" />}>
            <HybridFunnelOverview range={range} />
          </Suspense>
        </PageSection>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="lgh-panel rounded-lg p-5">
            <div className="text-[0.72rem] font-extrabold uppercase tracking-[0.16em] text-white/42">Ads</div>
            <div className="mt-3 text-xl font-semibold">Know what brings leads</div>
            <p className="mt-2 text-sm leading-6 text-white/56">See which ads bring real sign-ups, not just clicks.</p>
          </div>
          <div className="lgh-panel rounded-lg p-5">
            <div className="text-[0.72rem] font-extrabold uppercase tracking-[0.16em] text-white/42">Follow-up</div>
            <div className="mt-3 text-xl font-semibold">Call the best leads first</div>
            <p className="mt-2 text-sm leading-6 text-white/56">Focus on people who clicked, booked, answered, or need a fast follow-up.</p>
          </div>
          <div className="lgh-panel rounded-lg p-5">
            <div className="text-[0.72rem] font-extrabold uppercase tracking-[0.16em] text-white/42">Revenue</div>
            <div className="mt-3 text-xl font-semibold">Know what made money</div>
            <p className="mt-2 text-sm leading-6 text-white/56">See the deals won and where the buyer came from.</p>
          </div>
        </div>

        <PageSection label="Status" title="What needs attention">
          <Suspense fallback={<Skeleton height="h-28" />}>
            <HealthBar />
          </Suspense>
        </PageSection>

        <PageSection label="Trend" title="Last 14 days">
          <Suspense fallback={<Skeleton height="h-96" />}>
            <KpiTrend range={range} />
          </Suspense>
        </PageSection>
      </div>
    </CommandShell>
  );
}
