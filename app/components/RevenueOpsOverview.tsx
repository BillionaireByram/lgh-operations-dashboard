import { DateRange, weekOf } from "@/lib/date-range";
import { centralRangeQuery, getGhlRevenueMetrics, getHybridMetrics, type GhlWonDeal } from "@/lib/hybrid-metrics";
import { fromView } from "@/lib/supabase";

type SetterLog = {
  team_member: string | null;
  calls_taken: number | null;
  calls_booked: number | null;
  no_shows: number | null;
  deals_closed: number | null;
  revenue_collected: number | null;
};

type Deal = {
  closer: string | null;
  cash_collected: number | null;
  amount: number | null;
};

type Lead = {
  id: string;
};

type AdMetric = {
  campaign_name: string | null;
  spend: number | null;
  leads: number | null;
  clicks: number | null;
  impressions: number | null;
};

type KpiDay = {
  registrations: number | null;
  attended: number | null;
  booked: number | null;
};

type RetellCall = {
  call_status: string | null;
  call_outcome: string | null;
  call_type: string | null;
  booked: boolean | null;
  registered: boolean | null;
  call_duration_seconds: number | null;
};

const num = (value: unknown) => Number(value) || 0;
const money = (value: number) => `$${Math.round(value).toLocaleString()}`;

function rank<T extends Record<string, unknown>>(rows: T[], nameKey: keyof T, value: (row: T) => number) {
  const totals = new Map<string, number>();
  for (const row of rows) {
    const name = String(row[nameKey] || "Unknown");
    totals.set(name, (totals.get(name) || 0) + value(row));
  }
  return [...totals.entries()].sort((a, b) => b[1] - a[1]);
}

