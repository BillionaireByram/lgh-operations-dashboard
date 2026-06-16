import { Suspense } from "react";
import { CommandShell, PageSection } from "../../components/CommandShell";
import { VoiceConversationCenter } from "../../components/ConversationCenter";

export const revalidate = 60;
export const dynamic = "force-dynamic";

function Skeleton() {
  return <div className="h-96 animate-pulse rounded-lg border border-white/10 bg-white/5" />;
}

export default function VoiceConversationsPage() {
  return (
    <CommandShell
      active="voice"
      eyebrow="Voice"
      title="Retell calls with booking truth."
      subtitle="Every voice call is visible here, with Retell booking signals separated from real calendar confirmation."
    >
      <PageSection label="Voice center" title="Calls, outcomes, and appointment proof">
        <Suspense fallback={<Skeleton />}>
          <VoiceConversationCenter />
        </Suspense>
      </PageSection>
    </CommandShell>
  );
}
