const styles = {
  New: "bg-slate-100 text-slate-700",
  "Under Review": "bg-amber-100 text-amber-700",
  Planned: "bg-orange-100 text-orange-700",
  "In Progress": "bg-purple-100 text-purple-700",
  Shipped: "bg-green-100 text-green-700",
  "Not Planned": "bg-red-100 text-red-700",
};

export default function StatusBadge({ status }) {
  const cls = styles[status] || "bg-slate-100 text-slate-700";
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`}>
      {status}
    </span>
  );
}
