import { DateRange } from "@/lib/date-range";
import { getHybridMetrics, HybridLead } from "@/lib/hybrid-metrics";

const fmt = (value: number) => Number(value || 0).toLocaleString();

function Metric({ label, value, sub, tone = "neutral" }: { label: string; value: string | number; sub?: string; tone?: "neutral" | "good" | "warn" | "bad" }) {
  const toneClass =
    tone === "good"
      ? "border-emerald-500/20 bg-emerald-500/10"
      : tone === "warn"
        ? "border-amber-500/20 bg-amber-500/10"
        : tone === "bad"
          ? "border-red-500/25 bg-red-500/10"
          : "border-white/10 bg-black/20";
  return (
    <div className={`rounded-lg border p-4 ${toneClass}`}>
      <div className="text-[0.68rem] font-bold uppercase tracking-[0.06em] text-white/42">{label}</div>
      <div className="mt-2 text-2xl font-semibold leading-tight tabular-nums">{value}</div>
      {sub ? <div className="mt-1 text-xs text-white/48">{sub}</div> : null}
    </div>
  );
}

function LeadList({ title, empty, rows }: { title: string; empty: string; rows: HybridLead[] }) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/18 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-extrabold uppercase tracking-[0.08em] text-white/82">{title}</div>
        <div className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-xs font-bold text-white/58">{rows.length}</div>
      </div>
      <div className="mt-3 space-y-2">
        {rows.length ? (
          rows.slice(0, 6).map((lead) => (
            <div key={`${lead.key}-${lead.status}`} className="rounded-lg border border-white/8 bg-white/[0.035] p-3">
              <div className="truncate text-sm font-semibold text-white/90">{lead.name}</div>
              <div className="mt-1 truncate text-xs text-white/42">{lead.email || lead.phone || lead.contactId || "No contact shown"}</div>
            </div>
          ))
        ) : (
          <div className="rounded-lg border border-white/8 bg-white/[0.035] p-3 text-sm text-white/45">{empty}</div>
        )}
        {rows.length > 6 ? <div className="text-xs text-white/42">+{rows.length - 6} more</div> : null}
      </div>
    </div>
  );
}

export async function HybridFunnelOverview({ range }: { range: DateRange }) {
  const metrics = await getHybridMetrics(range);

  if (!metrics.available) {
    return (
      <div className="lgh-panel rounded-lg border border-amber-500/20 bg-amber-500/10 p-5">
        <div className="text-sm font-extrabold uppercase tracking-[0.08em] text-amber-100">Hybrid VSL metrics unavailable</div>
        <p className="mt-2 text-sm leading-6 text-amber-100/70">{metrics.error || "GHL data could not be loaded."}</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="lgh-panel rounded-lg p-5">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-sm font-extrabold uppercase tracking-[0.08em] text-white/88">Hybrid VSL command view</div>
            <div className="mt-1 text-sm text-white/50">Correct funnel source: GHL Hybrid Webbi stages, not old WebinarKit rows.</div>
          </div>
          <div className="text-sm font-bold text-[var(--lgh-gold)]">{range.start} to {range.end}</div>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-7">
          <Metric label="Registered" value={fmt(metrics.registered)} sub="Hybrid opt-ins" />
          <Metric label="Started" value={fmt(metrics.started)} sub="training unlocked/played" />
          <Metric label="VCC reached" value={fmt(metrics.reachedVcc)} sub={`${metrics.attendRate}% of registered`} tone="good" />
          <Metric label="Watch push" value={fmt(metrics.needsWatchPush)} sub="finish training first" tone={metrics.needsWatchPush ? "warn" : "neutral"} />
          <Metric label="Setter push" value={fmt(metrics.readyForSetterPush)} sub="ready, not pushed" tone={metrics.readyForSetterPush ? "bad" : "neutral"} />
          <Metric label="Booking intent" value={fmt(metrics.bookingIntent)} sub="clicked CTA/bundle" tone={metrics.bookingIntent ? "bad" : "neutral"} />
          <Metric label="Booked" value={fmt(metrics.bookedCalls)} sub="Hybrid calls booked" tone="good" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <LeadList title="Setter push now" rows={metrics.readyLeads} empty="No VCC-ready leads waiting for a setter push." />
        <LeadList title="Booking / upsell intent" rows={metrics.bookingIntentLeads} empty="No new booking or bundle-click intent in this range." />
        <LeadList title="Watch recovery" rows={metrics.watchPushLeads} empty="No Hybrid leads stuck before the Veterans Cheat Code section." />
      </div>
    </div>
  );
}
