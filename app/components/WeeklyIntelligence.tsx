import { DateRange } from "@/lib/date-range";
import { getHybridMetrics, HybridMetrics } from "@/lib/hybrid-metrics";
import { fromView, KpiDay } from "@/lib/supabase";

const money = (value: number) => `$${Math.round(value).toLocaleString()}`;

function addDays(date: string, days: number) {
  const d = new Date(`${date}T12:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function daysBetween(start: string, end: string) {
  return Math.max(1, Math.round((new Date(`${end}T12:00:00`).getTime() - new Date(`${start}T12:00:00`).getTime()) / 86_400_000) + 1);
}

function summarize(rows: KpiDay[], hybrid?: HybridMetrics) {
  const spend = rows.reduce((sum, row) => sum + Number(row.ad_spend || 0), 0);
  const signups = hybrid?.available ? hybrid.registered : rows.reduce((sum, row) => sum + Number(row.registrations || 0), 0);
  const calls = rows.reduce((sum, row) => sum + Number(row.calls || 0), 0);
  const booked = hybrid?.available ? hybrid.bookedCalls : rows.reduce((sum, row) => sum + Number(row.booked || 0), 0);
  const deals = rows.reduce((sum, row) => sum + Number(row.deals || 0), 0);
  const revenue = rows.reduce((sum, row) => sum + Number(row.revenue || 0), 0);
  return {
    spend,
    signups,
    calls,
    booked,
    deals,
    revenue,
    callCoverage: signups > 0 ? Math.round((calls / signups) * 100) : 0,
    bookRate: signups > 0 ? Math.round((booked / signups) * 100) : 0,
    closeRate: booked > 0 ? Math.round((deals / booked) * 100) : 0,
    cpl: signups > 0 ? spend / signups : 0,
  };
}

function change(now: number, before: number, suffix = "") {
  if (!before && !now) return `0${suffix}`;
  if (!before) return `up from 0${suffix}`;
  const diff = Math.round(((now - before) / before) * 100);
  return `${diff >= 0 ? "+" : ""}${diff}%${suffix}`;
}

function findLeak(now: ReturnType<typeof summarize>) {
  if (now.signups === 0) {
    return {
      label: "Need more webinar sign-ups",
      detail: "The top of funnel is too quiet. The first move is more qualified traffic into the webinar.",
      action: "Review ad spend and the top ad hooks. Push budget only to ads that create webinar sign-ups.",
    };
  }
  if (now.calls < Math.ceil(now.signups * 0.5)) {
    return {
      label: "AI follow-up coverage is the leak",
      detail: `${now.calls} AI calls were tracked from ${now.signups} webinar sign-ups. The middle of the funnel needs more follow-up pressure.`,
      action: "Make sure every webinar sign-up gets called and messaged quickly, then prioritize answered calls that did not book.",
    };
  }
  if (now.bookRate < 12) {
    return {
      label: "Booked calls are the leak",
      detail: `${now.bookRate}% of sign-ups booked. People are entering the funnel, but not enough are moving to a sales call.`,
      action: "Tighten the CTA follow-up and prioritize anyone who clicked, answered, or replied but did not book.",
    };
  }
  if (now.closeRate < 20) {
    return {
      label: "Sales close rate is the leak",
      detail: `${now.closeRate}% of booked calls became deals. The sales team needs better offer, urgency, or objection handling.`,
      action: "Review calls from no-sale prospects and pull the top objection into tomorrow's follow-up scripts.",
    };
  }
  return {
    label: "Main funnel is moving",
    detail: "The core path is producing movement from sign-up to booked call to deal.",
    action: "Scale the best ad source slowly and keep checking AI calls, booked calls, and deals daily.",
  };
}

export async function WeeklyIntelligence({ range }: { range: DateRange }) {
  const span = daysBetween(range.start, range.end);
  const previousEnd = addDays(range.start, -1);
  const previousStart = addDays(previousEnd, -(span - 1));

  const previousRange: DateRange = { period: "custom", start: previousStart, end: previousEnd, label: "Previous period" };
  const [currentRows, previousRows, currentHybrid, previousHybrid] = await Promise.all([
    fromView<KpiDay>("v_kpi_daily", {
      query: { day: `gte.${range.start}`, and: `(day.lte.${range.end})`, order: "day.asc" },
    }),
    fromView<KpiDay>("v_kpi_daily", {
      query: { day: `gte.${previousStart}`, and: `(day.lte.${previousEnd})`, order: "day.asc" },
    }),
    getHybridMetrics(range),
    getHybridMetrics(previousRange),
  ]);

  const now = summarize(currentRows, currentHybrid);
  const before = summarize(previousRows, previousHybrid);
  const leak = findLeak(now);

  return (
    <div className="lgh-panel rounded-lg p-5">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_330px]">
        <div>
          <div className="text-sm font-extrabold uppercase tracking-[0.08em] text-white/88">What Commander sees</div>
          <h3 className="mt-4 text-3xl font-black tracking-[-0.03em]">{leak.label}</h3>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/58">{leak.detail}</p>
          <div className="mt-5 rounded-lg border border-[var(--lgh-gold)]/20 bg-[var(--lgh-gold)]/10 p-4">
            <div className="text-xs font-black uppercase tracking-[0.1em] text-[var(--lgh-gold)]">Next best move</div>
            <p className="mt-2 text-sm leading-6 text-white/72">{leak.action}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-white/10 bg-black/20 p-4">
            <div className="text-xs font-bold uppercase tracking-[0.08em] text-white/42">Sign-ups</div>
            <div className="mt-2 text-2xl font-semibold">{now.signups}</div>
            <div className="text-xs text-white/42">{change(now.signups, before.signups)}</div>
          </div>
          <div className="rounded-lg border border-white/10 bg-black/20 p-4">
            <div className="text-xs font-bold uppercase tracking-[0.08em] text-white/42">AI calls</div>
            <div className="mt-2 text-2xl font-semibold">{now.calls}</div>
            <div className="text-xs text-white/42">{change(now.calls, before.calls)}</div>
          </div>
          <div className="rounded-lg border border-white/10 bg-black/20 p-4">
            <div className="text-xs font-bold uppercase tracking-[0.08em] text-white/42">Booked</div>
            <div className="mt-2 text-2xl font-semibold">{now.booked}</div>
            <div className="text-xs text-white/42">{change(now.booked, before.booked)}</div>
          </div>
          <div className="rounded-lg border border-white/10 bg-black/20 p-4">
            <div className="text-xs font-bold uppercase tracking-[0.08em] text-white/42">Cash</div>
            <div className="mt-2 text-2xl font-semibold">{money(now.revenue)}</div>
            <div className="text-xs text-white/42">{change(now.revenue, before.revenue)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
