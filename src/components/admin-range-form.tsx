export function AdminRangeForm({
  range,
  from,
  to,
  action = "/admin",
}: {
  range: string;
  from?: string;
  to?: string;
  action?: string;
}) {
  const choices = [
    ["today", "Today"],
    ["7d", "Last 7 days"],
    ["30d", "Last 30 days"],
    ["month", "This month"],
  ];
  return (
    <form action={action} className="flex flex-wrap items-end gap-2">
      {choices.map(([value, label]) => (
        <button key={value} name="range" value={value} className={`min-h-11 rounded-full px-3 text-sm font-semibold ${range === value ? "bg-forest-800 text-cream-50" : "bg-white"}`}>
          {label}
        </button>
      ))}
      <label className="text-xs font-semibold">From
        <input type="date" name="from" defaultValue={from || ""} className="mt-1 block min-h-11 rounded-xl border border-cream-300 bg-white px-2 text-sm" />
      </label>
      <label className="text-xs font-semibold">To
        <input type="date" name="to" defaultValue={to || ""} className="mt-1 block min-h-11 rounded-xl border border-cream-300 bg-white px-2 text-sm" />
      </label>
      <button name="range" value="custom" className="min-h-11 rounded-full bg-white px-3 text-sm font-semibold">Apply dates</button>
    </form>
  );
}
