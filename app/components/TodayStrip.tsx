import { Card, Stat } from "./Card";
import { fromViewOne, TodaySnapshot } from "@/lib/supabase";

const fmtMoney = (n: number | null) =>
  n == null ? "—" : `$${Number(n).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
const fmtNum = (n: number | null | undefined) => (n == null ? "—" : Number(n).toLocaleString());
const deltaPct = (today: number, yest: number) => {
  if (!yest) return today > 0 ? "+∞ vs yesterday" : "0 vs yesterday";
  const d = ((today - yest) / yest) * 100;
  const sign = d >= 0 ? "+" : "";
  return `${sign}${d.toFixed(0)}% vs yesterday`;
};

export async function TodayStrip() {
  const snap = await fromViewOne<TodaySnapshot>("v_today_snapshot");
  const s = snap ?? ({
    ad_spend_today: 0,
    registrations_today: 0,
    registrations_yesterday: 0,
    calls_today: 0,
    booked_today: 0,
    deals_today: 0,
    revenue_today: 0,
    open_queue: 0,
    hot_now: 0,
    cpl_today: null,
  } as TodaySnapshot);

  return (
    <Card title="Today" subtitle={new Date().toUTCString().slice(0, 16)}>
      <div className="grid grid-cols-2 gap-5 md:grid-cols-4 xl:grid-cols-7">
        <Stat label="Ad money spent" value={fmtMoney(s.ad_spend_today)} />
        <Stat
          label="New sign-ups"
          value={fmtNum(s.registrations_today)}
          delta={deltaPct(s.registrations_today, s.registrations_yesterday)}
        />
        <Stat label="Cost per lead" value={fmtMoney(s.cpl_today)} />
        <Stat label="Calls made" value={fmtNum(s.calls_today)} sub={`${s.booked_today} booked`} />
        <Stat label="Deals" value={fmtNum(s.deals_today)} good={s.deals_today > 0} />
        <Stat label="Cash won" value={fmtMoney(s.revenue_today)} good={s.revenue_today > 0} />
        <Stat
          label="Hot leads"
          value={fmtNum(s.hot_now)}
          sub={`${s.open_queue} total leads open`}
          bad={s.hot_now > 5}
        />
      </div>
    </Card>
  );
}
