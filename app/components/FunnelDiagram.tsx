import { DateRange } from "@/lib/date-range";
import { centralRangeQuery, getHybridMetrics } from "@/lib/hybrid-metrics";
import { fromView, KpiDay } from "@/lib/supabase";

const money = (value: number) => `$${Math.round(value).toLocaleString()}`;
const pct = (top: number, bottom: number) => (bottom > 0 ? `${((top / bottom) * 100).toFixed(1)}%` : "0.0%");

function Stage({
  label,
  value,
  sub,
  width,
  tone = "red",
}: {
  label: string;
  value: string | number;
  sub: string;
  width: number;
  tone?: "red" | "gold" | "green";
}) {
  const color =
    tone === "green"
      ? "from-emerald-500/80 to-emerald-400/35"
      : tone === "gold"
        ? "from-[var(--lgh-gold)]/85 to-[var(--lgh-gold)]/30"
        : "from-[var(--lgh-red)]/90 to-[var(--lgh-red)]/30";

  return (
    <div className="flex justify-center">
      <div
        className={`relative min-h-[86px] rounded-lg border border-white/12 bg-gradient-to-r ${color} px-5 py-4 shadow-[0_18px_50px_rgba(0,0,0,0.28)]`}
        style={{ width: `${width}%` }}
      >
        <div className="text-xs font-black uppercase tracking-[0.1em] text-white/68">{label}</div>
        <div className="mt-2 text-3xl font-semibold tabular-nums text-white">{value}</div>
        <div className="mt-1 text-sm text-white/65">{sub}</div>
      </div>
    </div>
  );
}

function FlowStep({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/18 p-4">
      <div className="text-sm font-extrabold uppercase tracking-[0.08em] text-white/78">{title}</div>
      <p className="mt-2 text-sm leading-6 text-white/52">{text}</p>
    </div>
  );
}

type Deal = {
  cash_collected: number | null;
  amount: number | null;
};

export async function FunnelDiagram({ range }: { range: DateRange }) {
  const { startIso, endIso } = centralRangeQuery(range);
  const [rows, hybrid, closedDeals] = await Promise.all([
    fromView<KpiDay>("v_kpi_daily", {
      query: { day: `gte.${range.start}`, and: `(day.lte.${range.end})`, order: "day.asc" },
    }),
    getHybridMetrics(range),
    fromView<Deal>("closed_deals", {
      query: { select: "cash_collected,amount", closed_at: `gte.${startIso}`, and: `(closed_at.lte.${endIso})` },
    }),
  ]);

  const spend = rows.reduce((sum, row) => sum + Number(row.ad_spend || 0), 0);
  const signups = hybrid.available ? hybrid.registered : rows.reduce((sum, row) => sum + Number(row.registrations || 0), 0);
  const attended = hybrid.available ? hybrid.reachedVcc : rows.reduce((sum, row) => sum + Number(row.attended || 0), 0);
  const calls = rows.reduce((sum, row) => sum + Number(row.calls || 0), 0);
  const booked = hybrid.available ? hybrid.bookedCalls : rows.reduce((sum, row) => sum + Number(row.booked || 0), 0);
  const deals = closedDeals.length || rows.reduce((sum, row) => sum + Number(row.deals || 0), 0);
  const revenue = closedDeals.length
    ? closedDeals.reduce((sum, row) => sum + Number(row.cash_collected || row.amount || 0), 0)
    : rows.reduce((sum, row) => sum + Number(row.revenue || 0), 0);
  const max = Math.max(signups, attended, calls, booked, deals, 1);

  const width = (value: number, floor = 34) => Math.max(floor, Math.round((value / max) * 100));

  return (
    <div className="space-y-5">
      <div className="lgh-panel overflow-hidden rounded-lg p-5">
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-sm font-extrabold uppercase tracking-[0.08em] text-white/88">Funnel map</div>
            <p className="mt-2 text-sm leading-6 text-white/52">
              This shows how people move from ad to webinar, call, and sale.
            </p>
          </div>
          <div className="text-sm font-bold text-[var(--lgh-gold)]">{range.start} to {range.end}</div>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_310px]">
          <div className="space-y-3">
            <div className="mb-2 grid grid-cols-3 gap-2 text-center text-[0.68rem] font-black uppercase tracking-[0.1em] text-white/38">
              <span>Top</span>
              <span>Middle</span>
              <span>Bottom</span>
            </div>
            <Stage label="Ads shown" value={money(spend)} sub="money spent to bring attention" width={100} />
            <Stage label="Webinar sign-ups" value={signups} sub={`${spend > 0 && signups > 0 ? money(spend / signups) : "$0"} per sign-up`} width={width(signups, 78)} />
            <Stage label="Attended training" value={attended} sub={`${pct(attended, signups)} of sign-ups attended`} width={width(attended, 66)} tone="gold" />
            <Stage label="AI calls made" value={calls} sub="follow-up pressure after sign-up" width={width(calls, 58)} tone="gold" />
            <Stage label="Booked calls" value={booked} sub={`${pct(booked, signups)} of sign-ups booked`} width={width(booked, 42)} tone="gold" />
            <Stage label="Deals won" value={deals} sub={`${money(revenue)} cash tracked`} width={width(deals, 34)} tone="green" />
          </div>

          <div className="space-y-3">
            <FlowStep title="Top of funnel" text="Ads bring veterans into the webinar page. The goal is low-cost, good-fit sign-ups." />
            <FlowStep title="Middle of funnel" text="Attendance is tracked only when a lead reaches Attended Webbi. Watch duration is hidden until tracking is restored." />
            <FlowStep title="Bottom of funnel" text="Closers turn qualified calls into paid deals. The goal is cash collected and source clarity." />
            <div className="rounded-lg border border-[var(--lgh-gold)]/20 bg-[var(--lgh-gold)]/10 p-4">
              <div className="text-sm font-extrabold uppercase tracking-[0.08em] text-[var(--lgh-gold)]">Big leak to watch</div>
              <p className="mt-2 text-sm leading-6 text-white/62">
                If sign-ups are high but attendance is low, the leak is registration-to-show. If attendance is high but booked calls are low, the leak is follow-up.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
