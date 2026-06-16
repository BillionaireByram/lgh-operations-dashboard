"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
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
  sales_advisor: [
    { id: "calls_dialed", label: "Calls Dialed", type: "number" },
    { id: "calls_connected", label: "Calls Connected", type: "number" },
    { id: "sets", label: "Sets", type: "number" },
    { id: "follow_ups", label: "Follow Ups", type: "number" },
    { id: "re_routes", label: "Re-Routes", type: "number" },
    { id: "notes", label: "Notes", type: "text", wide: true },
  ],
  credit: [
    { id: "new_clients", label: "New clients", type: "number" },
    { id: "sweeps_started", label: "Sweeps started", type: "number" },
    { id: "active_clients", label: "Active clients", type: "number" },
    { id: "funding_ready", label: "Client sent for funding", type: "number" },
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
  funding: [
    { id: "clients_received", label: "Clients received", type: "number" },
    { id: "clients_submitted", label: "Leads submitted", type: "number" },
    { id: "ongoing", label: "Ongoing", type: "number" },
    { id: "underwriting", label: "Underwriting", type: "number" },
    { id: "fulfilled", label: "Fulfilled", type: "number" },
    { id: "total_funded", label: "Total funded", type: "number" },
    { id: "lost", label: "Client MIA", type: "number" },
    { id: "backed_out", label: "Client backed out", type: "number" },
    { id: "sent_back_to_credit", label: "Sent back to credit", type: "number" },
    { id: "notes", label: "Notes", type: "text", wide: true },
  ],
  ea: [
    { id: "new_clients_onboarded", label: "New clients onboarded", type: "number" },
    { id: "cash_recovered_hac", label: "HAC cash recovered", type: "number" },
    { id: "hac_past_due", label: "HAC past due", type: "number" },
    { id: "follow_ups_sent", label: "Follow ups set", type: "number" },
    { id: "notes", label: "Notes", type: "text", wide: true },
  ],
};

function roleType(role: string) {
  const r = role.toLowerCase();
  if (r.includes("sales advisor")) return "sales_advisor";
  if (r.includes("setter") || r.includes("book calls")) return "setter";
  if (r.includes("closer")) return "closer";
  if (r.includes("funding")) return "funding";
  if (r.includes("credit")) return "credit";
  if (r.includes("fulfil") || r.includes("fulfill")) return "fulfillment";
  if (r.includes("ea") || r.includes("executive") || r.includes("assistant") || r.includes("ops")) return "ea";
  return "";
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

export function ReportForm({ team }: { team: TeamMember[] }) {
  const [memberId, setMemberId] = useState("");
  const [reportDate, setReportDate] = useState(today);
  const [values, setValues] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "loading" | "sending" | "ok" | "error">("idle");
  const [message, setMessage] = useState("");
  const memberSelectRef = useRef<HTMLSelectElement | null>(null);
  const member = team.find((item) => item.id === memberId);
  const type = member ? roleType(member.role || "") : "";
  const fields = useMemo(() => (type ? fieldsByRole[type] || [] : []), [type]);
  const canSubmit = fields.length > 0 && status !== "sending" && status !== "loading";

  useEffect(() => {
    if (!member || !type || !fields.length || !reportDate) {
      setValues({});
      return;
    }

    const controller = new AbortController();
    const blankValues = Object.fromEntries(fields.map((field) => [field.id, ""]));

    async function loadReport() {
      setStatus("loading");
      setMessage("Checking saved report...");
      try {
        const params = new URLSearchParams({
          memberName: member!.name,
          roleType: type,
          date: reportDate,
        });
        const res = await fetch(`/api/reports?${params.toString()}`, { signal: controller.signal });
        const body = await res.json().catch(() => ({}));

        if (!res.ok) {
          setValues(blankValues);
          setStatus("error");
          setMessage(body.error || "Could not load saved report.");
          return;
        }

        if (body.report?.values) {
          setValues(
            Object.fromEntries(
              fields.map((field) => {
                const value = body.report.values[field.id];
                return [field.id, value == null ? "" : String(value)];
              }),
            ),
          );
          setStatus("ok");
          setMessage(`Loaded saved report for ${reportDate}.`);
          return;
        }

        setValues(blankValues);
        setStatus("idle");
        setMessage("No report saved for this person/date yet.");
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setValues(blankValues);
        setStatus("error");
        setMessage("Could not load saved report.");
      }
    }

    loadReport();
    return () => controller.abort();
  }, [fields, member, reportDate, type]);

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
    const submittedValues: Record<string, string> = {};
    for (const field of fields) {
      submittedValues[field.id] = values[field.id] || "";
    }

    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberName: member.name, roleType: type, date: reportDate, values: submittedValues }),
      });

      if (res.ok) {
        setStatus("ok");
        setMessage(`Report saved for ${reportDate}.`);
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
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_260px_180px]">
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
            setValues({});
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
        <input
          type="date"
          value={reportDate}
          onChange={(event) => {
            setReportDate(event.target.value || today());
            setStatus("idle");
            setMessage("");
          }}
          className="h-11 rounded-lg border border-white/10 bg-black/30 px-3 text-sm text-white outline-none"
          required
        />
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
                value={values[field.id] || ""}
                onChange={(event) => setValues((current) => ({ ...current, [field.id]: event.target.value }))}
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
            {status === "sending" ? "Saving..." : status === "loading" ? "Loading..." : "Save report"}
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
