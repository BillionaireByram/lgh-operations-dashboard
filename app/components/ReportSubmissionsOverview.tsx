import { DateRange, weekOf } from "@/lib/date-range";
import { fromView, TeamMember } from "@/lib/supabase";

type ReportRow = Record<string, unknown> & {
  team_member: string | null;
  date?: string | null;
  week_of?: string | null;
};

type ReportConfig = {
  role: string;
  label: string;
  table: string;
  dateColumn: "date" | "week_of";
  fields: Array<{ id: string; label: string; money?: boolean }>;
};

const configs: ReportConfig[] = [
  {
    role: "setter",
    label: "Setter",
    table: "setter_logs",
    dateColumn: "date",
    fields: [
      { id: "webbi_leads_contacted", label: "Leads contacted" },
      { id: "calls_booked", label: "Calls booked" },
      { id: "calls_showed", label: "Calls showed" },
      { id: "webbi_reroutes", label: "Reroutes" },
      { id: "notes", label: "Notes" },
    ],
  },
  {
    role: "closer",
    label: "Closer",
    table: "closer_logs",
    dateColumn: "week_of",
    fields: [
      { id: "calls_taken", label: "Calls taken" },
      { id: "calls_booked", label: "Follow-up booked" },
      { id: "no_shows", label: "No-shows" },
      { id: "deals_closed", label: "Deals closed" },
      { id: "revenue_collected", label: "Cash collected", money: true },
      { id: "notes", label: "Notes" },
    ],
  },
  {
    role: "sales_advisor",
    label: "Sales Advisor",
    table: "sales_advisor_logs",
    dateColumn: "date",
    fields: [
      { id: "calls_dialed", label: "Calls Dialed" },
      { id: "calls_connected", label: "Calls Connected" },
      { id: "sets", label: "Sets" },
      { id: "follow_ups", label: "Follow Ups" },
      { id: "re_routes", label: "Re-Routes" },
      { id: "notes", label: "Notes" },
    ],
  },
  {
    role: "credit",
    label: "Credit Repair",
    table: "credit_repair",
    dateColumn: "week_of",
    fields: [
      { id: "new_clients", label: "New clients" },
      { id: "sweeps_started", label: "Sweeps started" },
      { id: "active_clients", label: "Active clients" },
      { id: "funding_ready", label: "Client sent for funding" },
      { id: "stalled_clients", label: "Stalled clients" },
      { id: "notes", label: "Notes" },
    ],
  },
  {
    role: "fulfillment",
    label: "Fulfillment",
    table: "fulfillment_logs",
    dateColumn: "date",
    fields: [
      { id: "new_clients_onboarded", label: "New clients onboarded" },
      { id: "sweeps_started", label: "Sweeps started" },
      { id: "active_credit_clients", label: "Active credit clients" },
      { id: "clients_with_weekly_action", label: "Clients with action" },
      { id: "funding_ready_clients", label: "Funding ready" },
      { id: "stalled_clients", label: "Stalled clients" },
      { id: "notes", label: "Notes" },
    ],
  },
  {
    role: "funding",
    label: "Funding",
    table: "funding_logs",
    dateColumn: "date",
    fields: [
      { id: "clients_received", label: "Clients received" },
      { id: "clients_submitted", label: "Leads submitted" },
      { id: "ongoing", label: "Ongoing" },
      { id: "underwriting", label: "Underwriting" },
      { id: "fulfilled", label: "Fulfilled" },
      { id: "total_funded", label: "Total funded", money: true },
      { id: "lost", label: "Client MIA" },
      { id: "backed_out", label: "Client backed out" },
      { id: "sent_back_to_credit", label: "Sent back to credit" },
      { id: "notes", label: "Notes" },
    ],
  },
  {
    role: "ea",
    label: "Executive Assistant",
    table: "ea_logs",
    dateColumn: "date",
    fields: [
      { id: "new_clients_onboarded", label: "New clients onboarded" },
      { id: "cash_recovered_hac", label: "HAC cash recovered", money: true },
      { id: "hac_past_due", label: "HAC past due" },
      { id: "follow_ups_sent", label: "Follow ups set" },
      { id: "notes", label: "Notes" },
    ],
  },
];

function roleType(role: string) {
  const value = role.toLowerCase();
  if (value.includes("sales advisor")) return "sales_advisor";
  if (value.includes("setter") || value.includes("book calls")) return "setter";
  if (value.includes("closer")) return "closer";
  if (value.includes("funding")) return "funding";
  if (value.includes("credit")) return "credit";
  if (value.includes("fulfil") || value.includes("fulfill")) return "fulfillment";
  if (value.includes("ea") || value.includes("executive") || value.includes("assistant") || value.includes("ops")) return "ea";
  return "";
}

