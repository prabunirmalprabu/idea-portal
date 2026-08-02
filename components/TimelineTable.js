"use client";
import { useMemo, useState } from "react";
import categoryColor from "./categoryColor";

const STATUS_PROGRESS = {
  New: 0,
  "Under Review": 10,
  Planned: 20,
  "In Progress": 60,
  Shipped: 100,
  "Not Planned": 0,
};

function quarterStart(quarter) {
  const match = /^Q([1-4])\s+(\d{4})$/.exec((quarter || "").trim());
  if (!match) return null;
  const q = Number(match[1]);
  const year = Number(match[2]);
  return new Date(Date.UTC(year, (q - 1) * 3, 1));
}

function effectiveStart(idea) {
  if (idea.startDate) {
    const d = new Date(idea.startDate);
    if (!isNaN(d)) return d;
  }
  return quarterStart(idea.timeframe) || new Date(8640000000000000); // sort undated last
}

// Same "chip filter" pattern used elsewhere: tracks selected values for a
// list that may change, falling back to "everything" if selection empties.
function useChipFilter(values) {
  const [selected, setSelected] = useState(() => new Set(values));
  const active = useMemo(() => {
    const next = new Set();
    for (const v of values) {
      if (selected.has(v)) next.add(v);
    }
    return next.size > 0 ? next : new Set(values);
  }, [values, selected]);

  function toggle(v) {
    setSelected((prev) => {
      const next = new Set(prev.size > 0 ? prev : values);
      if (next.has(v)) next.delete(v);
      else next.add(v);
      return next;
    });
  }

  return [active, toggle];
}

function ChipRow({ label, values, active, onToggle }) {
  if (values.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</span>
      {values.map((v) => (
        <button
          key={v}
          onClick={() => onToggle(v)}
          className={`rounded-full border px-3 py-1 text-xs font-medium ${
            active.has(v) ? "border-brand-500 bg-brand-50 text-brand-700" : "border-slate-200 text-slate-400"
          }`}
        >
          {v}
        </button>
      ))}
    </div>
  );
}

export default function TimelineTable({ ideas, fields, onUpdate }) {
  const products = useMemo(() => {
    return Array.from(new Set(ideas.map((i) => i.product || "General")));
  }, [ideas]);
  const statuses = useMemo(() => {
    return Array.from(new Set(ideas.map((i) => i.status || "New")));
  }, [ideas]);

  const [activeProducts, toggleProduct] = useChipFilter(products);
  const [activeStatuses, toggleStatus] = useChipFilter(statuses);

  const rows = ideas
    .filter((i) => activeProducts.has(i.product || "General") && activeStatuses.has(i.status || "New"))
    .sort((a, b) => effectiveStart(a).getTime() - effectiveStart(b).getTime());

  return (
    <div className="space-y-4">
      <div className="space-y-2 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <ChipRow label="Product" values={products} active={activeProducts} onToggle={toggleProduct} />
        <ChipRow label="Status" values={statuses} active={activeStatuses} onToggle={toggleStatus} />
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-slate-500">Nothing matches the current filters.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-2">Idea</th>
                <th className="px-3 py-2">Product</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Release Quarter</th>
                <th className="px-3 py-2">Start</th>
                <th className="px-3 py-2">Target</th>
                <th className="px-3 py-2">Progress</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((idea) => {
                const progress = STATUS_PROGRESS[idea.status] ?? 0;
                return (
                  <tr key={idea.id}>
                    <td className="px-3 py-2 align-top">
                      <div className="font-medium text-slate-900">{idea.title}</div>
                      <span className={`text-xs font-semibold ${categoryColor(idea.category)}`}>
                        {idea.category}
                      </span>
                    </td>
                    <td className="px-3 py-2 align-top text-slate-600">{idea.product}</td>
                    <td className="px-3 py-2 align-top">
                      <select
                        className="rounded-md border border-slate-300 px-2 py-1 text-xs"
                        value={idea.status}
                        onChange={(e) => onUpdate(idea.id, { status: e.target.value })}
                      >
                        {(fields.status || []).map((s) => (
                          <option key={s}>{s}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-2 align-top text-slate-600">{idea.timeframe}</td>
                    <td className="px-3 py-2 align-top">
                      <input
                        type="date"
                        className="rounded-md border border-slate-300 px-2 py-1 text-xs"
                        defaultValue={idea.startDate || ""}
                        onBlur={(e) => {
                          if (e.target.value !== (idea.startDate || "")) {
                            onUpdate(idea.id, { startDate: e.target.value });
                          }
                        }}
                      />
                    </td>
                    <td className="px-3 py-2 align-top">
                      <input
                        type="date"
                        className="rounded-md border border-slate-300 px-2 py-1 text-xs"
                        defaultValue={idea.targetDate || ""}
                        onBlur={(e) => {
                          if (e.target.value !== (idea.targetDate || "")) {
                            onUpdate(idea.id, { targetDate: e.target.value });
                          }
                        }}
                      />
                    </td>
                    <td className="px-3 py-2 align-top">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-100">
                          <div className="h-full rounded-full bg-brand-500" style={{ width: `${progress}%` }} />
                        </div>
                        <span className="text-xs text-slate-500">{progress}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
