import { Card, Pill } from "./Card";
import { DateRange } from "@/lib/date-range";
import { fromView, AdMetricRow, AttributionRow } from "@/lib/supabase";

const fmtMoney = (n: number) => `$${Number(n).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
const fmtNum = (n: number) => Number(n).toLocaleString();

const missingValues = new Set(["", "unknown", "missing", "not set", "n/a", "na"]);
const testPattern = /(codex|browser_test|operational_browser_test|test)/i;

function clean(value: string | null | undefined) {
  return String(value ?? "").trim();
}

function isMissing(value: string | null | undefined) {
  return missingValues.has(clean(value).toLowerCase());
}

function isTestRow(row: AttributionRow) {
  return testPattern.test(`${row.source} ${row.campaign}`);
}

function sourceLabel(source: string) {
  const value = clean(source).toLowerCase();
  if (value === "fb" || value === "facebook") return "Facebook";
  if (value === "ig" || value === "instagram") return "Instagram";
  return clean(source) || "Unknown";
}

function campaignLabel(campaign: string, campaignNames: Map<string, string>) {
  const value = clean(campaign);
  if (isMissing(value)) return { label: "Unknown campaign", weak: true };
  const knownName = campaignNames.get(value);
  if (knownName) return { label: knownName, weak: false };
  if (/^\d{10,}$/.test(value)) return { label: `Campaign ID: ${value}`, weak: true };
  return { label: value, weak: false };
}

export async function Attribution({ range }: { range?: DateRange }) {
  const [rows, adMetrics] = await Promise.all([
    fromView<AttributionRow>("v_attribution_source", {
      query: { order: "revenue.desc.nullslast,registrations.desc.nullslast", limit: "50" },
    }),
    fromView<AdMetricRow>("ad_metrics", {
      query: {
        select: "campaign_name,campaign_id,spend,leads",
        ...(range ? { date: `gte.${range.start}`, and: `(date.lte.${range.end})` } : {}),
        order: "date.desc",
        limit: "500",
      },
    }),
  ]);

  const campaignNames = new Map<string, string>();
  for (const metric of adMetrics) {
    const id = clean(metric.campaign_id);
    const name = clean(metric.campaign_name);
    if (id && name && !campaignNames.has(id)) campaignNames.set(id, name);
  }

  const total = rows.reduce((acc, r) => acc + Number(r.revenue || 0), 0);
  const cleanupRows = rows.filter((r) => !isTestRow(r) && (isMissing(r.source) || isMissing(r.campaign)) && Number(r.revenue || 0) > 0);
  const cleanupRevenue = cleanupRows.reduce((acc, r) => acc + Number(r.revenue || 0), 0);
  const cleanupDeals = cleanupRows.reduce((acc, r) => acc + Number(r.deals || 0), 0);
  const cleanupRegistrations = rows
    .filter((r) => !isTestRow(r) && (isMissing(r.source) || isMissing(r.campaign)))
    .reduce((acc, r) => acc + Number(r.registrations || 0), 0);
  const adRows = rows
    .filter((r) => !isTestRow(r))
    .filter((r) => !isMissing(r.source))
    .filter((r) => Number(r.registrations || 0) > 0 || Number(r.revenue || 0) > 0)
    .sort((a, b) => Number(b.revenue || 0) - Number(a.revenue || 0) || Number(b.registrations || 0) - Number(a.registrations || 0))
    .slice(0, 12);
  const knownRevenue = adRows.reduce((acc, r) => acc + Number(r.revenue || 0), 0);
  const knownRegistrations = adRows.reduce((acc, r) => acc + Number(r.registrations || 0), 0);
  const unknownPct = total > 0 ? Math.round((cleanupRevenue / total) * 100) : 0;

  return (
    <Card
      title="Attributed Ad Sources"
      subtitle={
        cleanupRevenue > 0
          ? `${fmtMoney(cleanupRevenue)} in closed cash is missing source data and is excluded below`
          : range ? `Known ad source and campaign performance for ${range.label.toLowerCase()}` : "Known ad source and campaign performance"
      }
    >
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
          <div className="text-[0.68rem] font-bold uppercase tracking-[0.12em] text-white/45">Known ad cash</div>
          <div className="mt-1 text-xl font-semibold tabular-nums">{fmtMoney(knownRevenue)}</div>
          <div className="text-xs text-white/40">cash tied to known source rows</div>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
          <div className="text-[0.68rem] font-bold uppercase tracking-[0.12em] text-white/45">Known sign-ups</div>
          <div className="mt-1 text-xl font-semibold tabular-nums">{fmtNum(knownRegistrations)}</div>
          <div className="text-xs text-white/40">test rows removed</div>
        </div>
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/[0.08] p-3">
          <div className="flex items-center justify-between gap-2">
            <div className="text-[0.68rem] font-bold uppercase tracking-[0.12em] text-amber-200/70">Source cleanup</div>
            {cleanupRevenue > 0 ? <Pill tone="warn">{unknownPct}% cash</Pill> : <Pill tone="good">Clean</Pill>}
          </div>
          <div className="mt-1 text-xl font-semibold tabular-nums text-amber-100">{fmtMoney(cleanupRevenue)}</div>
          <div className="text-xs text-amber-100/55">{cleanupDeals} deals / {fmtNum(cleanupRegistrations)} sign-ups need attribution</div>
        </div>
      </div>

      <div className="overflow-x-auto -mx-2">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-white/50 uppercase text-xs tracking-wide">
              <th className="px-2 py-2">Ad source</th>
              <th className="px-2 py-2">Campaign</th>
              <th className="px-2 py-2 text-right">Sign-ups</th>
              <th className="px-2 py-2 text-right">Deals</th>
              <th className="px-2 py-2 text-right">Cash won</th>
              <th className="px-2 py-2 text-right">Buy rate</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {adRows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-2 py-6 text-center text-white/40">
                  No known ad-attributed revenue yet.
                </td>
              </tr>
            ) : (
              adRows.map((r, i) => {
                const campaign = campaignLabel(r.campaign, campaignNames);
                return (
                <tr key={`${r.source}-${r.campaign}-${i}`} className="tabular-nums">
                  <td className="px-2 py-1.5">{sourceLabel(r.source)}</td>
                  <td className={`px-2 py-1.5 truncate max-w-[280px] ${campaign.weak ? "text-amber-200/75" : "text-white/70"}`}>
                    {campaign.label}
                  </td>
                  <td className="px-2 py-1.5 text-right">{r.registrations}</td>
                  <td className="px-2 py-1.5 text-right">{r.deals}</td>
                  <td className="px-2 py-1.5 text-right">{fmtMoney(Number(r.revenue))}</td>
                  <td className="px-2 py-1.5 text-right">{r.reg_to_deal_pct?.toFixed?.(1) ?? 0}%</td>
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
