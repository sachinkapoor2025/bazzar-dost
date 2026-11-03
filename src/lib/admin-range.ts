export type AdminRangeKey = "today" | "7d" | "30d" | "month" | "custom";

export function parseAdminRange(
  input: { range?: string; from?: string; to?: string },
  now = new Date(),
): { range: AdminRangeKey; start: Date; end: Date } {
  const requested = input.range;
  const range: AdminRangeKey =
    requested === "today" || requested === "7d" || requested === "30d" || requested === "month" || requested === "custom"
      ? requested
      : "30d";
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);

  if (range === "custom") {
    const from = input.from ? new Date(`${input.from}T00:00:00`) : null;
    const to = input.to ? new Date(`${input.to}T23:59:59.999`) : null;
    if (from && to && !Number.isNaN(from.getTime()) && !Number.isNaN(to.getTime()) && from.getTime() <= to.getTime()) {
      return { range, start: from, end: to };
    }
  }
  if (range === "7d") start.setDate(start.getDate() - 6);
  if (range === "30d" || range === "custom") start.setDate(start.getDate() - 29);
  if (range === "month") start.setDate(1);
  return { range: range === "custom" ? "30d" : range, start, end };
}

export function dayKey(value: Date): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
