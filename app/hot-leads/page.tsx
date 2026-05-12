import { Card, Pill } from "../components/Card";
import { Nav } from "../components/Nav";
import { fromView, CallQueueRow } from "@/lib/supabase";

export const revalidate = 60;
export const dynamic = "force-dynamic";

const fmtMoney = (n: number | null | undefined) =>
  n == null ? "—" : `$${Number(n).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

function ago(iso: string | null) {
  if (!iso) return "—";
  const ms = Date.now() - new Date(iso).getTime();
  const min = Math.round(ms / 60_000);
  if (min < 60) return `${min}m`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h`;
  return `${Math.round(hr / 24)}d`;
}

export default async function HotLeadsPage() {
  const rows = await fromView<CallQueueRow>("v_call_queue", {
    query: { order: "priority.asc,registered_at.desc", limit: "100" },
  });

  const fireNow = rows.filter((r) => r.next_action === "fire_hot_closer");
  const fireSoon = rows.filter((r) => r.next_action !== "fire_hot_closer" && r.priority <= 2);
  const monitor = rows.filter((r) => !fireNow.includes(r) && !fireSoon.includes(r));

  return (
    <main className="min-h-screen bg-neutral-950 text-white px-6 py-6 lg:px-10">
      <Nav />
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Hot Leads</h1>
        <p className="text-sm text-white/50">
          {fireNow.length} fire now · {fireSoon.length} fire soon · {monitor.length} monitor
        </p>
      </header>

      <div className="grid grid-cols-1 gap-6">
        <Section title="Fire now (post-webinar 75%+ watch, no call yet)" tone="bad" rows={fireNow} />
        <Section title="Fire soon (high intent or hot watch)" tone="warn" rows={fireSoon} />
        <Section title="Monitor" tone="neutral" rows={monitor} />
      </div>
    </main>
  );
}

function Section({ title, tone, rows }: { title: string; tone: "bad" | "warn" | "neutral"; rows: CallQueueRow[] }) {
  return (
    <Card title={title} subtitle={`${rows.length} leads`}>
      {rows.length === 0 ? (
        <div className="text-sm text-white/40 py-4 text-center">Empty.</div>
      ) : (
        <div className="overflow-x-auto -mx-2">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-white/50 uppercase text-xs tracking-wide">
                <th className="px-2 py-2">Lead</th>
                <th className="px-2 py-2">Phone</th>
                <th className="px-2 py-2">Source</th>
                <th className="px-2 py-2 text-right">Watch</th>
                <th className="px-2 py-2 text-right">Score</th>
                <th className="px-2 py-2">Last call</th>
                <th className="px-2 py-2">Action</th>
                <th className="px-2 py-2">Reg'd</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {rows.map((r) => (
                <tr key={r.registration_id} className="tabular-nums hover:bg-white/5">
                  <td className="px-2 py-1.5">{r.name || r.email || "—"}</td>
                  <td className="px-2 py-1.5 text-white/70">{r.phone ?? "—"}</td>
                  <td className="px-2 py-1.5 text-white/70">{r.utm_source ?? "—"}</td>
                  <td className="px-2 py-1.5 text-right">{r.watch_minutes ?? 0}m</td>
                  <td className="px-2 py-1.5 text-right">{r.intent_score ?? "—"}</td>
                  <td className="px-2 py-1.5 text-white/70">{r.last_call_outcome ?? "—"}</td>
                  <td className="px-2 py-1.5">
                    <Pill tone={tone}>{r.next_action}</Pill>
                  </td>
                  <td className="px-2 py-1.5 text-white/40">{ago(r.registered_at)} ago</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
