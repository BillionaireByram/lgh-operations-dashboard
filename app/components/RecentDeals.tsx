import { Card } from "./Card";
import { fromView, FunnelJourneyRow } from "@/lib/supabase";

const fmtMoney = (n: number | null) => (n == null ? "—" : `$${Number(n).toLocaleString(undefined, { maximumFractionDigits: 0 })}`);

type Deal = {
  id: string;
  amount: number | null;
  cash_collected: number | null;
  total_value: number | null;
  prospect_name: string | null;
  package: string | null;
  closer: string | null;
  closed_at: string;
  utm_source: string | null;
  contact_id: string | null;
};

export async function RecentDeals() {
  // Direct query of closed_deals — most recent 10
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY;

  let rows: Deal[] = [];
  if (url && key) {
    try {
      const res = await fetch(
        `${url}/rest/v1/closed_deals?select=id,amount,cash_collected,total_value,prospect_name,package,closer,closed_at,utm_source,contact_id&order=closed_at.desc.nullslast&limit=10`,
        {
          headers: { apikey: key, Authorization: `Bearer ${key}` },
          next: { revalidate: 60 },
        }
      );
      if (res.ok) rows = await res.json();
    } catch {
      /* swallow */
    }
  }

  const orphans = rows.filter((d) => !d.contact_id).length;

  return (
    <Card
      title="Recent Deals"
      subtitle={orphans > 0 ? `${orphans}/${rows.length} deals need source cleanup` : "Last 10 deals"}
    >
      <div className="overflow-x-auto -mx-2">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-white/50 uppercase text-xs tracking-wide">
              <th className="px-2 py-2">Closed</th>
              <th className="px-2 py-2">Prospect</th>
              <th className="px-2 py-2">Package</th>
              <th className="px-2 py-2">Closer</th>
              <th className="px-2 py-2">Came from</th>
              <th className="px-2 py-2 text-right">Cash</th>
              <th className="px-2 py-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-2 py-6 text-center text-white/40">
                  No deals yet.
                </td>
              </tr>
            ) : (
              rows.map((d) => (
                <tr key={d.id} className="tabular-nums">
                  <td className="px-2 py-1.5 whitespace-nowrap text-white/70">
                    {new Date(d.closed_at).toLocaleDateString()}
                  </td>
                  <td className="px-2 py-1.5">
                    {d.prospect_name || "—"}
                    {!d.contact_id && <span className="ml-2 text-xs text-amber-400">needs match</span>}
                  </td>
                  <td className="px-2 py-1.5 text-white/70 truncate max-w-[200px]">{d.package ?? "—"}</td>
                  <td className="px-2 py-1.5 text-white/70">{d.closer ?? "—"}</td>
                  <td className="px-2 py-1.5 text-white/70">{d.utm_source || <span className="text-amber-400">—</span>}</td>
                  <td className="px-2 py-1.5 text-right">{fmtMoney(d.cash_collected)}</td>
                  <td className="px-2 py-1.5 text-right">{fmtMoney(d.total_value ?? d.amount)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
