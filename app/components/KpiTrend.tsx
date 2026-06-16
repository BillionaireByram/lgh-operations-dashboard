import { Card } from "./Card";
import { DateRange } from "@/lib/date-range";
import { getHybridMetrics } from "@/lib/hybrid-metrics";
import { fromView, KpiDay } from "@/lib/supabase";

const fmtMoney = (n: number | null) => (n == null ? "—" : `$${Number(n).toLocaleString(undefined, { maximumFractionDigits: 0 })}`);
const fmtNum = (n: number | null | undefined) => (n == null ? "—" : Number(n).toLocaleString());

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function last14Range(): DateRange {
  const end = new Date();
  const start = new Date(end);
  start.setDate(start.getDate() - 13);
  return { period: "custom", start: isoDate(start), end: isoDate(end), label: "Last 14 days" };
}

export async function KpiTrend() {
  const range = last14Range();
  const [rows, hybrid] = await Promise.all([
    fromView<KpiDay>("v_kpi_daily", {
      query: { day: `gte.${range.start}`, and: `(day.lte.${range.end})`, order: "day.desc", limit: "14" },
    }),
    getHybridMetrics(range),
  ]);
  const hybridByDay = new Map(hybrid.daily.map((row) => [row.day, row]));

  return (
    <Card title="Last 14 Days" subtitle="Hybrid VSL opt-ins/VCC/booked from GHL; calls and legacy daily rows from the ledger">
      <div className="overflow-x-auto -mx-2">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-white/50 uppercase text-xs tracking-wide">
              <th className="px-2 py-2">Day</th>
              <th className="px-2 py-2 text-right">Ad spend</th>
              <th className="px-2 py-2 text-right">Sign-ups</th>
              <th className="px-2 py-2 text-right">VCC reached</th>
              <th className="px-2 py-2 text-right">Calls</th>
              <th className="px-2 py-2 text-right">Booked</th>
              <th className="px-2 py-2 text-right">Deals</th>
              <th className="px-2 py-2 text-right">Cash won</th>
              <th className="px-2 py-2 text-right">Cost/lead</th>
              <th className="px-2 py-2 text-right">Cost/deal</th>
              <th className="px-2 py-2 text-right">Return</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={11} className="px-2 py-6 text-center text-white/40">
                  No data yet.
                </td>
              </tr>
            ) : (
              rows.map((r) => {
                const h = hybridByDay.get(r.day);
                const registrations = hybrid.available ? h?.registered || 0 : r.registrations;
                const attended = hybrid.available ? h?.reachedVcc || 0 : r.attended;
                const booked = hybrid.available ? h?.bookedCalls || 0 : r.booked;
                const dim = registrations === 0 && r.calls === 0 && r.deals === 0;
                return (
                  <tr key={r.day} className={`tabular-nums ${dim ? "text-white/30" : ""}`}>
                    <td className="px-2 py-1.5 whitespace-nowrap">{r.day}</td>
                    <td className="px-2 py-1.5 text-right">{fmtMoney(r.ad_spend)}</td>
                    <td className="px-2 py-1.5 text-right">{fmtNum(registrations)}</td>
                    <td className="px-2 py-1.5 text-right">{fmtNum(attended)}</td>
                    <td className="px-2 py-1.5 text-right">{fmtNum(r.calls)}</td>
                    <td className="px-2 py-1.5 text-right">{fmtNum(booked)}</td>
                    <td className="px-2 py-1.5 text-right">{fmtNum(r.deals)}</td>
                    <td className="px-2 py-1.5 text-right">{fmtMoney(r.revenue)}</td>
                    <td className="px-2 py-1.5 text-right">{fmtMoney(r.cpl)}</td>
                    <td className="px-2 py-1.5 text-right">{fmtMoney(r.cpa)}</td>
                    <td className="px-2 py-1.5 text-right">{r.roas == null ? "—" : `${r.roas}x`}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
