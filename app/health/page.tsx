import { Suspense } from "react";
import { CommandShell, PageSection } from "../components/CommandShell";
import { DateRangeControls } from "../components/DateRangeControls";
import { HealthBar } from "../components/HealthBar";
import { resolveDateRange } from "@/lib/date-range";

export const revalidate = 60;
export const dynamic = "force-dynamic";

function Skeleton() {
  return <div className="h-40 animate-pulse rounded-lg border border-white/10 bg-white/5" />;
}

export default async function HealthPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = searchParams ? await searchParams : {};
  const range = resolveDateRange(params);

  return (
    <CommandShell
      active="health"
      eyebrow="Health"
      title="Know what is working and what needs a fix."
      subtitle="This page shows if the important data is still coming in."
    >
      <div className="grid grid-cols-1 gap-5">
        <DateRangeControls range={range} basePath="/health" compact />

        <PageSection label="Status" title="Data check">
          <Suspense fallback={<Skeleton />}>
            <HealthBar />
          </Suspense>
        </PageSection>
      </div>
    </CommandShell>
  );
}
