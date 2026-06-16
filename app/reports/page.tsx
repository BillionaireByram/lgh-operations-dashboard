import { Suspense } from "react";
import { CommandShell, PageSection } from "../components/CommandShell";
import { DateRangeControls } from "../components/DateRangeControls";
import { ReportForm } from "../components/ReportForm";
import { ReportSubmissionsOverview } from "../components/ReportSubmissionsOverview";
import { resolveDateRange } from "@/lib/date-range";
import { fromView, TeamMember } from "@/lib/supabase";

export const revalidate = 60;
export const dynamic = "force-dynamic";

function Skeleton({ height = "h-64" }: { height?: string }) {
  return <div className={`animate-pulse rounded-lg border border-white/10 bg-white/5 ${height}`} />;
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = searchParams ? await searchParams : {};
  const range = resolveDateRange(params);
  const team = await fromView<TeamMember>("team_members", {
    query: { order: "name.asc" },
    revalidate: 0,
  });

  return (
    <CommandShell
      active="reports"
      eyebrow="Reports"
      title="Submit the team numbers."
      subtitle="Submit reports, review what was already entered, and spot who is missing for the week or month."
    >
      <div className="grid grid-cols-1 gap-5">
        <DateRangeControls range={range} basePath="/reports" compact />

        <PageSection label="Team reports" title="Add or update numbers">
          <ReportForm team={team} />
        </PageSection>

        <PageSection label="Overview" title="Submitted reports">
          <Suspense fallback={<Skeleton height="h-96" />}>
            <ReportSubmissionsOverview range={range} team={team} />
          </Suspense>
        </PageSection>
      </div>
    </CommandShell>
  );
}
