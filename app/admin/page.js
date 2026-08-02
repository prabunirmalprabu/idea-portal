"use client";
import { useEffect, useState } from "react";

const statuses = ["New", "Under Review", "Planned", "In Progress", "Shipped", "Not Planned"];
const timeframes = ["Backlog", "Now", "Next", "Later"];
const categories = ["Feature", "Improvement", "Integration", "Bug", "Other"];

export default function AdminPage() {
  const [authed, setAuthed] = useState(null);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [ideas, setIdeas] = useState([]);
  const [newItem, setNewItem] = useState({
    title: "",
    description: "",
    category: "Feature",
    status: "Planned",
    timeframe: "Now",
  });

  async function loadIdeas() {
    const res = await fetch("/api/admin/ideas");
    if (res.status === 401) {
      setAuthed(false);
      return;
    }
    const data = await res.json();
    setIdeas(data.ideas || []);
    setAuthed(true);
  }

  useEffect(() => {
    loadIdeas();
  }, []);

  async function handleLogin(e) {
    e.preventDefault();
    setLoginError("");
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (!res.ok) {
      const data = await res.json();
      setLoginError(data.error || "Login failed");
      return;
    }
    setPassword("");
    loadIdeas();
  }

  async function handleUpdate(id, fields) {
    setIdeas((prev) => prev.map((i) => (i.id === id ? { ...i, ...fields } : i)));
    await fetch(`/api/admin/ideas/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fields),
    });
  }

  async function handleAddRoadmapItem(e) {
    e.preventDefault();
    if (!newItem.title.trim()) return;
    const res = await fetch("/api/admin/ideas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newItem),
    });
    const data = await res.json();
    if (res.ok) {
      setIdeas((prev) => [data.idea, ...prev]);
      setNewItem({ title: "", description: "", category: "Feature", status: "Planned", timeframe: "Now" });
    }
  }

  if (authed === null) {
    return <p className="text-sm text-slate-500">Checking session…</p>;
  }

  if (!authed) {
    return (
      <div className="mx-auto max-w-sm">
        <h1 className="mb-4 text-xl font-semibold">Admin login</h1>
        <form onSubmit={handleLogin} className="space-y-3">
          <input
            type="password"
            placeholder="Admin password"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {loginError && <p className="text-sm text-red-600">{loginError}</p>}
          <button
            type="submit"
            className="w-full rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            Log in
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Admin: roadmap &amp; triage</h1>
        <p className="text-sm text-slate-500">
          Capture roadmap items directly, or triage ideas submitted by customers.
        </p>
      </div>

      <form onSubmit={handleAddRoadmapItem} className="space-y-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="font-medium">Add a roadmap item</h2>
        <input
          placeholder="Title"
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          value={newItem.title}
          onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
        />
        <textarea
          placeholder="Description"
          rows={2}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          value={newItem.description}
          onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
        />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <select
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            value={newItem.category}
            onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
          >
            {categories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <select
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            value={newItem.status}
            onChange={(e) => setNewItem({ ...newItem, status: e.target.value })}
          >
            {statuses.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <select
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            value={newItem.timeframe}
            onChange={(e) => setNewItem({ ...newItem, timeframe: e.target.value })}
          >
            {timeframes.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </div>
        <button type="submit" className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
          Add item
        </button>
      </form>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-3 py-2">Idea</th>
              <th className="px-3 py-2">Source</th>
              <th className="px-3 py-2">Votes</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Timeframe</th>
              <th className="px-3 py-2">Category</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {ideas.map((idea) => (
              <tr key={idea.id}>
                <td className="px-3 py-2">
                  <div className="font-medium text-slate-900">{idea.title}</div>
                  {idea.submitterName && <div className="text-xs text-slate-400">{idea.submitterName}</div>}
                </td>
                <td className="px-3 py-2">{idea.source}</td>
                <td className="px-3 py-2">{idea.votes}</td>
                <td className="px-3 py-2">
                  <select
                    className="rounded-md border border-slate-300 px-2 py-1 text-xs"
                    value={idea.status}
                    onChange={(e) => handleUpdate(idea.id, { status: e.target.value })}
                  >
                    {statuses.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-2">
                  <select
                    className="rounded-md border border-slate-300 px-2 py-1 text-xs"
                    value={idea.timeframe}
                    onChange={(e) => handleUpdate(idea.id, { timeframe: e.target.value })}
                  >
                    {timeframes.map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-2">
                  <select
                    className="rounded-md border border-slate-300 px-2 py-1 text-xs"
                    value={idea.category}
                    onChange={(e) => handleUpdate(idea.id, { category: e.target.value })}
                  >
                    {categories.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
