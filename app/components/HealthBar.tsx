import { Card, Pill } from "./Card";
import { DateRange } from "@/lib/date-range";
import { getGhlRevenueMetrics, getHybridMetrics } from "@/lib/hybrid-metrics";
import { supabaseRestEnv } from "@/lib/supabase";

type HealthCheck = {
  name: string;
  ok: boolean;
  detail: string;
};

async function ping(url: string) {
  try {
    const res = await fetch(url, { next: { revalidate: 60 } });
    return { ok: res.ok, status: res.status };
  } catch {
    return { ok: false, status: 0 };
  }
}

async function lastRow(view: string, dateCol: string): Promise<Date | null> {
  const { url, key } = supabaseRestEnv();
  if (!url || !key) return null;
  try {
    const res = await fetch(
      `${url}/rest/v1/${view}?select=${dateCol}&order=${dateCol}.desc.nullslast&limit=1`,
      { headers: { apikey: key, Authorization: `Bearer ${key}` }, next: { revalidate: 60 } }
    );
    if (!res.ok) return null;
    const rows = (await res.json()) as Array<Record<string, string>>;
    return rows[0]?.[dateCol] ? new Date(rows[0][dateCol]) : null;
  } catch {
    return null;
  }
}

async function lastReportSubmission(): Promise<Date | null> {
  const { url, key } = supabaseRestEnv();
  if (!url || !key) return null;
  try {
    const params = new URLSearchParams({
      select: "created_at",
      kind: "eq.lgh_report_submission",
      order: "created_at.desc.nullslast",
      limit: "1",
    });
    const res = await fetch(`${url}/rest/v1/infra_alerts?${params.toString()}`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const rows = (await res.json()) as Array<Record<string, string>>;
    return rows[0]?.created_at ? new Date(rows[0].created_at) : null;
  } catch {
    return null;
  }
}

function freshness(d: Date | null, hours = 24) {
  if (!d) return { ok: false, detail: "nothing found" };
  const ageHrs = (Date.now() - d.getTime()) / 3_600_000;
  const ok = ageHrs <= hours;
  return { ok, detail: `${ageHrs < 24 ? `${ageHrs.toFixed(1)}h` : `${(ageHrs / 24).toFixed(1)}d`} ago` };
}

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function lastDays(days: number, label: string): DateRange {
  const end = new Date();
  const start = new Date(end);
  start.setDate(start.getDate() - days + 1);
  return { period: "custom", start: isoDate(start), end: isoDate(end), label };
}

export async function HealthBar() {
  const sevenDays = lastDays(7, "Last 7 days");
  const thirtyDays = lastDays(30, "Last 30 days");
  const [hybrid, ghlRevenue, calls, ads, reports] = await Promise.all([
    getHybridMetrics(sevenDays),
    getGhlRevenueMetrics(thirtyDays),
    lastRow("retell_call_log", "created_at").then((d) => freshness(d, 30)),
    lastRow("ad_metrics", "date").then((d) => freshness(d, 36)),
    lastReportSubmission().then((d) => freshness(d, 24 * 14)),
  ]);

  const checks: HealthCheck[] = [
    {
      name: "Hybrid sign-ups",
      ok: hybrid.available,
      detail: hybrid.available ? `${hybrid.registered} in 7d` : hybrid.error || "GHL unavailable",
    },
    {
      name: "Booked calls",
      ok: hybrid.available,
      detail: hybrid.available ? `${hybrid.bookedCalls} in 7d` : hybrid.error || "GHL unavailable",
    },
    {
      name: "Deals won",
      ok: ghlRevenue.available,
      detail: ghlRevenue.available ? `${ghlRevenue.count} in 30d · $${Math.round(ghlRevenue.value).toLocaleString()}` : ghlRevenue.error || "GHL unavailable",
    },
    { name: "AI calls", ok: calls.ok, detail: calls.detail },
    { name: "Ad spend", ok: ads.ok, detail: ads.detail },
    { name: "Reports", ok: reports.ok, detail: reports.detail },
  ];

  return (
    <Card title="Data Check" subtitle="Each source is checked separately so stale data is obvious">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-6">
        {checks.map((c) => (
          <div key={c.name} className="rounded-lg border border-white/10 bg-black/20 p-3">
            <div>
              <div className="text-sm text-white/80">{c.name}</div>
              <div className="text-xs text-white/40">{c.detail}</div>
            </div>
            <div className="mt-3">
              <Pill tone={c.ok ? "good" : "bad"}>{c.ok ? "live" : "stale"}</Pill>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
