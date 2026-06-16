import { Suspense } from "react";
import { CommandShell, PageSection } from "../components/CommandShell";
import { CallQueue } from "../components/CallQueue";

export const revalidate = 60;
export const dynamic = "force-dynamic";

function Skeleton() {
  return <div className="h-96 animate-pulse rounded-lg border border-white/10 bg-white/5" />;
}

export default function CallsPage() {
  return (
    <CommandShell
      active="calls"
      eyebrow="Calls"
      title="Work the human follow-up queue."
      subtitle="Only urgent buying signals belong at the top. Lower-priority no-answer and nurture leads stay separated."
    >
      <PageSection label="Follow-up" title="Hot handoffs vs nurture">
        <Suspense fallback={<Skeleton />}>
          <CallQueue />
        </Suspense>
      </PageSection>
    </CommandShell>
  );
}
