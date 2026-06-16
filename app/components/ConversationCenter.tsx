import Link from "next/link";
import { Card, Pill } from "./Card";
import { DateRange, dateRangeHref } from "@/lib/date-range";
import { centralRangeQuery } from "@/lib/hybrid-metrics";
import { fromView } from "@/lib/supabase";

type RetellCall = {
  id: string;
  contact_id: string | null;
  contact_name: string | null;
  phone: string | null;
  retell_call_id: string | null;
  call_status: string | null;
  call_duration_seconds: number | null;
  call_outcome: string | null;
  transcript: string | null;
  registered: boolean | null;
  retry_count: number | null;
  created_at: string;
  call_type: string | null;
  agent_name: string | null;
  booked: boolean | null;
  call_date: string | null;
  recording_url: string | null;
};

type AppointmentEvent = {
  id: string;
  ghl_contact_id: string | null;
  event_type: string | null;
  event_source: string | null;
  event_data: Record<string, unknown> | null;
  event_timestamp: string | null;
};

type StrategyTouch = {
  id: string;
  ghl_contact_id: string | null;
  email: string | null;
  phone: string | null;
  stage: string | null;
  touch_index: number | null;
  channel: string | null;
  message: string | null;
  status: string | null;
  error: string | null;
  sent_at: string | null;
  created_at: string;
  metadata: Record<string, unknown> | null;
};

type LeadConversation = {
  id: string;
  ghl_contact_id: string | null;
  channel: string | null;
  direction: string | null;
  sender: string | null;
  message_content: string | null;
  sequence_name: string | null;
  sentiment: string | null;
  sent_at: string | null;
  message_metadata: Record<string, unknown> | null;
  created_at: string;
};

type MessageEvent = {
  id: string;
  at: string;
  contactKey: string;
  contactLabel: string;
  channel: string;
  direction: "inbound" | "outbound" | "system";
  source: string;
  status: string;
  stage: string;
  body: string;
};

type MessageThread = {
  key: string;
  contactLabel: string;
  channel: string;
  latestAt: string;
  inboundCount: number;
  outboundCount: number;
  messages: MessageEvent[];
};

const fmtTime = (iso: string | null | undefined) => {
  if (!iso) return "-";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/New_York",
  }).format(new Date(iso));
};

const seconds = (value: number | null | undefined) => {
  const n = Number(value || 0);
  if (!n) return "0s";
  const min = Math.floor(n / 60);
  const sec = n % 60;
  return min ? `${min}m ${sec}s` : `${sec}s`;
};

const preview = (value: string | null | undefined, max = 170) => {
  const cleaned = (value || "").replace(/\s+/g, " ").trim();
  if (!cleaned) return "No transcript or message body captured.";
  return cleaned.length > max ? `${cleaned.slice(0, max - 1)}...` : cleaned;
};

const label = (value: string | null | undefined, fallback = "Unknown") =>
  value
    ? value
        .split("_")
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ")
    : fallback;

function statusTone(value: string | null | undefined): "good" | "warn" | "bad" | "info" | "neutral" {
  const v = (value || "").toLowerCase();
  if (v.includes("book") || v === "sent" || v.includes("completed")) return "good";
  if (v.includes("no_answer") || v.includes("voicemail") || v.includes("skip")) return "warn";
  if (v.includes("error") || v.includes("failed")) return "bad";
  if (v.includes("answer") || v.includes("connected")) return "info";
  return "neutral";
}

function isAnsweredCall(row: RetellCall) {
  const status = `${row.call_status || ""} ${row.call_outcome || ""}`.toLowerCase();
  if (status.includes("no_answer") || status.includes("voicemail")) return false;
  return status.includes("answer") || status.includes("connected") || Number(row.call_duration_seconds || 0) > 20;
}

