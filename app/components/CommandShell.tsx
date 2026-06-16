import Link from "next/link";
import { CSSProperties, ReactNode } from "react";

type NavKey =
  | "dashboard"
  | "ads"
  | "calls"
  | "deals"
  | "intelligence"
  | "agentOps"
  | "voice"
  | "messages"
  | "reports"
  | "health";

const navItems: Array<{ key: NavKey; href: string; label: string; sub: string }> = [
  { key: "dashboard", href: "/dashboard", label: "Dashboard", sub: "Today at a glance" },
  { key: "reports", href: "/reports", label: "Reports", sub: "Submit numbers" },
  { key: "intelligence", href: "/intelligence", label: "Intelligence", sub: "Weekly moves" },
  { key: "voice", href: "/conversations/voice", label: "Voice Calls", sub: "Retell + calendar" },
  { key: "messages", href: "/conversations/messages", label: "Messages", sub: "SMS + DM threads" },
  { key: "ads", href: "/ads", label: "Ads", sub: "What is working" },
  { key: "calls", href: "/calls", label: "Calls", sub: "Human follow-up" },
  { key: "deals", href: "/deals", label: "Deals", sub: "Money won" },
  { key: "health", href: "/health", label: "Health", sub: "What needs attention" },
  { key: "agentOps", href: "/agent-ops", label: "Agent Ops", sub: "Commander computer" },
];

const particles = [
  ["6%", "92%", "30px", "18s", "-2s"],
  ["14%", "78%", "-20px", "22s", "-8s"],
  ["22%", "88%", "42px", "20s", "-12s"],
  ["34%", "82%", "-36px", "24s", "-4s"],
  ["42%", "96%", "18px", "19s", "-10s"],
  ["51%", "86%", "-24px", "26s", "-6s"],
  ["63%", "94%", "34px", "21s", "-14s"],
  ["72%", "80%", "-18px", "23s", "-5s"],
  ["81%", "91%", "26px", "25s", "-11s"],
  ["90%", "84%", "-30px", "20s", "-7s"],
  ["96%", "98%", "16px", "27s", "-16s"],
  ["11%", "102%", "-14px", "28s", "-18s"],
];

function timeStamp() {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/New_York",
  }).format(new Date());
}