function SalesCard({
  title,
  rows,
  format = String,
}: {
  title: string;
  rows: Array<[string, number]>;
  format?: (value: number) => string;
}) {
  const [winner, ...rest] = rows;
  return (
    <div className="lgh-panel rounded-lg p-5">
      <div className="text-sm font-extrabold uppercase tracking-[0.08em] text-white/80">{title}</div>
      {winner ? (
        <>
          <div className="mt-5 flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-lg bg-red-600 text-sm font-black text-white">
              {winner[0]
                .split(" ")
                .map((part) => part[0])
                .join("")
                .slice(0, 2)}
            </div>
            <div className="min-w-0">
              <div className="truncate text-xl font-semibold">{winner[0]}</div>
              <div className="text-3xl font-semibold text-[var(--lgh-gold)]">{format(winner[1])}</div>
            </div>
          </div>
          <div className="mt-5 space-y-2 border-t border-white/10 pt-4">
            {rest.slice(0, 3).map(([name, value], index) => (
              <div key={name} className="flex items-center justify-between gap-3 text-sm">
                <span className="truncate text-white/58">
                  {index + 2}. {name}
                </span>
                <strong className="text-white/85">{format(value)}</strong>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="mt-5 rounded-lg border border-white/10 bg-black/20 p-4 text-sm text-white/45">No closer data for this time frame.</div>
      )}
    </div>
  );
}

function Metric({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="min-w-0 rounded-lg border border-white/10 bg-black/20 p-4">
      <div className="text-[0.68rem] font-bold uppercase tracking-[0.06em] text-white/42">{label}</div>
      <div className="mt-2 whitespace-nowrap text-[clamp(1.45rem,1.8vw,2rem)] font-semibold leading-tight tabular-nums">{value}</div>
      {sub ? <div className="mt-1 text-xs text-white/42">{sub}</div> : null}
    </div>
  );
}

export async function RevenueOpsOverview({ range }: { range: DateRange }) {
  const { startIso, endIso } = centralRangeQuery(range);
  const [registrations, aiCalls, closerLogs, closedDeals, kpiDays, adMetrics, hybridMetrics, ghlRevenue] = await Promise.all([
    fromView<Lead>("webinar_registrations", {
      query: { select: "id", registered_at: `gte.${range.start}`, and: `(registered_at.lte.${range.end}T23:59:59)` },
    }),
    fromView<RetellCall>("retell_call_log", {
      query: {
        select: "call_status,call_outcome,call_type,booked,registered,call_duration_seconds",
        created_at: `gte.${startIso}`,
        and: `(created_at.lte.${endIso})`,
        limit: "1000",
      },
    }),
    fromView<SetterLog>("closer_logs", {
      query: { week_of: `gte.${weekOf(range.start)}`, and: `(week_of.lte.${range.end})` },
    }),
    fromView<Deal>("closed_deals", {
      query: { select: "closer,cash_collected,amount", closed_at: `gte.${startIso}`, and: `(closed_at.lte.${endIso})` },
    }),
    fromView<KpiDay>("v_kpi_daily", {
      query: {
        select: "registrations,attended,booked",
        day: `gte.${range.start}`,
        and: `(day.lte.${range.end})`,
      },
    }),
    fromView<AdMetric>("ad_metrics", {
      query: { date: `gte.${range.start}`, and: `(date.lte.${range.end})` },
    }),
    getHybridMetrics(range),
    getGhlRevenueMetrics(range),
  ]);

  const callsMade = aiCalls.length;
  const aiBooked = aiCalls.filter((row) => row.booked).length;
  const answered = aiCalls.filter((row) => {
    const status = (row.call_status || "").toLowerCase();
    const outcome = (row.call_outcome || "").toLowerCase();
    if (status.includes("no_answer") || status.includes("voicemail")) return false;
    return status.includes("answer") || outcome.includes("book") || outcome.includes("interested") || Number(row.call_duration_seconds || 0) > 20;
  }).length;
  const closesFromLogs = closerLogs.reduce((sum, row) => sum + num(row.deals_closed), 0);
  const closes = Math.max(ghlRevenue.count, closedDeals.length, closesFromLogs);
  const cashFromDeals = closedDeals.reduce((sum, row) => sum + num(row.cash_collected || row.amount), 0);
  const cashFromLogs = closerLogs.reduce((sum, row) => sum + num(row.revenue_collected), 0);
  const cash = Math.max(ghlRevenue.value, cashFromDeals, cashFromLogs);
  const closerCalls = closerLogs.reduce((sum, row) => sum + num(row.calls_taken), 0);
  const noShows = closerLogs.reduce((sum, row) => sum + num(row.no_shows), 0);
  const closeRateBase = closerCalls || hybridMetrics.bookedCalls;
  const closeRate = closeRateBase > 0 ? Math.round((closes / closeRateBase) * 100) : 0;
  const goal = 25_000;
  const goalPct = Math.min(100, Math.round((cash / goal) * 100));

  const leaderDeals: Array<{ team_member: string | null; value: number }> = ghlRevenue.available && ghlRevenue.deals.length
    ? ghlRevenue.deals.map((deal: GhlWonDeal) => ({ team_member: deal.closer || "GHL closer", value: deal.amount }))
    : closedDeals.map((row) => ({ team_member: row.closer, value: num(row.cash_collected || row.amount) }));
  const cashLeaders = rank(
    leaderDeals,
    "team_member",
    (row) => num(row.value)
  );
  const dealLeaders = rank(
    leaderDeals.map((row) => ({ team_member: row.team_member, value: 1 })),
    "team_member",
    (row) => num(row.value)
  );
  const callLeaders = rank(closerLogs, "team_member", (row) => num(row.calls_taken));

  const webinarRegs = hybridMetrics.available ? hybridMetrics.registered : kpiDays.reduce((sum, row) => sum + num(row.registrations), 0);
  const webinarAttended = hybridMetrics.available ? hybridMetrics.reachedVcc : kpiDays.reduce((sum, row) => sum + num(row.attended), 0);
  const webinarBooked = hybridMetrics.available ? hybridMetrics.bookedCalls : kpiDays.reduce((sum, row) => sum + num(row.booked), 0);
  const webinarShowRate = webinarRegs > 0 ? ((webinarAttended / webinarRegs) * 100).toFixed(1) : "0.0";
  const adRows = adMetrics.filter((row) => !row.campaign_name || row.campaign_name === "All Campaigns");
  const adSpend = adRows.length ? adRows.reduce((sum, row) => sum + num(row.spend), 0) : adMetrics.reduce((sum, row) => sum + num(row.spend), 0);
  const adLeads = adRows.length ? adRows.reduce((sum, row) => sum + num(row.leads), 0) : adMetrics.reduce((sum, row) => sum + num(row.leads), 0);
  const cpl = adLeads > 0 ? adSpend / adLeads : 0;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <SalesCard title="Top closer by cash" rows={cashLeaders} format={money} />
        <SalesCard title="Top closer by deals" rows={dealLeaders} />
        <SalesCard title="Most sales calls held" rows={callLeaders} />
      </div>

      <div className="lgh-panel rounded-lg p-5">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-sm font-extrabold uppercase tracking-[0.08em] text-white/88">Scoreboard</div>
            <div className="mt-1 text-sm text-white/50">
              The main numbers for {range.label.toLowerCase()}.
              {ghlRevenue.available ? " Deals and value are pulled from live GHL won opportunities." : ""}
            </div>
          </div>
          <div className="text-sm font-bold text-[var(--lgh-gold)]">{money(cash)} / {money(goal)} goal</div>
        </div>
        <div className="mb-5 h-3 overflow-hidden rounded bg-white/10">
          <div className="h-full rounded bg-gradient-to-r from-[var(--lgh-red)] to-[var(--lgh-gold)]" style={{ width: `${goalPct}%` }} />
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          <Metric label="Leads" value={webinarRegs} sub={hybridMetrics.available ? "Hybrid opt-ins" : "webinar sign-ups"} />
          <Metric label="AI calls" value={callsMade} sub={`${answered} answered`} />
          <Metric label="Booked calls" value={webinarBooked} sub={hybridMetrics.available ? "GHL booked-call stage" : "from Commander calls"} />
          <Metric label="Deals" value={closes} sub={`${closeRate}% close rate`} />
          <Metric label="Cash won" value={money(cash)} sub={ghlRevenue.available ? "GHL won value" : "collected"} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <div className="lgh-panel rounded-lg p-5">
          <div className="text-sm font-extrabold uppercase tracking-[0.08em] text-white/80">AI Setter</div>
          <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4 xl:grid-cols-2">
            <Metric label="Calls" value={callsMade} />
            <Metric label="Answered" value={answered} />
            <Metric label="Booked" value={aiBooked} />
            <Metric label="Book rate" value={callsMade > 0 ? `${Math.round((aiBooked / callsMade) * 100)}%` : "0%"} />
          </div>
        </div>
        <div className="lgh-panel rounded-lg p-5">
          <div className="text-sm font-extrabold uppercase tracking-[0.08em] text-white/80">Closers</div>
          <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4 xl:grid-cols-2">
            <Metric label="Calls" value={closerCalls} />
            <Metric label="No shows" value={noShows} />
            <Metric label="Deals" value={closes} />
            <Metric label="Cash" value={money(cash)} />
          </div>
        </div>
        <div className="lgh-panel rounded-lg p-5">
          <div className="text-sm font-extrabold uppercase tracking-[0.08em] text-white/80">Hybrid VSL</div>
          <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4 xl:grid-cols-2">
            <Metric label="Sign-ups" value={webinarRegs} />
            <Metric label="VCC reached" value={webinarAttended} />
            <Metric label="Booked" value={webinarBooked} />
            <Metric label="Ready rate" value={`${webinarShowRate}%`} />
          </div>
        </div>
        <div className="lgh-panel rounded-lg p-5">
          <div className="text-sm font-extrabold uppercase tracking-[0.08em] text-white/80">Ads</div>
          <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4 xl:grid-cols-2">
            <Metric label="Spent" value={money(adSpend)} />
            <Metric label="Leads" value={adLeads} />
            <Metric label="Cost/lead" value={cpl ? money(cpl) : "$0"} />
            <Metric label="Cash" value={money(cash)} />
          </div>
        </div>
      </div>
    </div>
  );
}