function isCalendarConfirmedEvent(row: AppointmentEvent) {
  const eventType = (row.event_type || "").toLowerCase();
  const source = (row.event_source || "").toLowerCase();
  if (source === "retell_call_log") return false;
  if (eventType === "appointment_booked" || eventType === "call_booked") return true;
  return eventType === "booking_made" && (source.includes("calendar") || source.includes("ghl"));
}

function timestampRange(column: string, range: DateRange) {
  const { startIso, endIso } = centralRangeQuery(range);
  return {
    [column]: `gte.${startIso}`,
    and: `(${column}.lte.${endIso})`,
  };
}

function voiceConversationToCall(row: LeadConversation): RetellCall {
  const at = row.sent_at || row.created_at;
  const metadata = row.message_metadata || {};
  const callId = String(metadata.call_id || metadata.retell_call_id || row.id);
  const status = String(metadata.call_status || metadata.status || row.sentiment || "voice_event");
  const outcome = String(metadata.call_outcome || metadata.outcome || row.sentiment || row.direction || "voice");
  const duration = Number(metadata.duration_seconds || metadata.call_duration_seconds || 0) || null;

  return {
    id: `conversation-${row.id}`,
    contact_id: row.ghl_contact_id,
    contact_name: row.sender,
    phone: null,
    retell_call_id: callId,
    call_status: status,
    call_duration_seconds: duration,
    call_outcome: outcome,
    transcript: row.message_content,
    registered: null,
    retry_count: null,
    created_at: at,
    call_type: row.sequence_name || row.channel || "voice",
    agent_name: row.sender || "Retell",
    booked: Boolean(metadata.booked || metadata.appointment_booked || outcome.toLowerCase().includes("book")),
    call_date: at ? at.slice(0, 10) : null,
    recording_url: null,
  };
}

function mergeVoiceCalls(retellRows: RetellCall[], voiceConversationRows: LeadConversation[]) {
  if (retellRows.length) return retellRows;
  return voiceConversationRows
    .filter((row) => toMessageChannel(row.channel) === "voice")
    .map(voiceConversationToCall)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

function StatBox({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/20 p-4">
      <div className="text-[0.68rem] font-bold uppercase tracking-[0.08em] text-white/42">{label}</div>
      <div className="mt-2 text-2xl font-semibold tabular-nums">{value}</div>
      {sub ? <div className="mt-1 text-xs text-white/42">{sub}</div> : null}
    </div>
  );
}

function ConversationTabs({ active, range }: { active: "voice" | "messages"; range: DateRange }) {
  const tabs = [
    { key: "voice", href: dateRangeHref("/conversations/voice", range), label: "Voice calls", sub: "Retell + calendar truth" },
    { key: "messages", href: dateRangeHref("/conversations/messages", range), label: "Messages", sub: "SMS + DM threads" },
  ] as const;

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {tabs.map((tab) => {
        const selected = tab.key === active;
        return (
          <Link
            key={tab.key}
            href={tab.href}
            className={[
              "rounded-lg border px-4 py-3 no-underline transition",
              selected ? "border-red-500/35 bg-red-500/[0.14] text-white" : "border-white/10 bg-black/20 text-white/60 hover:border-red-500/25 hover:text-white",
            ].join(" ")}
          >
            <span className="block text-sm font-extrabold">{tab.label}</span>
            <span className="mt-1 block text-xs text-white/42">{tab.sub}</span>
          </Link>
        );
      })}
    </div>
  );
}

