import { Card } from "./Card";
import { DateRange } from "@/lib/date-range";
import { centralRangeQuery, getGhlRevenueMetrics, type GhlWonDeal } from "@/lib/hybrid-metrics";
import { supabaseRestEnv } from "@/lib/supabase";

const fmtMoney = (n: number | null) => (n == null ? "—" : `$${Number(n).toLocaleString(undefined, { maximumFractionDigits: 0 })}`);

function packageLabel(value: string | null) {
  if (!value) return "—";
  const normalized = value.toLowerCase().replace(/[-_]/g, " ");
  if (normalized.includes("finance") || normalized.includes("financed") || normalized.includes("in house") || normalized.includes("in-house")) {
    return "Financed";
  }
  if (normalized.includes("pif") || normalized.includes("paid") || normalized.includes("champion") || normalized.includes("warrior") || normalized.includes("recruit")) {
    return "PIF";
  }
  return value;
}

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

function fromGhlDeal(deal: GhlWonDeal): Deal {
  return {
    id: deal.id,
    amount: deal.amount,
    cash_collected: deal.amount,
    total_value: deal.amount,
    prospect_name: deal.name,
    package: deal.package,
    closer: deal.closer,
    closed_at: deal.closedAt || new Date().toISOString(),
    utm_source: deal.source,
    contact_id: deal.contactId,
  };
}

export async function RecentDeals({ range }: { range?: DateRange }) {
  // Direct query of closed_deals — most recent 10
  const { url, key } = supabaseRestEnv();
  const rangeQuery = range ? centralRangeQuery(range) : null;

  let rows: Deal[] = [];
  if (url && key) {
    try {
      const params = new URLSearchParams({
        select: "id,amount,cash_collected,total_value,prospect_name,package,closer,closed_at,utm_source,contact_id",
        order: "closed_at.desc.nullslast",
        limit: "25",
      });
      if (rangeQuery) {
        params.set("closed_at", `gte.${rangeQuery.startIso}`);
        params.set("and", `(closed_at.lte.${rangeQuery.endIso})`);
      }
      const res = await fetch(
        `${url}/rest/v1/closed_deals?${params.toString()}`,
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

  let source = "Last 10 deals";
  if (rows.length === 0) {
    const ghlRevenue = await getGhlRevenueMetrics(range, 25);
    if (ghlRevenue.available && ghlRevenue.deals.length) {
      rows = ghlRevenue.deals.slice(0, 10).map(fromGhlDeal);
      source = "Live GHL won opportunities";
    }
  }

  const orphans = rows.filter((d) => !d.contact_id).length;

  return (
    <Card
      title="Recent Deals"
      subtitle={orphans > 0 ? `${orphans}/${rows.length} deals need source cleanup` : range ? `${source} for ${range.label.toLowerCase()}` : source}
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
                  No deals found in the connected sources yet.
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
                  <td className="px-2 py-1.5 text-white/70 truncate max-w-[200px]">{packageLabel(d.package)}</td>
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
