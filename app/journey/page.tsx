import { Card, Pill } from "../components/Card";
import { Nav } from "../components/Nav";
import { fromView, FunnelJourneyRow } from "@/lib/supabase";

export const revalidate = 60;
export const dynamic = "force-dynamic";

const fmtMoney = (n: number | null | undefined) =>
  n == null ? "—" : `$${Number(n).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

const stageTone: Record<string, "good" | "warn" | "bad" | "info" | "neutral"> = {
  "6_closed": "good",
  "5_booked": "info",
  "4_called": "warn",
  "3_attended": "warn",
  "2_registered": "neutral",
};

export default async function JourneyPage() {
  const rows = await fromView<FunnelJourneyRow>("v_funnel_journey", {
    query: { order: "registered_at.desc", limit: "200" },
  });

  // Aggregate by stage
  const stages = rows.reduce<Record<string, number>>((acc, r) => {
    acc[r.funnel_stage] = (acc[r.funnel_stage] || 0) + 1;
    return acc;
  }, {});
  const stageOrder = ["2_registered", "3_attended", "4_called", "5_booked", "6_closed"];

  return (
    <main className="min-h-screen bg-neutral-950 text-white px-6 py-6 lg:px-10">
      <Nav />
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Funnel Journey</h1>
        <p className="text-sm text-white/50">Last 200 registrations · per-contact path</p>
      </header>

      <Card title="Stage breakdown" subtitle="Where leads are stuck">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {stageOrder.map((s) => (
            <div key={s} className="rounded-lg bg-white/5 p-3">
              <div className="text-xs text-white/50 uppercase tracking-wide">{s.split("_").slice(1).join(" ")}</div>
              <div className="text-2xl font-semibold tabular-nums">{stages[s] ?? 0}</div>
            </div>
          ))}
        </div>
      </Card>

      <div className="mt-6">
        <Card title="Registrations" subtitle="Click utm_source to filter via URL params later">
          <div className="overflow-x-auto -mx-2">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-white/50 uppercase text-xs tracking-wide">
                  <th className="px-2 py-2">Reg'd</th>
                  <th className="px-2 py-2">Lead</th>
                  <th className="px-2 py-2">Source</th>
                  <th className="px-2 py-2">Campaign</th>
                  <th className="px-2 py-2 text-right">Attendance</th>
                  <th className="px-2 py-2 text-right">Score</th>
                  <th className="px-2 py-2">Last call</th>
                  <th className="px-2 py-2">Stage</th>
                  <th className="px-2 py-2 text-right">Deal $</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-2 py-6 text-center text-white/40">
                      No data yet.
                    </td>
                  </tr>
                ) : (
                  rows.map((r) => (
                    <tr key={r.registration_id} className="tabular-nums hover:bg-white/5">
                      <td className="px-2 py-1.5 text-white/60 whitespace-nowrap">
                        {new Date(r.registered_at).toLocaleDateString()}
                      </td>
                      <td className="px-2 py-1.5">{r.name || r.email || r.phone || "—"}</td>
                      <td className="px-2 py-1.5 text-white/70">{r.utm_source ?? <span className="text-amber-400">—</span>}</td>
                      <td className="px-2 py-1.5 text-white/70 truncate max-w-[180px]">{r.utm_campaign ?? "—"}</td>
                      <td className="px-2 py-1.5 text-right">{r.attended ? "Attended" : "Not yet"}</td>
                      <td className="px-2 py-1.5 text-right">{r.intent_score ?? "—"}</td>
                      <td className="px-2 py-1.5 text-white/70">{r.last_call_outcome ?? "—"}</td>
                      <td className="px-2 py-1.5">
                        <Pill tone={stageTone[r.funnel_stage] ?? "neutral"}>{r.funnel_stage}</Pill>
                      </td>
                      <td className="px-2 py-1.5 text-right">{fmtMoney(r.deal_amount)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </main>
  );
}
