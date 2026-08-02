import { getRoadmapIdeas } from "@/lib/smartsheet";
import StatusBadge from "@/components/StatusBadge";

export const dynamic = "force-dynamic";

const columns = ["Now", "Next", "Later"];

export default async function RoadmapPage() {
  const ideas = await getRoadmapIdeas();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Roadmap</h1>
        <p className="text-sm text-slate-500">What we&apos;re working on now, next, and later.</p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {columns.map((col) => {
          const items = ideas.filter((i) => i.timeframe === col);
          return (
            <div key={col} className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">{col}</h2>
              <div className="space-y-3">
                {items.length === 0 && <p className="text-sm text-slate-400">Nothing here yet.</p>}
                {items.map((idea) => (
                  <div key={idea.id} className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-medium text-slate-900">{idea.title}</h3>
                      <StatusBadge status={idea.status} />
                    </div>
                    {idea.description && <p className="mt-1 text-xs text-slate-500">{idea.description}</p>}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
