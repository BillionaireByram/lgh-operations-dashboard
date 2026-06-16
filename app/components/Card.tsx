import { ReactNode } from "react";

export function Card({
  title,
  subtitle,
  children,
  className = "",
}: {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`lgh-panel rounded-lg p-5 backdrop-blur ${className}`}>
      {title ? (
        <div className="mb-4 flex flex-col gap-1">
          <h2 className="text-sm font-extrabold tracking-[0.08em] text-white/88 uppercase">{title}</h2>
          {subtitle ? <p className="text-xs leading-5 text-white/48">{subtitle}</p> : null}
        </div>
      ) : null}
      {children}
    </div>
  );
}

export function Stat({
  label,
  value,
  delta,
  sub,
  good,
  bad,
}: {
  label: string;
  value: string | number;
  delta?: string;
  sub?: string;
  good?: boolean;
  bad?: boolean;
}) {
  const color = good ? "text-emerald-400" : bad ? "text-rose-400" : "text-white";
  return (
    <div className="min-w-0 border-l border-white/10 pl-3 first:border-l-0 first:pl-0">
      <div className="text-[0.7rem] uppercase tracking-[0.08em] text-white/48">{label}</div>
      <div className={`mt-1 text-2xl font-semibold tabular-nums ${color}`}>{value}</div>
      {delta ? <div className="text-xs text-white/60">{delta}</div> : null}
      {sub ? <div className="text-xs text-white/40">{sub}</div> : null}
    </div>
  );
}

export function Pill({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "good" | "warn" | "bad" | "info" }) {
  const cls = {
    neutral: "bg-white/10 text-white/70",
    good: "bg-emerald-500/20 text-emerald-300",
    warn: "bg-amber-500/20 text-amber-300",
    bad: "bg-rose-500/20 text-rose-300",
    info: "bg-sky-500/20 text-sky-300",
  }[tone];
  return <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-semibold ${cls}`}>{children}</span>;
}
