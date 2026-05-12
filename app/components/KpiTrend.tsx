import { Card } from "./Card";
import { fromView, KpiDay } from "@/lib/supabase";

const fmtMoney = (n: number | null) => (n == null ? "—" : `$${Number(n).toLocaleString(undefined, { maximumFractionDigits: 0 })}`);
const fmtNum = (n: number | null | undefined) => (n == null ? "—" : Number(n).toLocaleString());

export async function KpiTrend() {
  const rows = await fromView<KpiDay>("v_kpi_daily", {
    query: { order: "day.desc", limit: "14" },
  });

  return (
    <Card title="Last 14 Days" subtitle="Money spent to leads, calls, deals, and cash won">
      <div className="overflow-x-auto -mx-2">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-white/50 uppercase text-xs tracking-wide">
              <th className="px-2 py-2">Day</th>
              <th className="px-2 py-2 text-right">Ad spend</th>
              <th className="px-2 py-2 text-right">Sign-ups</th>
              <th className="px-2 py-2 text-right">Showed</th>
              <th className="px-2 py-2 text-right">Show rate</th>
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
                <td colSpan={12} className="px-2 py-6 text-center text-white/40">
                  No data yet.
                </td>
              </tr>
            ) : (
              rows.map((r) => {
                const dim = r.registrations === 0 && r.calls === 0 && r.deals === 0;
                return (
                  <tr key={r.day} className={`tabular-nums ${dim ? "text-white/30" : ""}`}>
                    <td className="px-2 py-1.5 whitespace-nowrap">{r.day}</td>
                    <td className="px-2 py-1.5 text-right">{fmtMoney(r.ad_spend)}</td>
                    <td className="px-2 py-1.5 text-right">{fmtNum(r.registrations)}</td>
                    <td className="px-2 py-1.5 text-right">{fmtNum(r.attended)}</td>
                    <td className="px-2 py-1.5 text-right">{r.show_rate_pct?.toFixed?.(0) ?? 0}%</td>
                    <td className="px-2 py-1.5 text-right">{fmtNum(r.calls)}</td>
                    <td className="px-2 py-1.5 text-right">{fmtNum(r.booked)}</td>
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
