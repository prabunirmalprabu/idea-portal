"use client";
import { useMemo, useState } from "react";
import { Gantt, ViewMode } from "gantt-task-react";
import "gantt-task-react/dist/index.css";

const STATUS_PROGRESS = {
  New: 0,
  "Under Review": 10,
  Planned: 20,
  "In Progress": 60,
  Shipped: 100,
  "Not Planned": 0,
};

const PRODUCT_COLORS = [
  "#4f46e5", // brand indigo
  "#059669", // green
  "#d97706", // amber
  "#db2777", // pink
  "#0891b2", // cyan
  "#7c3aed", // violet
];

function quarterDateRange(quarter) {
  const match = /^Q([1-4])\s+(\d{4})$/.exec((quarter || "").trim());
  if (!match) return null;
  const q = Number(match[1]);
  const year = Number(match[2]);
  const startMonth = (q - 1) * 3;
  const start = new Date(Date.UTC(year, startMonth, 1));
  const end = new Date(Date.UTC(year, startMonth + 3, 0));
  return { start, end };
}

function parseDate(value) {
  if (!value) return null;
  const d = new Date(value);
  return isNaN(d) ? null : d;
}

function resolveRange(idea) {
  const start = parseDate(idea.startDate);
  const end = parseDate(idea.targetDate);
  if (start && end) return { start, end };
  const fallback = quarterDateRange(idea.timeframe);
  if (start && fallback) return { start, end: fallback.end };
  if (end && fallback) return { start: fallback.start, end };
  if (fallback) return fallback;
  const today = new Date();
  return { start: today, end: new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000) };
}

// Generic "chip filter" state helper: tracks a set of selected values for a
// list that can change over time (falls back to "everything selected" once
// the selection would otherwise go empty, e.g. right after the value list
// changes).
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
      if (next.has(v)) {
        next.delete(v);
      } else {
        next.add(v);
      }
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

export default function AdminGantt({ ideas, onDateChange }) {
  const products = useMemo(() => {
    const set = new Set(ideas.map((i) => i.product || "General"));
    return Array.from(set);
  }, [ideas]);
  const statuses = useMemo(() => {
    const set = new Set(ideas.map((i) => i.status || "New"));
    return Array.from(set);
  }, [ideas]);

  const [activeProducts, toggleProduct] = useChipFilter(products);
  const [activeStatuses, toggleStatus] = useChipFilter(statuses);
  // Note: no native "quarter" granularity exists in this library — Month is
  // the closest fit, so that's the default instead of Week.
  const [viewMode, setViewMode] = useState(ViewMode.Month);
  const [saveError, setSaveError] = useState("");

  const filteredIdeas = ideas.filter(
    (i) => activeProducts.has(i.product || "General") && activeStatuses.has(i.status || "New")
  );

  const tasks = useMemo(() => {
    const byProduct = {};
    for (const idea of filteredIdeas) {
      const product = idea.product || "General";
      if (!byProduct[product]) byProduct[product] = [];
      byProduct[product].push(idea);
    }

    const result = [];
    Object.entries(byProduct).forEach(([product, items], index) => {
      const color = PRODUCT_COLORS[index % PRODUCT_COLORS.length];
      const ranges = items.map(resolveRange);
      const projectStart = new Date(Math.min(...ranges.map((r) => r.start.getTime())));
      const projectEnd = new Date(Math.max(...ranges.map((r) => r.end.getTime())));

      result.push({
        start: projectStart,
        end: projectEnd,
        name: product,
        id: `project-${product}`,
        type: "project",
        progress: 0,
        hideChildren: false,
        styles: { backgroundColor: color, backgroundSelectedColor: color, progressColor: color },
      });

      items.forEach((idea, i) => {
        const range = ranges[i];
        result.push({
          start: range.start,
          end: range.end,
          name: idea.title,
          id: idea.id,
          type: "task",
          progress: STATUS_PROGRESS[idea.status] ?? 0,
          project: `project-${product}`,
          styles: { backgroundColor: `${color}cc`, backgroundSelectedColor: color, progressColor: color },
        });
      });
    });
    return result;
  }, [filteredIdeas]);

  function toDateOnly(d) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString().slice(0, 10);
  }

  async function handleDateChange(task) {
    if (task.type === "project") return;
    setSaveError("");
    try {
      await onDateChange(task.id, {
        startDate: toDateOnly(task.start),
        targetDate: toDateOnly(task.end),
      });
    } catch (err) {
      setSaveError(err.message || "Failed to save the new dates.");
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <ChipRow label="Product" values={products} active={activeProducts} onToggle={toggleProduct} />
          <ChipRow label="Status" values={statuses} active={activeStatuses} onToggle={toggleStatus} />
        </div>
        <select
          className="rounded-md border border-slate-300 px-2 py-1 text-xs"
          value={viewMode}
          onChange={(e) => setViewMode(e.target.value)}
        >
          <option value={ViewMode.Month}>Month</option>
          <option value={ViewMode.Year}>Year</option>
        </select>
      </div>
      {saveError && <p className="text-sm text-red-600">{saveError}</p>}
      {tasks.length === 0 ? (
        <p className="text-sm text-slate-500">
          Nothing matches the current filters. Items also need a Release Quarter (or Start/Target
          Date) other than Backlog to show up here at all.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <Gantt
            tasks={tasks}
            viewMode={viewMode}
            onDateChange={handleDateChange}
            listCellWidth="180px"
            columnWidth={viewMode === ViewMode.Year ? 350 : 220}
          />
        </div>
      )}
      <p className="text-xs text-slate-400">
        Drag a bar to reschedule it, or drag its edges to resize — changes save automatically to
        Smartsheet. This view is only ever shown here in Admin, never on the public roadmap.
      </p>
    </div>
  );
}
