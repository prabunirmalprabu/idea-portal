import { getRoadmapIdeas, getFieldOptions } from "@/lib/smartsheet";
import categoryColor from "@/components/categoryColor";

export const dynamic = "force-dynamic";

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Roadmap</h1>
        <p className="text-sm text-slate-500">What&apos;s shipping, and when.</p>
      </div>

      {quarters.length === 0 ? (
        <p className="text-sm text-slate-500">No release quarters configured yet.</p>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {quarters.map((q) => {
            const items = ideas.filter((i) => i.timeframe === q);
            return (
              <div key={q} className="space-y-3">
                <div className="border-b border-slate-200 pb-2 text-sm font-bold uppercase tracking-wide text-slate-800">
                  {q}
                </div>
                {items.length === 0 && <p className="text-sm text-slate-400">Nothing here yet.</p>}
                {items.map((idea) => (
                  <div key={idea.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-semibold text-slate-900">{idea.title}</h3>
                      <span className={`flex-shrink-0 text-xs font-bold uppercase ${categoryColor(idea.category)}`}>
                        {idea.category}
                      </span>
                    </div>
                    {idea.description && <p className="mt-1 text-xs text-slate-500">{idea.description}</p>}
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      {idea.product && (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-500">
                          {idea.product}
                        </span>
                      )}
                      <span className="text-[11px] text-slate-400">{idea.status}</span>
                    </div>
                    {idea.status === "Shipped" && idea.releaseNotes && (
                      <div className="mt-2 rounded-md bg-green-50 p-2 text-xs text-green-800">
                        <span className="font-semibold">What shipped: </span>
                        {idea.releaseNotes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
