import { Suspense } from "react";
import { CommandShell, PageSection } from "../components/CommandShell";
import { HealthBar } from "../components/HealthBar";

export const revalidate = 60;
export const dynamic = "force-dynamic";

function Skeleton() {
  return <div className="h-40 animate-pulse rounded-lg border border-white/10 bg-white/5" />;
}

export default function HealthPage() {
  return (
    <CommandShell
      active="health"
      eyebrow="Health"
      title="Know what is working and what needs a fix."
      subtitle="This page shows if the important data is still coming in."
    >
      <PageSection label="Status" title="Data check">
        <Suspense fallback={<Skeleton />}>
          <HealthBar />
        </Suspense>
      </PageSection>
    </CommandShell>
  );
}
