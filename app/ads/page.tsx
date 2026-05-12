import { Suspense } from "react";
import { CommandShell, PageSection } from "../components/CommandShell";
import { Attribution } from "../components/Attribution";

export const revalidate = 60;
export const dynamic = "force-dynamic";

function Skeleton() {
  return <div className="h-96 animate-pulse rounded-lg border border-white/10 bg-white/5" />;
}

export default function AdsPage() {
  return (
    <CommandShell
      active="ads"
      eyebrow="Ads"
      title="Know which ads are worth more money."
      subtitle="See known ad sources, campaign names, sign-ups, deals, and cash without mixing in missing-source revenue."
    >
      <PageSection label="Ad results" title="Known ad attribution">
        <Suspense fallback={<Skeleton />}>
          <Attribution />
        </Suspense>
      </PageSection>
    </CommandShell>
  );
}
