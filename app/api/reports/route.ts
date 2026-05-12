import { NextRequest, NextResponse } from "next/server";
import { insertRow } from "@/lib/supabase";
import { weekOf } from "@/lib/date-range";

const tableByRole: Record<string, string> = {
  setter: "setter_logs",
  closer: "closer_logs",
  credit: "credit_repair",
  fulfillment: "fulfillment_logs",
  ea: "ea_logs",
};

const allowedFields: Record<string, string[]> = {
  setter: ["webbi_leads_contacted", "calls_booked", "calls_showed", "webbi_reroutes", "notes"],
  closer: ["calls_taken", "calls_booked", "no_shows", "deals_closed", "revenue_collected", "notes"],
  credit: ["new_clients", "sweeps_started", "active_clients", "funding_ready", "stalled_clients", "notes"],
  fulfillment: [
    "new_clients_onboarded",
    "sweeps_started",
    "active_credit_clients",
    "clients_with_weekly_action",
    "funding_ready_clients",
    "stalled_clients",
    "notes",
  ],
  ea: [
    "new_clients_onboarded",
    "cash_recovered_hac",
    "hac_past_due",
    "fu_30_60_90_conducted",
    "tasks_completed",
    "emails_managed",
    "appointments_scheduled",
    "follow_ups_sent",
    "notes",
  ],
};

function today() {
  return new Date().toISOString().slice(0, 10);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const memberName = typeof body?.memberName === "string" ? body.memberName : "";
  const roleType = typeof body?.roleType === "string" ? body.roleType : "";
  const values = body?.values && typeof body.values === "object" ? body.values : {};
  const table = tableByRole[roleType];
  const fields = allowedFields[roleType];

  if (!memberName || !table || !fields) {
    return NextResponse.json({ error: "Missing team member or role." }, { status: 400 });
  }

  const date = today();
  const row: Record<string, unknown> = { team_member: memberName };
  if (roleType === "closer" || roleType === "credit") row.week_of = weekOf(date);
  else row.date = date;

  for (const field of fields) {
    const value = values[field];
    if (field === "notes") {
      row[field] = typeof value === "string" && value.trim() ? value.trim() : null;
    } else {
      row[field] = value === "" || value == null ? 0 : Number(value) || 0;
    }
  }

  if (roleType === "closer") {
    const calls = Number(row.calls_taken) || 0;
    const deals = Number(row.deals_closed) || 0;
    row.close_rate_pct = calls > 0 ? Math.round((deals / calls) * 100) : 0;
  }

  const result = await insertRow(table, row);
  if (!result.ok) {
    return NextResponse.json({ error: result.error || "Could not save report." }, { status: result.status || 500 });
  }

  return NextResponse.json({ ok: true });
}
