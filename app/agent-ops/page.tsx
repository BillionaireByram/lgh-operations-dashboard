import { CommandShell, PageSection } from "../components/CommandShell";
import { Pill } from "../components/Card";

export const revalidate = 60;
export const dynamic = "force-dynamic";

const commanderComputerUrl =
  "https://guarantees-federation-don-disciplinary.trycloudflare.com/";

export default function AgentOpsPage() {
  return (
    <CommandShell active="agentOps" eyebrow="Agent Ops" title="Commander Computer" showQuickActions={false}>
      <PageSection label="Live computer" title="Commander">
        <section className="overflow-hidden rounded-lg border border-white/10 bg-black/40 shadow-[0_20px_80px_rgba(0,0,0,0.32)]">
          <div className="flex items-center justify-between gap-3 border-b border-white/10 bg-white/[0.04] px-4 py-3">
            <div className="min-w-0">
              <div className="text-sm font-black text-white">Commander</div>
              <div className="mt-0.5 text-xs font-semibold text-white/42">Managed by DigitalFlo Server HQ</div>
            </div>
            <div className="flex items-center gap-2">
              <Pill tone="good">Live</Pill>
              <a
                href={commanderComputerUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-md border border-white/12 bg-white/[0.06] px-3 py-1.5 text-xs font-bold text-white/78 no-underline hover:bg-white/[0.1]"
              >
                Open computer
              </a>
            </div>
          </div>

          <div className="aspect-video min-h-[360px] bg-black">
            <iframe
              title="Commander live computer"
              src={commanderComputerUrl}
              className="h-full w-full border-0"
              allow="clipboard-read; clipboard-write; fullscreen"
            />
          </div>
        </section>
      </PageSection>
    </CommandShell>
  );
}
