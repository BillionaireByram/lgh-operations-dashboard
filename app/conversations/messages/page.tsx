import { Suspense } from "react";
import { CommandShell, PageSection } from "../../components/CommandShell";
import { DateRangeControls } from "../../components/DateRangeControls";
import { MessageConversationCenter } from "../../components/ConversationCenter";
import { resolveDateRange } from "@/lib/date-range";

export const revalidate = 60;
export const dynamic = "force-dynamic";

function Skeleton() {
  return <div className="h-96 animate-pulse rounded-lg border border-white/10 bg-white/5" />;
}

export default async function MessageConversationsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = searchParams ? await searchParams : {};
  const range = resolveDateRange(params);

  return (
    <CommandShell
      active="messages"
      eyebrow="Messages"
      title="See every SMS and DM thread."
      subtitle="Back-and-forth conversations grouped by contact and channel, ready for SMS now and DM expansion next."
    >
      <div className="grid grid-cols-1 gap-5">
        <DateRangeControls range={range} basePath="/conversations/messages" compact />

        <PageSection label="Message center" title="Conversation threads by channel">
          <Suspense fallback={<Skeleton />}>
            <MessageConversationCenter range={range} />
          </Suspense>
        </PageSection>
      </div>
    </CommandShell>
  );
}
