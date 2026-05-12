export type Period = "today" | "week" | "last_week" | "month" | "last_month" | "custom";

export type DateRange = {
  period: Period;
  start: string;
  end: string;
  label: string;
};

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function mondayOf(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
  return d;
}

function cleanDate(value: unknown) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
}

export function resolveDateRange(params: Record<string, string | string[] | undefined> = {}): DateRange {
  const now = new Date();
  const today = isoDate(now);
  const rawPeriod = Array.isArray(params.period) ? params.period[0] : params.period;
  const period = (["today", "week", "last_week", "month", "last_month", "custom"].includes(rawPeriod || "") ? rawPeriod : "week") as Period;
  const customStart = cleanDate(Array.isArray(params.start) ? params.start[0] : params.start);
  const customEnd = cleanDate(Array.isArray(params.end) ? params.end[0] : params.end);

  if (period === "custom" && customStart && customEnd) {
    return { period, start: customStart, end: customEnd, label: "Custom range" };
  }

  if (period === "today") {
    return { period, start: today, end: today, label: "Today" };
  }

  if (period === "last_week") {
    const start = mondayOf(now);
    start.setDate(start.getDate() - 7);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    return { period, start: isoDate(start), end: isoDate(end), label: "Last week" };
  }

  if (period === "month") {
    return { period, start: isoDate(new Date(now.getFullYear(), now.getMonth(), 1)), end: today, label: "This month" };
  }

  if (period === "last_month") {
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end = new Date(now.getFullYear(), now.getMonth(), 0);
    return { period, start: isoDate(start), end: isoDate(end), label: "Last month" };
  }

  return { period: "week", start: isoDate(mondayOf(now)), end: today, label: "This week" };
}

export function weekOf(date: string) {
  return isoDate(mondayOf(new Date(`${date}T12:00:00`)));
}