function numberValue(value: unknown) {
  return Number(value) || 0;
}

function formatValue(value: unknown, money = false) {
  if (value == null || value === "") return "";
  if (money) return `$${Math.round(numberValue(value)).toLocaleString()}`;
  if (typeof value === "number") return value.toLocaleString();
  return String(value);
}

function memberInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function Metric({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/20 p-4">
      <div className="text-[0.68rem] font-bold uppercase tracking-[0.06em] text-white/42">{label}</div>
      <div className="mt-2 text-2xl font-semibold leading-tight tabular-nums">{value}</div>
      {sub ? <div className="mt-1 text-xs text-white/42">{sub}</div> : null}
    </div>
  );
}

async function fetchRows(config: ReportConfig, range: DateRange) {
  const select = ["team_member", config.dateColumn, ...config.fields.map((field) => field.id)].join(",");
  const start = config.dateColumn === "week_of" ? weekOf(range.start) : range.start;
  return fromView<ReportRow>(config.table, {
    query: {
      select,
      [config.dateColumn]: `gte.${start}`,
      and: `(${config.dateColumn}.lte.${range.end})`,
      order: `${config.dateColumn}.desc`,
      limit: "500",
    },
  });
}

export async function ReportSubmissionsOverview({ range, team }: { range: DateRange; team: TeamMember[] }) {
  const rowsByRole = await Promise.all(configs.map(async (config) => ({ config, rows: await fetchRows(config, range) })));
  const allRows = rowsByRole.flatMap(({ config, rows }) => rows.map((row) => ({ config, row })));
  const submittedPeople = new Set(allRows.map(({ row }) => row.team_member || "Unknown"));
  const supportedTeam = team.filter((member) => roleType(member.role || ""));
  const submittedSupported = supportedTeam.filter((member) => submittedPeople.has(member.name));
  const missing = supportedTeam.filter((member) => !submittedPeople.has(member.name));
  const moneyFields = allRows.flatMap(({ config, row }) => config.fields.filter((field) => field.money).map((field) => numberValue(row[field.id])));
  const moneyTotal = moneyFields.reduce((sum, value) => sum + value, 0);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric label="Submissions" value={allRows.length} sub={range.label} />
        <Metric label="People submitted" value={submittedPeople.size} sub={`${submittedSupported.length}/${supportedTeam.length} supported roles`} />
        <Metric label="Missing people" value={missing.length} sub="for selected range" />
        <Metric label="Report money fields" value={`$${Math.round(moneyTotal).toLocaleString()}`} sub="team-submitted cash/funding totals" />
      </div>

      {missing.length ? (
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-100">
          <span className="font-bold">Missing reports:</span>{" "}
          {missing.map((member) => `${member.name} (${member.role})`).join(", ")}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {rowsByRole.map(({ config, rows }) => (
          <div key={config.role} className="lgh-panel rounded-lg p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-extrabold uppercase tracking-[0.08em] text-white/84">{config.label}</div>
                <div className="mt-1 text-xs text-white/42">
                  {rows.length} {rows.length === 1 ? "submission" : "submissions"}
                </div>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs font-bold text-white/58">
                {config.dateColumn === "week_of" ? "Weekly" : "Daily"}
              </div>
            </div>

            {rows.length ? (
              <div className="mt-4 space-y-3">
                {rows.map((row, index) => {
                  const name = row.team_member || "Unknown";
                  const notes = String(row.notes || "");
                  const visibleFields = config.fields.filter((field) => field.id !== "notes" && row[field.id] != null);
                  return (
                    <div key={`${name}-${row.date || row.week_of}-${index}`} className="rounded-lg border border-white/10 bg-black/20 p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-red-600 text-xs font-black text-white">
                            {memberInitials(name)}
                          </div>
                          <div className="min-w-0">
                            <div className="truncate text-base font-semibold text-white">{name}</div>
                            <div className="text-xs text-white/42">
                              {config.dateColumn === "week_of" ? "Week of " : ""}
                              {String(row[config.dateColumn] || "")}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-3">
                        {visibleFields.map((field) => (
                          <div key={field.id} className="rounded-lg border border-white/8 bg-white/[0.035] p-3">
                            <div className="text-[0.65rem] font-bold uppercase tracking-[0.06em] text-white/38">{field.label}</div>
                            <div className="mt-1 text-sm font-semibold text-white/88">{formatValue(row[field.id], field.money) || "0"}</div>
                          </div>
                        ))}
                      </div>
                      {notes ? <div className="mt-3 rounded-lg bg-white/[0.035] p-3 text-sm leading-6 text-white/62">{notes}</div> : null}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="mt-4 rounded-lg border border-white/10 bg-black/20 p-4 text-sm text-white/45">
                No {config.label.toLowerCase()} submissions in this time frame.
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
