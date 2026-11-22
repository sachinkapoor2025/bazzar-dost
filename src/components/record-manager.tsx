"use client";

import { useMemo, useState } from "react";
import { buttonClass, fieldClass, labelClass } from "@/components/ui";

type Field = {
  name: string;
  label: string;
  type?: "text" | "number" | "date" | "textarea" | "select" | "image";
  options?: string[];
  required?: boolean;
};

type Row = {
  id: string;
  title: string;
  status: string;
  payload: Record<string, string | number>;
  createdAt: string;
};

function csvCell(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}

export function RecordManager({
  kind,
  noun,
  rows,
  fields,
  statuses,
}: {
  kind: string;
  noun: string;
  rows: Row[];
  fields: Field[];
  statuses: string[];
}) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const pageSize = 12;
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter((row) => JSON.stringify({ title: row.title, status: row.status, ...row.payload }).toLowerCase().includes(needle));
  }, [query, rows]);
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const visible = filtered.slice((page - 1) * pageSize, page * pageSize);

  async function send(url: string, method: string, body?: unknown) {
    setError("");
    setMessage("");
    const response = await fetch(url, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = (await response.json()) as { error?: string; message?: string };
    if (!response.ok) {
      setError(data.error || "Could not save.");
      return;
    }
    setMessage(data.message || "Saved.");
    window.location.reload();
  }

  function payloadFrom(form: FormData) {
    const payload: Record<string, string | number> = {};
    for (const field of fields) {
      const raw = String(form.get(field.name) || "");
      payload[field.name] = field.type === "number" ? Number(raw || 0) : raw;
    }
    return {
      kind,
      title: String(form.get("title") || ""),
      status: String(form.get("status") || statuses[0]),
      ...payload,
    };
  }

  function exportCsv() {
    const headers = ["title", "status", ...fields.map((field) => field.name), "created"];
    const lines = filtered.map((row) => [row.title, row.status, ...fields.map((field) => String(row.payload[field.name] ?? "")), row.createdAt].map(csvCell).join(","));
    const blob = new Blob([[headers.join(","), ...lines].join("\n")], { type: "text/csv" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `bazaardost-${kind}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder={`Search ${noun}`} className={`${fieldClass} max-w-sm`} aria-label={`Search ${noun}`} />
        <button type="button" className={buttonClass("outline")} onClick={exportCsv}>Export CSV</button>
      </div>
      <div className="max-w-full overflow-x-auto">
        <table className="w-full min-w-[36rem] text-left text-sm">
          <thead>
            <tr className="border-b border-cream-300">
              <th className="py-2 pr-3">Name</th>
              <th className="pr-3">Status</th>
              {fields.slice(0, 3).map((field) => <th key={field.name} className="pr-3">{field.label}</th>)}
              <th />
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 ? <tr><td className="py-3 text-muted" colSpan={5}>Nothing is stored yet.</td></tr> : visible.map((row) => (
              <tr key={row.id} className="border-b border-cream-200 align-top">
                <td className="py-2 pr-3 font-semibold">{row.title}</td>
                <td className="pr-3 capitalize">{row.status}</td>
                {fields.slice(0, 3).map((field) => <td key={field.name} className="pr-3">{String(row.payload[field.name] ?? "")}</td>)}
                <td className="py-2 text-right">
                  <details>
                    <summary className="cursor-pointer font-semibold text-forest-800">Edit</summary>
                    <form className="mt-2 grid gap-2 text-left" onSubmit={(event) => { event.preventDefault(); void send(`/api/admin/records/${row.id}`, "PATCH", payloadFrom(new FormData(event.currentTarget))); }}>
                      <RecordFields fields={fields} statuses={statuses} values={{ title: row.title, status: row.status, ...row.payload }} />
                      <button className={buttonClass("primary")}>Update</button>
                    </form>
                  </details>
                  <button type="button" className="mt-1 text-sm font-semibold text-[#7F1D1D] underline" onClick={() => {
                    if (!window.confirm(`Delete this ${noun}?`)) return;
                    void send(`/api/admin/records/${row.id}`, "DELETE");
                  }}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center gap-3 text-sm">
        <button type="button" className={buttonClass("outline")} disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Previous</button>
        <span>Page {page} of {pages}</span>
        <button type="button" className={buttonClass("outline")} disabled={page >= pages} onClick={() => setPage((value) => value + 1)}>Next</button>
      </div>
      <form className="grid max-w-xl gap-3 rounded-2xl border border-cream-300 bg-white p-4" onSubmit={(event) => { event.preventDefault(); void send("/api/admin/records", "POST", payloadFrom(new FormData(event.currentTarget))); }}>
        <h2 className="font-display text-2xl">Add {noun}</h2>
        <RecordFields fields={fields} statuses={statuses} />
        <button className={buttonClass("primary")}>Save</button>
      </form>
      {error ? <p className="text-sm text-[#7F1D1D]" role="alert">{error}</p> : null}
      {message ? <p className="text-sm" role="status">{message}</p> : null}
    </div>
  );
}

function RecordFields({ fields, statuses, values = {} }: { fields: Field[]; statuses: string[]; values?: Record<string, string | number> }) {
  return (
    <>
      <label className={labelClass}>Name
        <input name="title" required defaultValue={values.title || ""} className={fieldClass} />
      </label>
      <label className={labelClass}>Status
        <select name="status" defaultValue={String(values.status || statuses[0])} className={fieldClass}>
          {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
        </select>
      </label>
      {fields.map((field) => <FieldInput key={field.name} field={field} value={values[field.name]} />)}
    </>
  );
}

function FieldInput({ field, value }: { field: Field; value?: string | number }) {
  if (field.type === "image") return <ImageField name={field.name} label={field.label} initial={String(value || "")} />;
  if (field.type === "select") {
    return (
      <label className={labelClass}>{field.label}
        <select name={field.name} defaultValue={String(value || field.options?.[0] || "")} className={fieldClass}>
          {field.options?.map((option) => <option key={option}>{option}</option>)}
        </select>
      </label>
    );
  }
  if (field.type === "textarea") {
    return (
      <label className={labelClass}>{field.label}
        <textarea name={field.name} required={field.required} defaultValue={String(value || "")} className={`${fieldClass} min-h-24 py-2`} />
      </label>
    );
  }
  return (
    <label className={labelClass}>{field.label}
      <input name={field.name} type={field.type || "text"} required={field.required} defaultValue={value ?? ""} className={fieldClass} />
    </label>
  );
}

function ImageField({ name, label, initial }: { name: string; label: string; initial: string }) {
  const [image, setImage] = useState(initial);
  const [error, setError] = useState("");
  async function upload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const body = new FormData();
    body.set("file", file);
    const response = await fetch("/api/admin/upload", { method: "POST", body });
    const data = (await response.json()) as { url?: string; error?: string };
    if (!response.ok || !data.url) {
      setError(data.error || "Upload failed.");
      return;
    }
    setError("");
    setImage(data.url);
  }
  return (
    <div>
      <input type="hidden" name={name} value={image} />
      {image ? <p className="truncate text-sm text-muted">{image}</p> : null}
      <label className={labelClass}>{label}
        <input type="file" accept="image/png,image/jpeg,image/webp" onChange={upload} className="block text-sm" />
      </label>
      {error ? <p className="text-sm text-[#7F1D1D]">{error}</p> : null}
    </div>
  );
}
