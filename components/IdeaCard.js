"use client";
import StatusBadge from "./StatusBadge";
import categoryColor from "./categoryColor";

export default function IdeaCard({ idea, hasVoted, onVote }) {
  return (
    <div className="flex gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-shrink-0 flex-col items-center gap-2">
        <div className="text-2xl font-bold text-slate-800">{idea.votes}</div>
        <button
          onClick={() => onVote(idea.id)}
          disabled={hasVoted}
          className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
            hasVoted
              ? "bg-brand-600 text-white"
              : "border border-brand-500 text-brand-600 hover:bg-brand-50"
          }`}
        >
          {hasVoted ? "Voted" : "Vote"}
        </button>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h3 className="font-medium text-slate-900">{idea.title}</h3>
          <StatusBadge status={idea.status} />
        </div>
        {idea.description && <p className="mt-1 text-sm text-slate-600">{idea.description}</p>}
        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
          {idea.submitterName && <span className="text-slate-400">Submitted by {idea.submitterName}</span>}
          <span className={`font-semibold ${categoryColor(idea.category)}`}>{idea.category}</span>
          {idea.product && <span className="text-slate-400">{idea.product}</span>}
        </div>
      </div>
    </div>
  );
}
