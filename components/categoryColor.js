// Consistent colored label per category, used on idea cards and the
// roadmap. Anything not in this map (e.g. a category an admin just added)
// falls back to indigo so it still looks intentional.
const COLORS = {
  Feature: "text-emerald-600",
  Improvement: "text-blue-600",
  Integration: "text-purple-600",
  Bug: "text-red-600",
  Other: "text-slate-500",
};

export default function categoryColor(category) {
  return COLORS[category] || "text-indigo-600";
}
