import { Card, Pill } from "./Card";
import { DateRange } from "@/lib/date-range";
import { centralRangeQuery } from "@/lib/hybrid-metrics";
import { fromView, CallQueueRow } from "@/lib/supabase";

function ago(iso: string | null) {
  if (!iso) return "—";
  const ms = Date.now() - new Date(iso).getTime();
  const min = Math.round(ms / 60_000);
  if (min < 60) return `${min}m`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h`;
  return `${Math.round(hr / 24)}d`;
}

const actionTone: Record<string, "good" | "warn" | "bad" | "info" | "neutral"> = {
  hot_closer: "bad",
  fire_hot_closer: "bad",
  re_engage_hot: "warn",
  "re-engage_hot": "warn",
  qualify_inbound: "info",
  confirm_show_rate: "good",
  no_show_recovery: "warn",
  post_registration: "info",
  send_reminder: "good",
  nurture: "neutral",
  done: "good",
};

const simpleStep: Record<string, string> = {
  registered: "Signed up",
  called: "Called",
  post_registration: "Needs attendance",
  post_webinar: "Attended",
  attended: "Attended",
  attended_partial: "Attended",
  attended_75pct: "Attended",
  high_intent: "High intent",
  no_show: "Missed call",
  booked: "Booked",
  closed: "Bought",
};

const simpleAction: Record<string, string> = {
  hot_closer: "Call now",
  fire_hot_closer: "Call now",
  re_engage_hot: "Re-engage",
  "re-engage_hot": "Re-engage",
  qualify_inbound: "Qualify",
  confirm_show_rate: "Confirm show",
  no_show_recovery: "Reschedule",
  post_registration: "Push to watch",
  send_reminder: "Send reminder",
  nurture: "Keep warm",
  done: "Done",
};

const simpleOutcome: Record<string, string> = {
  no_answer: "No answer",
  voicemail: "Voicemail",
  answered: "Answered",
  booked: "Booked",
  interested: "Interested",
  not_interested: "Not interested",
};

function simpleLabel(value: string | null | undefined, fallback = "Needs review") {
  if (!value) return fallback;
  return (
    simpleStep[value] ||
    simpleAction[value] ||
    simpleOutcome[value] ||
    value
      .split("_")
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ")
  );
}

const internalPattern = /(codex|browser|test|byram|trevor|puregenius|letsgeauxhustle@gmail\.com)/i;
const activeActions = new Set(["fire_hot_closer", "hot_closer", "re_engage_hot", "re-engage_hot", "qualify_inbound", "no_show_recovery", "send_reminder"]);

function isInternal(row: CallQueueRow) {
  return internalPattern.test([row.name, row.email, row.phone, row.utm_source].filter(Boolean).join(" "));
}

function signal(row: CallQueueRow) {
  if (row.attended) return "Attended training";
  if (row.intent_score && row.intent_score >= 75) return `${row.intent_score} intent score`;
  if (row.last_call_booked) return "Booked flag";
  if (row.last_call_outcome) return simpleLabel(row.last_call_outcome);
  return row.utm_source ? sourceLabel(row.utm_source) : "No clear signal";
}

function sourceLabel(source: string) {
  const value = source.toLowerCase();
  if (value === "fb") return "Facebook";
  if (value === "ig") return "Instagram";
  return simpleLabel(source);
}

export async function CallQueue({ range }: { range?: DateRange }) {
  const rangeQuery = range ? centralRangeQuery(range) : null;
  const rows = await fromView<CallQueueRow>("v_call_queue", {
    query: {
      ...(rangeQuery ? { registered_at: `gte.${rangeQuery.startIso}`, and: `(registered_at.lte.${rangeQuery.endIso})` } : {}),
      order: "priority.asc,intent_score.desc.nullslast,registered_at.desc",
      limit: "100",
    },
  });

  const cleanRows = rows.filter((row) => !isInternal(row));
  const activeRows = cleanRows.filter((row) => activeActions.has(row.next_action) && row.priority <= 10).slice(0, 20);
  const nurtureRows = cleanRows
    .filter((row) => !activeRows.some((active) => active.registration_id === row.registration_id))
    .filter((row) => row.next_action === "nurture" || row.last_call_outcome)
    .slice(0, 10);

  return (
    <div className="grid gap-4">
      <Card title="Human Follow-Up Queue" subtitle={`${activeRows.length} active call handoffs${range ? ` for ${range.label.toLowerCase()}` : ""}. Lower-priority nurture is separated below.`}>
      <div className="overflow-x-auto -mx-2">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-white/50 uppercase text-xs tracking-wide">
              <th className="px-2 py-2">Lead</th>
              <th className="px-2 py-2">Trigger</th>
              <th className="px-2 py-2">Signal</th>
              <th className="px-2 py-2">Last touch</th>
              <th className="px-2 py-2">Human move</th>
              <th className="px-2 py-2 text-right">Priority</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {activeRows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-2 py-6 text-center text-white/40">
                  No urgent human calls right now.
                </td>
              </tr>
            ) : (
              activeRows.map((r) => (
                <tr key={r.registration_id} className="tabular-nums hover:bg-white/5">
                  <td className="px-2 py-1.5">
                    <div className="text-white">{r.name || r.email || r.phone || "—"}</div>
                    <div className="text-xs text-white/40">{r.phone || r.email || "contact missing"}</div>
                  </td>
                  <td className="px-2 py-1.5">
                    <Pill tone={r.attended ? "good" : "neutral"}>{simpleLabel(r.funnel_stage)}</Pill>
                  </td>
                  <td className="px-2 py-1.5 text-white/70">{signal(r)}</td>
                  <td className="px-2 py-1.5">
                    <div className="text-white/80">{simpleLabel(r.last_call_outcome, "Not called yet")}</div>
                    <div className="text-xs text-white/40">{r.last_call_at ? `${ago(r.last_call_at)} ago` : "ready"}</div>
                  </td>
                  <td className="px-2 py-1.5">
                    <Pill tone={actionTone[r.next_action] ?? "neutral"}>{simpleLabel(r.next_action)}</Pill>
                  </td>
                  <td className="px-2 py-1.5 text-right text-white/60">P{r.priority}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Card>
      <Card title="Recent Nurture Queue" subtitle={`${nurtureRows.length} lower-priority leads. These are not immediate Trevor call handoffs.`}>
        <div className="overflow-x-auto -mx-2">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-white/50 uppercase text-xs tracking-wide">
                <th className="px-2 py-2">Lead</th>
                <th className="px-2 py-2">Source</th>
                <th className="px-2 py-2">Last call</th>
                <th className="px-2 py-2">Next move</th>
                <th className="px-2 py-2 text-right">Priority</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {nurtureRows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-2 py-6 text-center text-white/40">
                    No nurture leads loaded.
                  </td>
                </tr>
              ) : (
                nurtureRows.map((r) => (
                  <tr key={r.registration_id} className="tabular-nums hover:bg-white/5">
                    <td className="px-2 py-1.5">
                      <div className="text-white">{r.name || r.email || r.phone || "—"}</div>
                      <div className="text-xs text-white/40">{r.phone || r.email || "contact missing"}</div>
                    </td>
                    <td className="px-2 py-1.5 text-white/70">{r.utm_source ? sourceLabel(r.utm_source) : "Missing"}</td>
                    <td className="px-2 py-1.5">
                      <div className="text-white/80">{simpleLabel(r.last_call_outcome, "Not called yet")}</div>
                      <div className="text-xs text-white/40">{r.last_call_at ? `${ago(r.last_call_at)} ago` : "ready"}</div>
                    </td>
                    <td className="px-2 py-1.5">
                      <Pill tone={actionTone[r.next_action] ?? "neutral"}>{simpleLabel(r.next_action)}</Pill>
                    </td>
                    <td className="px-2 py-1.5 text-right text-white/60">P{r.priority}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
