import { getRoadmapIdeas, getFieldOptions } from "@/lib/smartsheet";
import StatusBadge from "@/components/StatusBadge";

export const dynamic = "force-dynamic";

const STATUS_BAR_COLOR = {
  New: "bg-slate-300",
  "Under Review": "bg-amber-400",
  Planned: "bg-orange-400",
  "In Progress": "bg-purple-500",
  Shipped: "bg-green-500",
  "Not Planned": "bg-red-400",
};

function quarterSortKey(q) {
  const match = /^Q([1-4])\s+(\d{4})$/.exec((q || "").trim());
  if (!match) return Number.MAX_SAFE_INTEGER;
  const quarter = Number(match[1]);
  const year = Number(match[2]);
  return year * 4 + (quarter - 1);
}

export default async function RoadmapPage() {
  const [ideas, fields] = await Promise.all([getRoadmapIdeas(), getFieldOptions()]);

  const quarters = (fields.timeframe || [])
    .filter((q) => q !== "Backlog")
    .sort((a, b) => quarterSortKey(a) - quarterSortKey(b));

  const maxCount = Math.max(1, ...quarters.map((q) => ideas.filter((i) => i.timeframe === q).length));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Roadmap</h1>
        <p className="text-sm text-slate-500">What&apos;s shipping, and when.</p>
      </div>

      {quarters.length === 0 ? (
        <p className="text-sm text-slate-500">No release quarters configured yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <div className="flex min-w-max gap-4 border-b border-slate-200 pb-2">
            {quarters.map((q) => (
              <div key={q} className="w-64 flex-shrink-0">
                <div className="mb-1 text-sm font-semibold text-slate-700">{q}</div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full bg-brand-500"
                    style={{
                      width: `${Math.max(
                        8,
                        (ideas.filter((i) => i.timeframe === q).length / maxCount) * 100
                      )}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex min-w-max gap-4 pt-4">
            {quarters.map((q) => {
              const items = ideas.filter((i) => i.timeframe === q);
              return (
                <div key={q} className="w-64 flex-shrink-0 space-y-3">
                  {items.length === 0 && <p className="text-sm text-slate-400">Nothing here yet.</p>}
                  {items.map((idea) => (
                    <div
                      key={idea.id}
                      className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm"
                    >
                      <div className={`h-1 w-full ${STATUS_BAR_COLOR[idea.status] || "bg-slate-300"}`} />
                      <div className="p-3">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="text-sm font-medium text-slate-900">{idea.title}</h3>
                          <StatusBadge status={idea.status} />
                        </div>
                        {idea.description && (
                          <p className="mt-1 text-xs text-slate-500">{idea.description}</p>
                        )}
                        <div className="mt-2 flex flex-wrap gap-1">
                          {idea.product && (
                            <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] text-indigo-600">
                              {idea.product}
                            </span>
                          )}
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-500">
                            {idea.category}
                          </span>
                        </div>
                        {idea.status === "Shipped" && idea.releaseNotes && (
                          <div className="mt-2 rounded-md bg-green-50 p-2 text-xs text-green-800">
                            <span className="font-semibold">What shipped: </span>
                            {idea.releaseNotes}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
