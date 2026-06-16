import { Suspense } from "react";
import { CommandShell, PageSection } from "../components/CommandShell";
import { DateRangeControls } from "../components/DateRangeControls";
import { CallQueue } from "../components/CallQueue";
import { resolveDateRange } from "@/lib/date-range";

export const revalidate = 60;
export const dynamic = "force-dynamic";

function Skeleton() {
  return <div className="h-96 animate-pulse rounded-lg border border-white/10 bg-white/5" />;
}

export default async function CallsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = searchParams ? await searchParams : {};
  const range = resolveDateRange(params);

  return (
    <CommandShell
      active="calls"
      eyebrow="Calls"
      title="Work the human follow-up queue."
      subtitle="Only urgent buying signals belong at the top. Lower-priority no-answer and nurture leads stay separated."
    >
      <div className="grid grid-cols-1 gap-5">
        <DateRangeControls range={range} basePath="/calls" compact />

        <PageSection label="Follow-up" title="Hot handoffs vs nurture">
          <Suspense fallback={<Skeleton />}>
            <CallQueue range={range} />
          </Suspense>
        </PageSection>
      </div>
    </CommandShell>
  );
}
