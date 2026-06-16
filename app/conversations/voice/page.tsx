import { Suspense } from "react";
import { CommandShell, PageSection } from "../../components/CommandShell";
import { DateRangeControls } from "../../components/DateRangeControls";
import { VoiceConversationCenter } from "../../components/ConversationCenter";
import { resolveDateRange } from "@/lib/date-range";

export const revalidate = 60;
export const dynamic = "force-dynamic";

function Skeleton() {
  return <div className="h-96 animate-pulse rounded-lg border border-white/10 bg-white/5" />;
}

export default async function VoiceConversationsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = searchParams ? await searchParams : {};
  const range = resolveDateRange(params);

  return (
    <CommandShell
      active="voice"
      eyebrow="Voice"
      title="Retell calls with booking truth."
      subtitle="Every voice call is visible here, with Retell booking signals separated from real calendar confirmation."
    >
      <div className="grid grid-cols-1 gap-5">
        <DateRangeControls range={range} basePath="/conversations/voice" compact />

        <PageSection label="Voice center" title="Calls, outcomes, and appointment proof">
          <Suspense fallback={<Skeleton />}>
            <VoiceConversationCenter range={range} />
          </Suspense>
        </PageSection>
      </div>
    </CommandShell>
  );
}
