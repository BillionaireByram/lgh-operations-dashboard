import { DateRange } from "@/lib/date-range";

const GHL_BASE = "https://services.leadconnectorhq.com";
const LOCATION_ID = "I4UCxgBVksYMkvTqUnmy";
const WEBBI_PIPELINE_ID = "39k4k8h66J5af6WL3XjQ";
const WEBBI_AD_OPTIN_STAGE_ID = "7202e1f9-fe58-439a-85c7-07ed24cc0b73";
const WEBBI_ATTENDED_STAGE_ID = "ad962927-a569-4a5a-9e35-2d768c1197d9";
const CLOSERS_PIPELINE_ID = "fJppaK2n7Dce7ND766WX";
const SALES_CALL_BOOKED_STAGE_ID = "cea9a4f8-ac24-46f3-8219-457efddd39df";

const READY_TAGS = new Set(["hybrid-vsl-bundle-shown", "hybrid-vsl-diy-section-reached", "hybrid-vsl-hot-lead"]);
const BOOKING_TAGS = new Set(["hybrid-vsl-cta-clicked", "hybrid-vsl-booking-intent", "hybrid-vsl-bundle-clicked", "hybrid-vsl-low-ticket-intent"]);
const NUDGED_TAG = "hybrid-advisor-cta-sent";

export type HybridLead = {
  key: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  contactId?: string | null;
  oppId?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  tags: string[];
  status: "needs_watch" | "ready_for_setter" | "already_pushed" | "booking_intent" | "booked";
};

export type HybridDailyMetrics = {
  day: string;
  registered: number;
  reachedVcc: number;
  bookedCalls: number;
};

export type HybridMetrics = {
  available: boolean;
  error?: string;
  registered: number;
  started: number;
  reachedVcc: number;
  needsWatchPush: number;
  readyForSetterPush: number;
  alreadyPushed: number;
  bookingIntent: number;
  bookedCalls: number;
  attendRate: number;
  leads: HybridLead[];
  readyLeads: HybridLead[];
  watchPushLeads: HybridLead[];
  bookingIntentLeads: HybridLead[];
  bookedLeads: HybridLead[];
  daily: HybridDailyMetrics[];
};

export type GhlWonDeal = {
  id: string;
  name: string;
  closer: string | null;
  contactId: string | null;
  source: string | null;
  closedAt: string | null;
  amount: number;
  package: string | null;
};

export type GhlRevenueMetrics = {
  available: boolean;
  error?: string;
  deals: GhlWonDeal[];
  count: number;
  value: number;
  source: "ghl_won_opportunities" | "unavailable";
};

type GhlOpportunity = Record<string, any>;

function parseIso(value?: string | null): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function centralOffset(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    timeZoneName: "shortOffset",
  }).formatToParts(date);
  const value = parts.find((part) => part.type === "timeZoneName")?.value || "GMT-6";
  const match = value.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/);
  if (!match) return "-06:00";
  const sign = match[1];
  const hours = match[2].padStart(2, "0");
  const minutes = (match[3] || "00").padStart(2, "0");
  return `${sign}${hours}:${minutes}`;
}

export function centralBoundary(date: string, time: string) {
  const guess = new Date(`${date}T12:00:00Z`);
  return new Date(`${date}T${time}${centralOffset(guess)}`);
}

export function centralRangeBounds(range: DateRange) {
  // LGH reporting is owned in Central Time. GHL stores timestamps with offsets,
  // so convert Central day boundaries to UTC instants before filtering.
  return {
    start: centralBoundary(range.start, "00:00:00.000"),
    end: centralBoundary(range.end, "23:59:59.999"),
  };
}

export function centralRangeQuery(range: DateRange) {
  const bounds = centralRangeBounds(range);
  return {
    startIso: bounds.start.toISOString(),
    endIso: bounds.end.toISOString(),
  };
}

function inRange(value: string | null | undefined, range: DateRange) {
  const dt = parseIso(value);
  if (!dt) return false;
  const { start, end } = centralRangeBounds(range);
  return dt >= start && dt <= end;
}

