"use client";
import { useEffect, useMemo, useState } from "react";
import IdeaCard from "@/components/IdeaCard";
import SubmitIdeaForm from "@/components/SubmitIdeaForm";

const VOTED_KEY = "idea-portal-voted-ids";

function getVotedIds() {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(VOTED_KEY) || "[]");
  } catch {
    return [];
  }
}

export default function IdeasBoard({ initialIdeas, categories = [], products = [] }) {
  const [ideas, setIdeas] = useState(initialIdeas);
  const [category, setCategory] = useState("All");
  const [votedIds, setVotedIds] = useState([]);
  const categoryOptions = ["All", ...categories];

  useEffect(() => {
    setVotedIds(getVotedIds());
  }, []);

  const filtered = useMemo(() => {
    const list = category === "All" ? ideas : ideas.filter((i) => i.category === category);
    return [...list].sort((a, b) => b.votes - a.votes);
  }, [ideas, category]);

  async function handleSubmit(form) {
    const res = await fetch("/api/ideas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to submit idea");
    setIdeas((prev) => [data.idea, ...prev]);
  }

  async function handleVote(id) {
    if (votedIds.includes(id)) return;
    setIdeas((prev) => prev.map((i) => (i.id === id ? { ...i, votes: i.votes + 1 } : i)));
    const next = [...votedIds, id];
    setVotedIds(next);
    localStorage.setItem(VOTED_KEY, JSON.stringify(next));
    try {
      const res = await fetch(`/api/ideas/${id}/vote`, { method: "POST" });
      if (!res.ok) throw new Error("Vote failed");
    } catch {
      setIdeas((prev) => prev.map((i) => (i.id === id ? { ...i, votes: i.votes - 1 } : i)));
      const reverted = next.filter((v) => v !== id);
      setVotedIds(reverted);
      localStorage.setItem(VOTED_KEY, JSON.stringify(reverted));
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Ideas</h1>
          <p className="text-sm text-slate-500">Vote on ideas or submit your own.</p>
        </div>
        <SubmitIdeaForm onSubmit={handleSubmit} categories={categories} products={products} />
      </div>

      <div className="flex flex-wrap gap-2">
        {categoryOptions.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`rounded-full px-3 py-1 text-sm font-medium ${
              category === c ? "bg-brand-600 text-white" : "border border-slate-200 bg-white text-slate-600"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.length === 0 && (
          <p className="text-sm text-slate-500">No ideas yet — be the first to submit one.</p>
        )}
        {filtered.map((idea) => (
          <IdeaCard key={idea.id} idea={idea} hasVoted={votedIds.includes(idea.id)} onVote={handleVote} />
        ))}
      </div>
    </div>
  );
}