function VoiceCalls({ rows, confirmedContactIds }: { rows: RetellCall[]; confirmedContactIds: Set<string> }) {
  return (
    <Card title="Retell voice calls" subtitle={`${rows.length} calls in the selected range. Calendar confirmation only comes from non-Retell appointment events.`}>
      <div className="-mx-2 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-white/50">
              <th className="px-2 py-2">Time</th>
              <th className="px-2 py-2">Lead</th>
              <th className="px-2 py-2">Agent</th>
              <th className="px-2 py-2">Type</th>
              <th className="px-2 py-2">Outcome</th>
              <th className="px-2 py-2">Booking truth</th>
              <th className="px-2 py-2 text-right">Length</th>
              <th className="px-2 py-2">Transcript</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-2 py-6 text-center text-white/40">
                  No voice calls found for this time frame.
                </td>
              </tr>
            ) : null}
            {rows.map((row) => {
              const calendarConfirmed = Boolean(row.contact_id && confirmedContactIds.has(row.contact_id));
              return (
                <tr key={row.id} className="align-top tabular-nums hover:bg-white/5">
                  <td className="whitespace-nowrap px-2 py-2 text-white/58">{fmtTime(row.created_at)}</td>
                  <td className="px-2 py-2">
                    <div className="text-white/88">{row.contact_name || row.phone || row.contact_id || "-"}</div>
                    <div className="text-xs text-white/38">{row.phone || row.contact_id || "no contact id"}</div>
                  </td>
                  <td className="px-2 py-2 text-white/68">{row.agent_name || "Retell"}</td>
                  <td className="px-2 py-2 text-white/68">{label(row.call_type)}</td>
                  <td className="px-2 py-2">
                    <Pill tone={statusTone(row.call_outcome || row.call_status)}>{label(row.call_outcome || row.call_status)}</Pill>
                  </td>
                  <td className="px-2 py-2">
                    <div className="flex flex-wrap gap-1">
                      {calendarConfirmed ? <Pill tone="good">Calendar confirmed</Pill> : null}
                      {row.booked ? <Pill tone={isAnsweredCall(row) ? "info" : "warn"}>Retell booked flag</Pill> : null}
                      {!calendarConfirmed && row.booked ? <Pill tone="warn">Calendar unverified</Pill> : null}
                      {!calendarConfirmed && !row.booked ? <Pill tone="neutral">No booking proof</Pill> : null}
                    </div>
                  </td>
                  <td className="px-2 py-2 text-right text-white/68">{seconds(row.call_duration_seconds)}</td>
                  <td className="max-w-[360px] px-2 py-2 text-white/58">{preview(row.transcript, 220)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function toMessageChannel(value: string | null | undefined) {
  const channel = (value || "sms").toLowerCase();
  if (channel.includes("instagram") || channel.includes("ig")) return "instagram dm";
  if (channel.includes("facebook") || channel.includes("messenger")) return "facebook dm";
  if (channel.includes("dm")) return "dm";
  if (channel.includes("email")) return "email";
  return channel;
}

function threadKey(channel: string, contact: string) {
  return `${channel}:${contact || "unknown"}`.toLowerCase();
}

function buildMessageThreads(strategyTouches: StrategyTouch[], leadConversations: LeadConversation[]) {
  const events: MessageEvent[] = [
    ...strategyTouches.map((row) => {
      const channel = toMessageChannel(row.channel);
      const contactKey = row.ghl_contact_id || row.phone || row.email || "unknown";
      return {
        id: `strategy-${row.id}`,
        at: row.sent_at || row.created_at,
        contactKey,
        contactLabel: row.email || row.phone || row.ghl_contact_id || "Unknown contact",
        channel,
        direction: "outbound" as const,
        source: "Strategy Commander",
        status: row.status || "queued",
        stage: row.stage || `touch #${row.touch_index || 1}`,
        body: row.message || "",
      };
    }),
    ...leadConversations
      .filter((row) => toMessageChannel(row.channel) !== "voice")
      .map((row) => {
        const channel = toMessageChannel(row.channel);
        const contactKey = row.ghl_contact_id || row.sender || "unknown";
        const direction: MessageEvent["direction"] = (row.direction || "").toLowerCase() === "inbound" ? "inbound" : "outbound";
        return {
          id: `conversation-${row.id}`,
          at: row.sent_at || row.created_at,
          contactKey,
          contactLabel: row.sender || row.ghl_contact_id || "Unknown contact",
          channel,
          direction,
          source: "GHL conversation",
          status: row.sentiment || row.direction || "conversation",
          stage: row.sequence_name || "conversation",
          body: row.message_content || "",
        };
      }),
  ].filter((event) => event.body.trim());

  const grouped = new Map<string, MessageThread>();
  for (const event of events) {
    const key = threadKey(event.channel, event.contactKey);
    const existing = grouped.get(key);
    if (existing) {
      existing.messages.push(event);
      if (new Date(event.at).getTime() > new Date(existing.latestAt).getTime()) existing.latestAt = event.at;
      if (event.direction === "inbound") existing.inboundCount += 1;
      if (event.direction === "outbound") existing.outboundCount += 1;
      if (existing.contactLabel === "Unknown contact" && event.contactLabel !== "Unknown contact") existing.contactLabel = event.contactLabel;
    } else {
      grouped.set(key, {
        key,
        contactLabel: event.contactLabel,
        channel: event.channel,
        latestAt: event.at,
        inboundCount: event.direction === "inbound" ? 1 : 0,
        outboundCount: event.direction === "outbound" ? 1 : 0,
        messages: [event],
      });
    }
  }

  return Array.from(grouped.values())
    .map((thread) => ({
      ...thread,
      messages: thread.messages.sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime()),
    }))
    .sort((a, b) => new Date(b.latestAt).getTime() - new Date(a.latestAt).getTime());
}

function MessageThreads({ threads }: { threads: MessageThread[] }) {
  return (
    <Card title="Message conversations" subtitle={`${threads.length} SMS/DM conversation threads. Each thread shows the latest back-and-forth we have in Supabase.`}>
      <div className="space-y-4">
        {threads.length === 0 ? (
          <div className="rounded-lg border border-white/10 bg-black/20 p-5 text-center text-sm text-white/42">No SMS or DM conversation records found.</div>
        ) : null}
        {threads.map((thread) => {
          const visibleMessages = thread.messages.slice(-8);
          return (
            <section key={thread.key} className="rounded-lg border border-white/10 bg-black/20 p-4">
              <div className="flex flex-col gap-2 border-b border-white/10 pb-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-white/88">{thread.contactLabel}</div>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    <Pill tone="info">{label(thread.channel)}</Pill>
                    <Pill tone={thread.inboundCount > 0 ? "good" : "neutral"}>{thread.inboundCount} inbound</Pill>
                    <Pill tone="neutral">{thread.outboundCount} outbound</Pill>
                  </div>
                </div>
                <div className="whitespace-nowrap text-xs text-white/42">{fmtTime(thread.latestAt)} ET</div>
              </div>

              <div className="mt-4 space-y-3">
                {visibleMessages.map((message) => {
                  const inbound = message.direction === "inbound";
                  return (
                    <div key={message.id} className={inbound ? "flex justify-start" : "flex justify-end"}>
                      <div
                        className={[
                          "max-w-[760px] rounded-lg border px-3 py-2",
                          inbound ? "border-white/12 bg-white/[0.08]" : "border-red-500/20 bg-red-500/[0.12]",
                        ].join(" ")}
                      >
                        <div className="mb-1 flex flex-wrap items-center gap-1.5 text-[0.68rem] uppercase tracking-[0.08em] text-white/42">
                          <span>{inbound ? "Lead" : message.source}</span>
                          <span>•</span>
                          <span>{label(message.stage)}</span>
                          <span>•</span>
                          <span>{fmtTime(message.at)}</span>
                        </div>
                        <p className="text-sm leading-6 text-white/70">{preview(message.body, 360)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </Card>
  );
}

export async function VoiceConversationCenter({ range }: { range: DateRange }) {
  const [retellCalls, voiceConversationRows, appointmentEvents] = await Promise.all([
    fromView<RetellCall>("retell_call_log", {
      query: {
        select:
          "id,contact_id,contact_name,phone,retell_call_id,call_status,call_duration_seconds,call_outcome,transcript,registered,retry_count,created_at,call_type,agent_name,booked,call_date,recording_url",
        ...timestampRange("created_at", range),
        order: "created_at.desc",
        limit: "500",
      },
    }),
    fromView<LeadConversation>("lead_conversations", {
      query: {
        select: "id,ghl_contact_id,channel,direction,sender,message_content,sequence_name,sentiment,sent_at,message_metadata,created_at",
        channel: "eq.voice",
        ...timestampRange("created_at", range),
        order: "created_at.desc",
        limit: "500",
      },
    }),
    fromView<AppointmentEvent>("lead_events", {
      query: {
        select: "id,ghl_contact_id,event_type,event_source,event_data,event_timestamp",
        event_type: "in.(appointment_booked,call_booked,booking_made)",
        ...timestampRange("event_timestamp", range),
        order: "event_timestamp.desc",
        limit: "500",
      },
    }),
  ]);

  const voiceCalls = mergeVoiceCalls(retellCalls, voiceConversationRows);
  const confirmedAppointmentEvents = appointmentEvents.filter(isCalendarConfirmedEvent);
  const confirmedContactIds = new Set(confirmedAppointmentEvents.map((row) => row.ghl_contact_id).filter(Boolean) as string[]);
  const retellBookedFlags = voiceCalls.filter((row) => row.booked).length;
  const answered = voiceCalls.filter(isAnsweredCall).length;
  const confirmedVisibleCalls = voiceCalls.filter((row) => row.contact_id && confirmedContactIds.has(row.contact_id)).length;

  return (
    <div className="space-y-5">
      <ConversationTabs active="voice" range={range} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatBox label="Voice calls" value={voiceCalls.length} sub={`${answered} answered/connected`} />
        <StatBox label="Calendar confirmed" value={confirmedVisibleCalls} sub={`${confirmedAppointmentEvents.length} appointment events`} />
        <StatBox label="Retell booked flags" value={retellBookedFlags} sub="AI signal only" />
        <StatBox label="Needs verification" value={Math.max(retellBookedFlags - confirmedVisibleCalls, 0)} sub="Retell flag, no calendar event" />
      </div>

      <VoiceCalls rows={voiceCalls} confirmedContactIds={confirmedContactIds} />
    </div>
  );
}

export async function MessageConversationCenter({ range }: { range: DateRange }) {
  const [strategyTouches, leadConversations] = await Promise.all([
    fromView<StrategyTouch>("lgh_strategy_touch_log", {
      query: {
        select: "id,ghl_contact_id,email,phone,stage,touch_index,channel,message,status,error,sent_at,created_at,metadata",
        ...timestampRange("created_at", range),
        order: "created_at.desc",
        limit: "600",
      },
    }),
    fromView<LeadConversation>("lead_conversations", {
      query: {
        select: "id,ghl_contact_id,channel,direction,sender,message_content,sequence_name,sentiment,sent_at,message_metadata,created_at",
        channel: "neq.voice",
        ...timestampRange("created_at", range),
        order: "sent_at.desc.nullslast",
        limit: "1000",
      },
    }),
  ]);

  const threads = buildMessageThreads(strategyTouches, leadConversations);
  const sentTouches = strategyTouches.filter((row) => row.status === "sent").length;
  const inboundMessages = threads.reduce((sum, thread) => sum + thread.inboundCount, 0);
  const totalMessages = threads.reduce((sum, thread) => sum + thread.messages.length, 0);
  const channels = new Set(threads.map((thread) => thread.channel)).size;

  return (
    <div className="space-y-5">
      <ConversationTabs active="messages" range={range} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatBox label="Threads" value={threads.length} sub="contact + channel" />
        <StatBox label="Messages" value={totalMessages} sub="latest rows loaded" />
        <StatBox label="Inbound captured" value={inboundMessages} sub="lead replies visible" />
        <StatBox label="AI outbound" value={sentTouches} sub={`${channels} channel${channels === 1 ? "" : "s"}`} />
      </div>

      <MessageThreads threads={threads} />
    </div>
  );
}
