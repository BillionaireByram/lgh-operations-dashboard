import { NextRequest, NextResponse } from "next/server";
import { fromViewOne, insertRow, updateRows, upsertRow } from "@/lib/supabase";
import { weekOf } from "@/lib/date-range";

const tableByRole: Record<string, string> = {
  setter: "setter_logs",
  closer: "closer_logs",
  sales_advisor: "sales_advisor_logs",
  credit: "credit_repair",
  fulfillment: "fulfillment_logs",
  funding: "funding_logs",
  ea: "ea_logs",
};

const conflictByRole: Record<string, string> = {
  setter: "date,team_member",
  closer: "week_of,team_member",
  sales_advisor: "date,team_member",
  credit: "week_of,team_member",
  fulfillment: "date,team_member",
  funding: "date,team_member",
  ea: "date,team_member",
};

const allowedFields: Record<string, string[]> = {
  setter: ["webbi_leads_contacted", "calls_booked", "calls_showed", "webbi_reroutes", "notes"],
  closer: ["calls_taken", "calls_booked", "no_shows", "deals_closed", "revenue_collected", "notes"],
  sales_advisor: ["calls_dialed", "calls_connected", "sets", "follow_ups", "re_routes", "notes"],
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
  funding: [
    "clients_received",
    "clients_submitted",
    "ongoing",
    "underwriting",
    "fulfilled",
    "total_funded",
    "lost",
    "backed_out",
    "sent_back_to_credit",
    "notes",
  ],
  ea: [
    "new_clients_onboarded",
    "cash_recovered_hac",
    "hac_past_due",
    "follow_ups_sent",
    "notes",
  ],
};

function today() {
  return new Date().toISOString().slice(0, 10);
}

function reportDate(value: unknown) {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  return today();
}

function lookupQuery(roleType: string, memberName: string, date: string): Record<string, string> {
  if (roleType === "closer" || roleType === "credit") {
    return { week_of: `eq.${weekOf(date)}`, team_member: `eq.${memberName}` };
  }
  return { date: `eq.${date}`, team_member: `eq.${memberName}` };
}

function reportDateColumn(roleType: string) {
  return roleType === "closer" || roleType === "credit" ? "week_of" : "date";
}

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const memberName = params.get("memberName") || "";
  const roleType = params.get("roleType") || "";
  const date = reportDate(params.get("date"));
  const table = tableByRole[roleType];
  const fields = allowedFields[roleType];

  if (!memberName || !table || !fields) {
    return NextResponse.json({ error: "Missing team member or role." }, { status: 400 });
  }

  const row = await fromViewOne<Record<string, unknown>>(table, {
    query: {
      select: [...fields, reportDateColumn(roleType), "team_member"].join(","),
      ...lookupQuery(roleType, memberName, date),
      limit: "1",
    },
    revalidate: 0,
  });

  if (!row) {
    return NextResponse.json({ ok: true, report: null, date, weekOf: weekOf(date) });
  }

  const values: Record<string, unknown> = {};
  for (const field of fields) values[field] = row[field] ?? "";

  return NextResponse.json({ ok: true, report: { values }, date, weekOf: weekOf(date) });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const memberName = typeof body?.memberName === "string" ? body.memberName : "";
  const roleType = typeof body?.roleType === "string" ? body.roleType : "";
  const date = reportDate(body?.date);
  const values = body?.values && typeof body.values === "object" ? body.values : {};
  const table = tableByRole[roleType];
  const fields = allowedFields[roleType];
  const conflictTarget = conflictByRole[roleType];

  if (!memberName || !table || !fields || !conflictTarget) {
    return NextResponse.json({ error: "Missing team member or role." }, { status: 400 });
  }

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

  if (roleType === "funding") {
    const fulfilled = Number(row.fulfilled) || 0;
    const totalFunded = Number(row.total_funded) || 0;
    row.avg_per_client = fulfilled > 0 ? Math.round(totalFunded / fulfilled) : 0;
  }

  let result = await upsertRow(table, row, conflictTarget);

  // Legacy report tables can be missing the unique constraint that Supabase
  // needs for `on_conflict`, and some deployed schemas still raise duplicate
  // key errors instead of merging. Keep the save working by updating the
  // matching report row first, then inserting only if no row exists.
  if (!result.ok && shouldFallbackToUpdate(result.error)) {
    const updated = await updateRows(table, row, lookupQuery(roleType, memberName, date));
    if (updated.ok && updated.rows.length > 0) {
      result = { ok: true, status: updated.status, error: null };
    } else if (updated.ok) {
      result = await insertRow(table, row);
    } else {
      result = { ok: false, status: updated.status, error: updated.error };
    }
  }

  if (!result.ok) {
    return NextResponse.json({ error: result.error || "Could not save report." }, { status: result.status || 500 });
  }

  return NextResponse.json({ ok: true, saved: "upserted" });
}

function shouldFallbackToUpdate(error: unknown) {
  const message = String(error || "");
  return (
    message.includes("42P10") ||
    message.includes("23505") ||
    message.toLowerCase().includes("duplicate key value violates unique constraint")
  );
}
