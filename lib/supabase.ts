// Server-only Supabase REST helper. Reads service-role key from env.
// All queries hit PostgREST views (read-only). No client SDK to avoid bundling.

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.warn("[supabase] missing SUPABASE_URL / SUPABASE_SERVICE_KEY — dashboard will render empty state");
}

export type FetchOptions = {
  query?: Record<string, string>;
  revalidate?: number;
};

export async function fromView<T>(view: string, opts: FetchOptions = {}): Promise<T[]> {
  if (!SUPABASE_URL || !SUPABASE_KEY) return [];
  const params = new URLSearchParams(opts.query ?? {});
  if (!params.has("select")) params.set("select", "*");
  const url = `${SUPABASE_URL}/rest/v1/${view}?${params.toString()}`;
  try {
    const res = await fetch(url, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
      next: { revalidate: opts.revalidate ?? 60 },
    });
    if (!res.ok) {
      console.error(`[supabase] ${view} ${res.status}: ${await res.text()}`);
      return [];
    }
    return (await res.json()) as T[];
  } catch (err) {
    console.error(`[supabase] ${view} fetch error:`, err);
    return [];
  }
}

export async function fromViewOne<T>(view: string, opts: FetchOptions = {}): Promise<T | null> {
  const rows = await fromView<T>(view, opts);
  return rows[0] ?? null;
}

export async function insertRow<T extends Record<string, unknown>>(table: string, data: T) {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return { ok: false, status: 500, error: "Supabase is not configured" };
  }
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      return { ok: false, status: res.status, error: await res.text() };
    }
    return { ok: true, status: res.status, error: null };
  } catch (err) {
    return { ok: false, status: 500, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export type TeamMember = {
  id: string;
  name: string;
  role: string;
  phone?: string | null;
};

export type TodaySnapshot = {
  day: string;
  ad_spend_today: number;
  registrations_today: number;
  registrations_yesterday: number;
  calls_today: number;
  booked_today: number;
  deals_today: number;
  revenue_today: number;
  open_queue: number;
  hot_now: number;
  cpl_today: number | null;
};

export type KpiDay = {
  day: string;
  ad_spend: number;
  impressions: number;
  clicks: number;
  registrations: number;
  attended: number;
  calls: number;
  booked: number;
  hot_closer_calls: number;
  deals: number;
  revenue: number;
  show_rate_pct: number;
  book_rate_pct: number;
  cpl: number | null;
  cpa: number | null;
  roas: number | null;
};

export type AttributionRow = {
  source: string;
  campaign: string;
  registrations: number;
  deals: number;
  revenue: number;
  reg_to_deal_pct: number;
};

export type AdMetricRow = {
  campaign_name: string | null;
  campaign_id: string | null;
  spend: number | null;
  leads: number | null;
};

export type CallQueueRow = {
  registration_id: string;
  ghl_contact_id: string | null;
  name: string | null;
  phone: string | null;
  email: string | null;
  utm_source: string | null;
  intent_score: number | null;
  intent_level: string | null;
  attended: boolean;
  watch_minutes: number | null;
  funnel_stage: string;
  last_call_type: string | null;
  last_call_agent: string | null;
  last_call_outcome: string | null;
  last_call_booked: boolean | null;
  last_call_at: string | null;
  registered_at: string;
  next_action: string;
  priority: number;
};

export type FunnelJourneyRow = {
  registration_id: string;
  registered_at: string;
  email: string | null;
  phone: string | null;
  name: string | null;
  ghl_contact_id: string | null;
  utm_source: string | null;
  utm_campaign: string | null;
  attended: boolean;
  watch_minutes: number | null;
  intent_score: number | null;
  last_call_outcome: string | null;
  last_call_booked: boolean | null;
  last_call_at: string | null;
  deal_amount: number | null;
  deal_cash_collected: number | null;
  deal_closed_at: string | null;
  funnel_stage: string;
};