export function greeting() {
  const hour = Number(
    new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      hour12: false,
      timeZone: "America/New_York",
    }).format(new Date())
  );
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function CommandShell({
  active,
  eyebrow = "LGH OS",
  title,
  subtitle,
  children,
  rightRail,
  showQuickActions = true,
}: {
  active: NavKey;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
  rightRail?: ReactNode;
  showQuickActions?: boolean;
}) {
  return (
    <main className="lgh-shell h-screen overflow-hidden text-white">
      <div className="lgh-particles" aria-hidden="true">
        {particles.map(([x, y, dx, duration, delay], i) => (
          <span
            key={`${x}-${i}`}
            style={
              {
                "--x": x,
                "--y": y,
                "--dx": dx,
                "--duration": duration,
                "--delay": delay,
              } as CSSProperties
            }
          />
        ))}
      </div>
      <div className="relative z-10 grid h-screen grid-cols-1 overflow-hidden lg:grid-cols-[248px_minmax(0,1fr)]">
        <aside className="border-b border-[var(--lgh-line)] bg-black/35 px-4 py-4 backdrop-blur-xl lg:h-screen lg:overflow-hidden lg:border-b-0 lg:border-r lg:px-5 lg:py-6">
          <div className="flex h-full flex-col">
            <Link href="/dashboard" className="flex items-center gap-3 text-white no-underline">
              <div className="grid h-11 w-11 place-items-center rounded-lg border border-white/15 bg-gradient-to-br from-[var(--lgh-red)] to-[var(--lgh-red-dark)] shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_0_24px_rgba(225,6,0,0.25)]">
                <span className="text-[0.72rem] font-black tracking-[0.12em] text-white">LGH</span>
              </div>
              <div>
                <div className="text-sm font-extrabold leading-none">Let&apos;s Geaux Hustle</div>
                <div className="mt-1 text-[0.63rem] font-bold uppercase tracking-[0.18em] text-white/42">Revenue dashboard</div>
              </div>
            </Link>

            <nav className="mt-7 flex gap-2 overflow-x-auto pb-1 lg:grid lg:overflow-visible lg:pb-0">
              {navItems.map((item) => {
                const isActive = item.key === active;
                return (
                  <Link
                    key={item.key}
                    href={item.href}
                    className={[
                      "group flex min-w-[170px] items-center gap-3 rounded-lg border px-3 py-3 text-sm no-underline transition lg:min-w-0",
                      isActive
                        ? "border-red-500/30 bg-red-500/[0.12] text-white"
                        : "border-transparent text-white/55 hover:border-red-500/20 hover:bg-red-500/[0.08] hover:text-white",
                    ].join(" ")}
                  >
                    <span className={isActive ? "nav-mark active" : "nav-mark"} />
                    <span className="min-w-0">
                      <span className="block font-semibold leading-4">{item.label}</span>
                      <span className="mt-0.5 block truncate text-[0.68rem] text-white/38">{item.sub}</span>
                    </span>
                  </Link>
                );
              })}
            </nav>

            <div className="mt-auto hidden space-y-3 border-t border-[var(--lgh-line)] pt-5 text-xs text-white/50 lg:block">
              <div className="flex items-center justify-between">
                <span>Owner</span>
                <strong className="text-white/78">Trevor</strong>
              </div>
              <div className="flex items-center justify-between">
                <span>Agent</span>
                <strong className="text-white/78">Commander</strong>
              </div>
              <div className="flex items-center justify-between">
                <span>Mode</span>
                <strong className="text-[var(--lgh-gold)]">Revenue Ops</strong>
              </div>
            </div>
          </div>
        </aside>

        <section className="min-h-0 min-w-0 overflow-y-auto px-4 py-5 sm:px-6 lg:h-screen lg:px-8">
          <div className="mx-auto max-w-[1220px]">
            <div className="mb-5 flex flex-col gap-3 border-b border-red-500/10 pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 text-[0.68rem] font-bold uppercase tracking-[0.2em] text-white/52">
                <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_18px_rgba(52,211,153,0.75)]" />
                Live dashboard
              </div>
              <div className="font-mono text-[0.68rem] uppercase tracking-[0.16em] text-white/38">{timeStamp()} ET</div>
            </div>

            <div className={rightRail ? "grid grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_360px]" : "grid grid-cols-1"}>
              <header className="lgh-panel lgh-hero relative overflow-hidden rounded-lg p-5 sm:p-6">
                <div className="relative">
                  <div className="text-[0.72rem] font-extrabold uppercase tracking-[0.2em] text-[var(--lgh-gold)]">{eyebrow}</div>
                  <h1 className="mt-3 max-w-4xl text-3xl font-black leading-[0.96] tracking-[-0.035em] text-white sm:text-[2.9rem]">
                    {title}
                  </h1>
                  {subtitle ? <p className="mt-3 max-w-2xl text-sm leading-6 text-white/62 sm:text-base">{subtitle}</p> : null}
                  {showQuickActions ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Link href="/calls" className="rounded-lg bg-[var(--lgh-gold)] px-4 py-2 text-sm font-extrabold text-black no-underline">
                        Work hot leads
                      </Link>
                      <Link href="/reports" className="rounded-lg border border-white/12 bg-white/5 px-4 py-2 text-sm font-bold text-white no-underline hover:bg-white/8">
                        Submit report
                      </Link>
                      <Link href="/ads" className="rounded-lg border border-white/12 bg-white/5 px-4 py-2 text-sm font-bold text-white no-underline hover:bg-white/8">
                        Review ads
                      </Link>
                      <Link href="/health" className="rounded-lg border border-white/12 bg-white/5 px-4 py-2 text-sm font-bold text-white no-underline hover:bg-white/8">
                        Check data
                      </Link>
                      <Link href="/intelligence" className="rounded-lg border border-white/12 bg-white/5 px-4 py-2 text-sm font-bold text-white no-underline hover:bg-white/8">
                        See intelligence
                      </Link>
                      <Link href="/conversations/voice" className="rounded-lg border border-white/12 bg-white/5 px-4 py-2 text-sm font-bold text-white no-underline hover:bg-white/8">
                        View voice
                      </Link>
                      <Link href="/conversations/messages" className="rounded-lg border border-white/12 bg-white/5 px-4 py-2 text-sm font-bold text-white no-underline hover:bg-white/8">
                        View messages
                      </Link>
                    </div>
                  ) : null}
                </div>
              </header>

              {rightRail ? rightRail : null}
            </div>

            <div className="mt-5">{children}</div>
          </div>
        </section>
      </div>
    </main>
  );
}

export function PageSection({ label, title, children }: { label: string; title: string; children: ReactNode }) {
  return (
    <section className="mt-7">
      <div className="mb-3 flex items-center gap-3">
        <div className="font-mono text-[0.72rem] font-bold uppercase tracking-[0.18em] text-[var(--lgh-gold)]">{label}</div>
        <div className="h-px flex-1 bg-gradient-to-r from-red-500/18 to-transparent" />
      </div>
      <h2 className="mb-4 text-2xl font-semibold tracking-tight">{title}</h2>
      {children}
    </section>
  );
}
