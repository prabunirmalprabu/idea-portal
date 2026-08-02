"use client";
import StatusBadge from "./StatusBadge";

export default function IdeaCard({ idea, hasVoted, onVote }) {
  return (
    <div className="flex gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <button
        onClick={() => onVote(idea.id)}
        disabled={hasVoted}
        className={`flex h-14 w-12 flex-shrink-0 flex-col items-center justify-center rounded-md border text-sm font-semibold ${
          hasVoted
            ? "border-brand-200 bg-brand-50 text-brand-700"
            : "border-slate-200 text-slate-600 hover:border-brand-400 hover:text-brand-700"
        }`}
        title={hasVoted ? "You already voted" : "Vote for this idea"}
      >
        <span>▲</span>
        <span>{idea.votes}</span>
      </button>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-medium text-slate-900">{idea.title}</h3>
          <StatusBadge status={idea.status} />
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
            {idea.category}
          </span>
          {idea.product && (
            <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs text-indigo-600">
              {idea.product}
            </span>
          )}
        </div>
        {idea.description && <p className="mt-1 text-sm text-slate-600">{idea.description}</p>}
        {idea.submitterName && (
          <p className="mt-2 text-xs text-slate-400">Submitted by {idea.submitterName}</p>
        )}
      </div>
    </div>
  );
}