function centralDay(value?: string | null) {
  const date = parseIso(value);
  if (!date) return null;
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Chicago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const byType = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${byType.year}-${byType.month}-${byType.day}`;
}

function incDaily(map: Map<string, HybridDailyMetrics>, day: string | null, key: keyof Omit<HybridDailyMetrics, "day">) {
  if (!day) return;
  const row = map.get(day) || { day, registered: 0, reachedVcc: 0, bookedCalls: 0 };
  row[key] += 1;
  map.set(day, row);
}

function contactFromOpp(opp: GhlOpportunity) {
  if (opp.contact) return opp.contact;
  const rel = (opp.relations || []).find((item: any) => item?.objectKey === "contact" || item?.recordId) || (opp.relations || [])[0];
  return rel || {};
}

function tagsFor(opp: GhlOpportunity): string[] {
  const contact = contactFromOpp(opp);
  const tags = new Set<string>();
  for (const tag of contact.tags || []) tags.add(String(tag).toLowerCase());
  for (const rel of opp.relations || []) for (const tag of rel.tags || []) tags.add(String(tag).toLowerCase());
  return Array.from(tags);
}

function hasAny(tags: string[], target: Set<string>) {
  return tags.some((tag) => target.has(tag));
}

function isHybridOpp(opp: GhlOpportunity) {
  const source = String(opp.source || "").toLowerCase();
  const name = String(opp.name || "").toLowerCase();
  const tags = tagsFor(opp);
  return source.includes("hybrid-vsl") || name.includes("[hybrid]") || tags.includes("hybrid-vsl-challenger");
}

function leadKey(opp: GhlOpportunity) {
  const contact = contactFromOpp(opp);
  return String(opp.contactId || contact.id || contact.recordId || opp.id || "");
}

function cleanName(value?: string | null, fallback?: string | null) {
  const raw = String(value || fallback || "Unknown lead").trim();
  return raw.replace(/^\[HYBRID\]\s*/i, "").replace(/\s+-\s+Hybrid VSL.*$/i, "").trim() || "Unknown lead";
}

async function ghlGet(pathOrUrl: string) {
  const key = process.env.GHL_API_KEY;
  if (!key) throw new Error("GHL_API_KEY is missing from dashboard environment");
  const url = pathOrUrl.startsWith("http") ? pathOrUrl : `${GHL_BASE}${pathOrUrl}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${key}`,
      Version: "2021-07-28",
      Accept: "application/json",
      "User-Agent": "Mozilla/5.0 (compatible; LGHCommandCenter/1.0)",
    },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`GHL ${res.status}: ${(await res.text()).slice(0, 180)}`);
  return res.json();
}

async function fetchStage(stageId: string, maxRows = 1000): Promise<GhlOpportunity[]> {
  const params = new URLSearchParams({
    location_id: process.env.LGH_GHL_LOCATION_ID || LOCATION_ID,
    pipeline_id: WEBBI_PIPELINE_ID,
    pipeline_stage_id: stageId,
    limit: "100",
  });
  let url = `/opportunities/search?${params.toString()}`;
  const out: GhlOpportunity[] = [];
  while (url && out.length < maxRows) {
    const data = await ghlGet(url);
    const batch = data.opportunities || data.items || [];
    out.push(...batch);
    const next = data.meta?.nextPageUrl || "";
    url = next || "";
    if (!batch.length) break;
  }
  return out.slice(0, maxRows);
}

async function fetchClosersBooked(maxRows = 1000): Promise<GhlOpportunity[]> {
  const params = new URLSearchParams({
    location_id: process.env.LGH_GHL_LOCATION_ID || LOCATION_ID,
    pipeline_id: CLOSERS_PIPELINE_ID,
    pipeline_stage_id: SALES_CALL_BOOKED_STAGE_ID,
    limit: "100",
  });
  let url = `/opportunities/search?${params.toString()}`;
  const out: GhlOpportunity[] = [];
  while (url && out.length < maxRows) {
    const data = await ghlGet(url);
    const batch = data.opportunities || data.items || [];
    out.push(...batch);
    url = data.meta?.nextPageUrl || "";
    if (!batch.length) break;
  }
  return out.slice(0, maxRows);
}

async function fetchClosersWon(maxRows = 500): Promise<GhlOpportunity[]> {
  const params = new URLSearchParams({
    location_id: process.env.LGH_GHL_LOCATION_ID || LOCATION_ID,
    pipeline_id: CLOSERS_PIPELINE_ID,
    status: "won",
    limit: "100",
  });
  let url = `/opportunities/search?${params.toString()}`;
  const out: GhlOpportunity[] = [];
  while (url && out.length < maxRows) {
    const data = await ghlGet(url);
    const batch = data.opportunities || data.items || [];
    out.push(...batch);
    url = data.meta?.nextPageUrl || "";
    if (!batch.length) break;
  }
  return out.slice(0, maxRows);
}

function leadFromOpp(opp: GhlOpportunity, status: HybridLead["status"]): HybridLead {
  const contact = contactFromOpp(opp);
  const tags = tagsFor(opp);
  return {
    key: leadKey(opp),
    name: cleanName(contact.name || contact.contactName || opp.name, contact.email),
    email: contact.email || null,
    phone: contact.phone || null,
    contactId: opp.contactId || contact.id || contact.recordId || null,
    oppId: opp.id || null,
    createdAt: opp.createdAt || opp.dateAdded || null,
    updatedAt: opp.updatedAt || opp.lastStageChangeAt || opp.createdAt || null,
    tags,
    status,
  };
}

function isInternal(lead: HybridLead) {
  const text = `${lead.name} ${lead.email || ""} ${lead.tags.join(" ")}`.toLowerCase();
  return text.includes("trevor") || text.includes("calais") || text.includes("internal-test") || text.includes("commander-test") || text.includes("owner-test");
}

function dealDate(opp: GhlOpportunity) {
  return opp.lastStatusChangeAt || opp.closedAt || opp.updatedAt || opp.lastStageChangeAt || opp.createdAt || null;
}

function packageFromOpp(opp: GhlOpportunity) {
  const text = `${opp.name || ""} ${opp.source || ""} ${tagsFor(opp).join(" ")}`.toLowerCase();
  if (text.includes("finance") || text.includes("financed") || text.includes("in house") || text.includes("in-house")) return "Financed";
  if (text.includes("pif") || text.includes("paid in full") || text.includes("paid")) return "PIF";
  return "Won";
}

function dealFromOpp(opp: GhlOpportunity): GhlWonDeal {
  const contact = contactFromOpp(opp);
  return {
    id: String(opp.id || leadKey(opp)),
    name: cleanName(contact.name || contact.contactName || opp.name, contact.email),
    closer: opp.assignedTo || null,
    contactId: opp.contactId || contact.id || contact.recordId || null,
    source: opp.source || null,
    closedAt: dealDate(opp),
    amount: Number(opp.monetaryValue || 0),
    package: packageFromOpp(opp),
  };
}

export async function getGhlRevenueMetrics(range?: DateRange, limit = 500): Promise<GhlRevenueMetrics> {
  try {
    const won = await fetchClosersWon(limit);
    const deals = won
      .filter((opp) => String(opp.status || "").toLowerCase() === "won")
      .filter((opp) => (range ? inRange(dealDate(opp), range) : true))
      .map(dealFromOpp)
      .filter((deal) => deal.id && !`${deal.name} ${deal.source || ""}`.toLowerCase().includes("test"))
      .sort((a, b) => String(b.closedAt || "").localeCompare(String(a.closedAt || "")));

    return {
      available: true,
      deals,
      count: deals.length,
      value: deals.reduce((sum, deal) => sum + deal.amount, 0),
      source: "ghl_won_opportunities",
    };
  } catch (err) {
    return {
      available: false,
      error: err instanceof Error ? err.message : "GHL won deals unavailable",
      deals: [],
      count: 0,
      value: 0,
      source: "unavailable",
    };
  }
}

export async function getHybridMetrics(range: DateRange): Promise<HybridMetrics> {
  try {
    const [registeredStage, attendedStage, bookedStage] = await Promise.all([
      fetchStage(WEBBI_AD_OPTIN_STAGE_ID),
      fetchStage(WEBBI_ATTENDED_STAGE_ID),
      fetchClosersBooked(),
    ]);

    const bookedLeads = bookedStage
      .filter(isHybridOpp)
      .filter((opp) => inRange(opp.createdAt || opp.lastStageChangeAt || opp.updatedAt, range))
      .map((opp) => leadFromOpp(opp, "booked"))
      .filter((lead) => !isInternal(lead));
    const bookedKeys = new Set(bookedLeads.map((lead) => lead.key));

    const registeredByKey = new Map<string, HybridLead>();
    const activeByKey = new Map<string, HybridLead>();

    for (const opp of [...registeredStage, ...attendedStage]) {
      if (!isHybridOpp(opp)) continue;
      if (!inRange(opp.createdAt || opp.dateAdded, range)) continue;
      const tags = tagsFor(opp);
      const key = leadKey(opp);
      let status: HybridLead["status"] = "needs_watch";
      if (bookedKeys.has(key)) status = "booked";
      else if (hasAny(tags, BOOKING_TAGS)) status = "booking_intent";
      else if (tags.includes(NUDGED_TAG)) status = "already_pushed";
      else if (hasAny(tags, READY_TAGS) || opp.pipelineStageId === WEBBI_ATTENDED_STAGE_ID || opp.pipelineStageUId === WEBBI_ATTENDED_STAGE_ID) status = "ready_for_setter";

      const lead = leadFromOpp(opp, status);
      if (!isInternal(lead)) {
        registeredByKey.set(key, lead);
        activeByKey.set(key, lead);
      }
    }

    const attendedByKey = new Map<string, HybridLead>();
    for (const opp of [...registeredStage, ...attendedStage]) {
      if (!isHybridOpp(opp)) continue;
      const updatedInRange = inRange(opp.updatedAt || opp.lastStageChangeAt || opp.createdAt, range);
      const createdInRange = inRange(opp.createdAt || opp.dateAdded, range);
      const isAttendedStage = opp.pipelineStageId === WEBBI_ATTENDED_STAGE_ID || opp.pipelineStageUId === WEBBI_ATTENDED_STAGE_ID;
      if (!isAttendedStage && !hasAny(tagsFor(opp), READY_TAGS)) continue;
      if (!updatedInRange && !createdInRange) continue;
      const tags = tagsFor(opp);
      let status: HybridLead["status"] = "needs_watch";
      const key = leadKey(opp);
      if (bookedKeys.has(key)) status = "booked";
      else if (hasAny(tags, BOOKING_TAGS)) status = "booking_intent";
      else if (tags.includes(NUDGED_TAG)) status = "already_pushed";
      else if (hasAny(tags, READY_TAGS) || opp.pipelineStageId === WEBBI_ATTENDED_STAGE_ID || opp.pipelineStageUId === WEBBI_ATTENDED_STAGE_ID) status = "ready_for_setter";

      const lead = leadFromOpp(opp, status);
      if (!isInternal(lead)) {
        attendedByKey.set(key, lead);
        activeByKey.set(key, lead);
      }
    }

    for (const lead of bookedLeads) activeByKey.set(lead.key, lead);

    const leads = Array.from(activeByKey.values()).sort((a, b) => String(b.updatedAt || b.createdAt || "").localeCompare(String(a.updatedAt || a.createdAt || "")));
    const registeredLeads = Array.from(registeredByKey.values());
    const attendedLeads = Array.from(attendedByKey.values());
    const started = leads.filter((lead) => lead.tags.includes("hybrid-vsl-video-started") || lead.tags.includes("hybrid-vsl-training-unlocked")).length;
    const reachedVcc = attendedLeads.length;
    const readyLeads = leads.filter((lead) => lead.status === "ready_for_setter");
    const watchPushLeads = leads.filter((lead) => lead.status === "needs_watch");
    const bookingIntentLeads = leads.filter((lead) => lead.status === "booking_intent");
    const finalBookedLeads = leads.filter((lead) => lead.status === "booked");
    const dailyMap = new Map<string, HybridDailyMetrics>();
    for (const lead of registeredLeads) incDaily(dailyMap, centralDay(lead.createdAt), "registered");
    for (const lead of attendedLeads) incDaily(dailyMap, centralDay(lead.updatedAt || lead.createdAt), "reachedVcc");
    for (const lead of bookedLeads) incDaily(dailyMap, centralDay(lead.createdAt || lead.updatedAt), "bookedCalls");
    const daily = Array.from(dailyMap.values()).sort((a, b) => b.day.localeCompare(a.day));

    return {
      available: true,
      registered: registeredLeads.length,
      started,
      reachedVcc,
      needsWatchPush: watchPushLeads.length,
      readyForSetterPush: readyLeads.length,
      alreadyPushed: leads.filter((lead) => lead.status === "already_pushed").length,
      bookingIntent: bookingIntentLeads.length,
      bookedCalls: finalBookedLeads.length,
      attendRate: registeredLeads.length ? Number(((reachedVcc / registeredLeads.length) * 100).toFixed(1)) : 0,
      leads,
      readyLeads,
      watchPushLeads,
      bookingIntentLeads,
      bookedLeads: finalBookedLeads,
      daily,
    };
  } catch (err) {
    return {
      available: false,
      error: err instanceof Error ? err.message : "Hybrid metrics unavailable",
      registered: 0,
      started: 0,
      reachedVcc: 0,
      needsWatchPush: 0,
      readyForSetterPush: 0,
      alreadyPushed: 0,
      bookingIntent: 0,
      bookedCalls: 0,
      attendRate: 0,
      leads: [],
      readyLeads: [],
      watchPushLeads: [],
      bookingIntentLeads: [],
      bookedLeads: [],
      daily: [],
    };
  }
}
