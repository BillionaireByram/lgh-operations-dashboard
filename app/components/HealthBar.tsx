import { Card, Pill } from "./Card";

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
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY;
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

function freshness(d: Date | null, hours = 24) {
  if (!d) return { ok: false, detail: "nothing found" };
  const ageHrs = (Date.now() - d.getTime()) / 3_600_000;
  const ok = ageHrs <= hours;
  return { ok, detail: `${ageHrs < 24 ? `${ageHrs.toFixed(1)}h` : `${(ageHrs / 24).toFixed(1)}d`} ago` };
}

export async function HealthBar() {
  const [regs, postWebinar, calls, deals, ads] = await Promise.all([
    lastRow("webinar_registrations", "registered_at").then((d) => freshness(d, 30)),
    lastRow("webinar_attendance_events", "created_at").then((d) => freshness(d, 48)),
    lastRow("retell_call_log", "created_at").then((d) => freshness(d, 30)),
    lastRow("closed_deals", "closed_at").then((d) => freshness(d, 24 * 7)),
    lastRow("ad_metrics", "date").then((d) => freshness(d, 36)),
  ]);

  const checks: HealthCheck[] = [
    { name: "Sign-ups", ok: regs.ok, detail: regs.detail },
    { name: "Webinar watch", ok: postWebinar.ok, detail: postWebinar.detail },
    { name: "Calls", ok: calls.ok, detail: calls.detail },
    { name: "Deals won", ok: deals.ok, detail: deals.detail },
    { name: "Ad spend", ok: ads.ok, detail: ads.detail },
  ];

  return (
    <Card title="Data Check" subtitle="Green means the numbers are still coming in">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
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
