"use client";

import { FormEvent, useMemo, useRef, useState } from "react";
import { TeamMember } from "@/lib/supabase";

type Field = {
  id: string;
  label: string;
  type: "number" | "text";
  wide?: boolean;
};

const fieldsByRole: Record<string, Field[]> = {
  setter: [
    { id: "webbi_leads_contacted", label: "Leads contacted", type: "number" },
    { id: "calls_booked", label: "Calls booked", type: "number" },
    { id: "calls_showed", label: "Calls showed", type: "number" },
    { id: "webbi_reroutes", label: "Reroutes", type: "number" },
    { id: "notes", label: "Notes", type: "text", wide: true },
  ],
  closer: [
    { id: "calls_taken", label: "Calls taken", type: "number" },
    { id: "calls_booked", label: "Follow-up booked", type: "number" },
    { id: "no_shows", label: "No-shows", type: "number" },
    { id: "deals_closed", label: "Deals closed", type: "number" },
    { id: "revenue_collected", label: "Cash collected", type: "number" },
    { id: "notes", label: "Notes", type: "text", wide: true },
  ],
  credit: [
    { id: "new_clients", label: "New clients", type: "number" },
    { id: "sweeps_started", label: "Sweeps started", type: "number" },
    { id: "active_clients", label: "Active clients", type: "number" },
    { id: "funding_ready", label: "Funding ready", type: "number" },
    { id: "stalled_clients", label: "Stalled clients", type: "number" },
    { id: "notes", label: "Notes", type: "text", wide: true },
  ],
  fulfillment: [
    { id: "new_clients_onboarded", label: "New clients onboarded", type: "number" },
    { id: "sweeps_started", label: "Sweeps started", type: "number" },
    { id: "active_credit_clients", label: "Active credit clients", type: "number" },
    { id: "clients_with_weekly_action", label: "Clients with action", type: "number" },
    { id: "funding_ready_clients", label: "Funding ready", type: "number" },
    { id: "stalled_clients", label: "Stalled clients", type: "number" },
    { id: "notes", label: "Notes", type: "text", wide: true },
  ],
  ea: [
    { id: "new_clients_onboarded", label: "New clients onboarded", type: "number" },
    { id: "cash_recovered_hac", label: "Cash recovered", type: "number" },
    { id: "hac_past_due", label: "Past due", type: "number" },
    { id: "fu_30_60_90_conducted", label: "Follow-ups done", type: "number" },
    { id: "tasks_completed", label: "Tasks done", type: "number" },
    { id: "emails_managed", label: "Emails handled", type: "number" },
    { id: "appointments_scheduled", label: "Appointments set", type: "number" },
    { id: "follow_ups_sent", label: "Follow-ups sent", type: "number" },
    { id: "notes", label: "Notes", type: "text", wide: true },
  ],
};

function roleType(role: string) {
  const r = role.toLowerCase();
  if (r.includes("setter") || r.includes("book calls")) return "setter";
  if (r.includes("closer") || r.includes("sales advisor")) return "closer";
  if (r.includes("credit")) return "credit";
  if (r.includes("fulfil") || r.includes("fulfill")) return "fulfillment";
  if (r.includes("ea") || r.includes("executive") || r.includes("assistant") || r.includes("ops")) return "ea";
  return "";
}

export function ReportForm({ team }: { team: TeamMember[] }) {
  const [memberId, setMemberId] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "ok" | "error">("idle");
  const [message, setMessage] = useState("");
  const memberSelectRef = useRef<HTMLSelectElement | null>(null);
  const member = team.find((item) => item.id === memberId);
  const type = member ? roleType(member.role || "") : "";
  const fields = useMemo(() => (type ? fieldsByRole[type] || [] : []), [type]);
  const canSubmit = fields.length > 0 && status !== "sending";

  function handleBlockedSubmit() {
    if (!member) {
      setStatus("idle");
      setMessage("Choose your team member first.");
      memberSelectRef.current?.focus();
      return;
    }

    if (!type) {
      setStatus("error");
      setMessage("This role does not have a report form yet.");
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!member || !type) return;
    setStatus("sending");
    setMessage("Saving...");

    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const values: Record<string, string> = {};
    for (const field of fields) {
      values[field.id] = String(form.get(field.id) || "");
    }

    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberName: member.name, roleType: type, values }),
      });

      if (res.ok) {
        formElement.reset();
        setMemberId("");
        setStatus("ok");
        setMessage("Report saved.");
        return;
      }

      const body = await res.json().catch(() => ({}));
      setStatus("error");
      setMessage(body.error || "Report did not save.");
    } catch {
      setStatus("error");
      setMessage("Report did not save. Try again.");
    }
  }

  return (
    <form onSubmit={submit} className="lgh-panel rounded-lg p-5">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
        <div>
          <div className="text-sm font-extrabold uppercase tracking-[0.08em] text-white/88">Submit daily numbers</div>
          <p className="mt-2 text-sm leading-6 text-white/52">
            Pick a team member, enter the day&apos;s numbers, and save it to the dashboard.
          </p>
        </div>
        <select
          ref={memberSelectRef}
          value={memberId}
          onChange={(event) => {
            setMemberId(event.target.value);
            setStatus("idle");
            setMessage("");
          }}
          className="h-11 rounded-lg border border-white/10 bg-black/30 px-3 text-sm text-white outline-none"
          required
        >
          <option value="">Choose team member...</option>
          {team.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name} - {item.role}
            </option>
          ))}
        </select>
      </div>

      {member && !type ? (
        <div className="mt-5 rounded-lg border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-200">
          This role does not have a form yet.
        </div>
      ) : null}

      {fields.length ? (
        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          {fields.map((field) => (
            <label key={field.id} className={field.wide ? "md:col-span-2" : ""}>
              <span className="text-xs font-bold uppercase tracking-[0.08em] text-white/45">{field.label}</span>
              <input
                name={field.id}
                type={field.type}
                min={field.type === "number" ? "0" : undefined}
                step={field.type === "number" ? "1" : undefined}
                className="mt-2 h-11 w-full rounded-lg border border-white/10 bg-black/30 px-3 text-sm text-white outline-none"
                placeholder={field.type === "number" ? "0" : "Notes"}
              />
            </label>
          ))}
        </div>
      ) : null}

      <div className="mt-5 flex flex-wrap items-center gap-3">
        {fields.length ? (
          <button
            disabled={!canSubmit}
            className="rounded-lg bg-[var(--lgh-gold)] px-4 py-2 text-sm font-extrabold text-black disabled:cursor-not-allowed disabled:opacity-45"
          >
            {status === "sending" ? "Saving..." : "Save report"}
          </button>
        ) : (
          <button
            type="button"
            onClick={handleBlockedSubmit}
            className="rounded-lg bg-[var(--lgh-gold)] px-4 py-2 text-sm font-extrabold text-black"
          >
            {member ? "This role is not ready yet" : "Choose team member first"}
          </button>
        )}
        {message ? (
          <span className={status === "error" ? "text-sm text-rose-300" : "text-sm text-emerald-300"}>{message}</span>
        ) : null}
      </div>
    </form>
  );
}
