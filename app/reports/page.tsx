import { CommandShell, PageSection } from "../components/CommandShell";
import { ReportForm } from "../components/ReportForm";
import { fromView, TeamMember } from "@/lib/supabase";

export const revalidate = 60;
export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const team = await fromView<TeamMember>("team_members", {
    query: { order: "name.asc" },
  });

  return (
    <CommandShell
      active="reports"
      eyebrow="Reports"
      title="Submit the team numbers."
      subtitle="Setters, closers, credit, fulfillment, and ops can add their daily report here."
    >
      <PageSection label="Team reports" title="Add today&apos;s numbers">
        <ReportForm team={team} />
      </PageSection>
    </CommandShell>
  );
}
