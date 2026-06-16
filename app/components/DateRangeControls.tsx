import Link from "next/link";
import { DateRange, Period } from "@/lib/date-range";

const tabs: Array<{ period: Period; label: string }> = [
  { period: "today", label: "Today" },
  { period: "week", label: "This week" },
  { period: "last_week", label: "Last week" },
  { period: "month", label: "This month" },
  { period: "last_month", label: "Last month" },
];

export function DateRangeControls({
  range,
  basePath = "/dashboard",
  compact = false,
}: {
  range: DateRange;
  basePath?: string;
  compact?: boolean;
}) {
  return (
    <div className={compact ? "rounded-lg border border-white/10 bg-black/18 p-3" : "lgh-panel rounded-lg p-4"}>
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className={compact ? "flex flex-wrap items-center gap-x-3 gap-y-1" : ""}>
          <div className="text-xs font-extrabold uppercase tracking-[0.08em] text-white/88">Time frame</div>
          <div className="text-xs text-white/45">
            {range.start} to {range.end}
          </div>
        </div>

        <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => {
              const active = range.period === tab.period;
              return (
                <Link
                  key={tab.period}
                  href={`${basePath}?period=${tab.period}`}
                  className={[
                    "rounded-lg border px-2.5 py-1.5 text-xs font-bold no-underline transition",
                    active
                      ? "border-red-500/40 bg-red-500/[0.18] text-white"
                      : "border-white/10 bg-white/[0.04] text-white/58 hover:border-red-500/30 hover:text-white",
                  ].join(" ")}
                >
                  {tab.label}
                </Link>
              );
            })}
          </div>

          <form action={basePath} className="flex flex-wrap items-center gap-2">
            <input type="hidden" name="period" value="custom" />
            <input
              type="date"
              name="start"
              defaultValue={range.start}
              className="rounded-lg border border-white/10 bg-black/30 px-2.5 py-1.5 text-xs text-white outline-none"
              aria-label="Start date"
            />
            <span className="text-white/35">to</span>
            <input
              type="date"
              name="end"
              defaultValue={range.end}
              className="rounded-lg border border-white/10 bg-black/30 px-2.5 py-1.5 text-xs text-white outline-none"
              aria-label="End date"
            />
            <button className="rounded-lg bg-[var(--lgh-gold)] px-3 py-1.5 text-xs font-extrabold text-black">Apply</button>
          </form>
        </div>
      </div>
    </div>
  );
}
