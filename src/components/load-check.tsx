"use client";

import { useState } from "react";
import { buttonClass, fieldClass, labelClass } from "@/components/ui";

const PRESETS = [
  { id: "5", label: "Smoke, 5 checks" },
  { id: "10", label: "Sample, 10 checks" },
  { id: "20", label: "Longer sample, 20 checks" },
];

const PATHS = ["/", "/shop", "/search"];

type Result = { path: string; status: number; ms: number };

export function LoadCheck() {
  const [preset, setPreset] = useState("5");
  const [running, setRunning] = useState(false);
  const [rows, setRows] = useState<Result[]>([]);
  const [error, setError] = useState("");

  async function run() {
    if (!window.confirm("Run a one-at-a-time check of this shop's public pages?")) return;
    setRunning(true);
    setError("");
    setRows([]);
    const count = Math.min(20, Number(preset) || 5);
    const next: Result[] = [];
    try {
      for (let index = 0; index < count; index += 1) {
        const path = PATHS[index % PATHS.length]!;
        const started = performance.now();
        const response = await fetch(path, { cache: "no-store" });
        next.push({ path, status: response.status, ms: Math.round(performance.now() - started) });
        setRows([...next]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "The check stopped.");
    } finally {
      setRunning(false);
    }
  }

  const average = rows.length ? Math.round(rows.reduce((sum, row) => sum + row.ms, 0) / rows.length) : 0;

  return (
    <div className="grid max-w-xl gap-3">
      <label className={labelClass}>Sample size
        <select value={preset} onChange={(event) => setPreset(event.target.value)} className={fieldClass}>
          {PRESETS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
        </select>
      </label>
      <button type="button" className={buttonClass("primary")} disabled={running} onClick={() => void run()}>{running ? "Running…" : "Run check"}</button>
      <p className="text-sm text-muted">Checks run one after another against this shop only, with a maximum of 20. This page does not open a large concurrent load.</p>
      {rows.length ? <p className="text-sm">Finished {rows.length} checks. Average {average} ms. Failures: {rows.filter((row) => row.status >= 400).length}.</p> : null}
      {rows.length ? (
        <ul className="divide-y divide-cream-200 rounded-2xl border border-cream-300 bg-white text-sm">
          {rows.map((row, index) => <li key={`${row.path}-${index}`} className="flex justify-between px-3 py-2"><span>{row.path}</span><span>{row.status} · {row.ms} ms</span></li>)}
        </ul>
      ) : null}
      {error ? <p className="text-sm text-[#7F1D1D]" role="alert">{error}</p> : null}
    </div>
  );
}
