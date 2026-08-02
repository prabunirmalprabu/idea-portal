import { getRoadmapIdeas, getFieldOptions } from "@/lib/smartsheet";
import RoadmapBoard from "./RoadmapBoard";

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

  return <RoadmapBoard ideas={ideas} quarters={quarters} products={fields.product || []} />;
}
