import { Suspense } from "react";
import { CommandShell, PageSection } from "../../components/CommandShell";
import { MessageConversationCenter } from "../../components/ConversationCenter";

export const revalidate = 60;
export const dynamic = "force-dynamic";

function Skeleton() {
  return <div className="h-96 animate-pulse rounded-lg border border-white/10 bg-white/5" />;
}

export default function MessageConversationsPage() {
  return (
    <CommandShell
      active="messages"
      eyebrow="Messages"
      title="See every SMS and DM thread."
      subtitle="Back-and-forth conversations grouped by contact and channel, ready for SMS now and DM expansion next."
    >
      <PageSection label="Message center" title="Conversation threads by channel">
        <Suspense fallback={<Skeleton />}>
          <MessageConversationCenter />
        </Suspense>
      </PageSection>
    </CommandShell>
  );
}
