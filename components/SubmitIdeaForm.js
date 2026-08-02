"use client";
import { useState } from "react";

const categories = ["Feature", "Improvement", "Integration", "Bug", "Other"];

export default function SubmitIdeaForm({ onSubmit }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    submitterName: "",
    submitterEmail: "",
    category: "Feature",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.title.trim()) {
      setError("Give your idea a title.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await onSubmit(form);
      setForm({
        title: "",
        description: "",
        submitterName: "",
        submitterEmail: "",
        category: "Feature",
      });
      setOpen(false);
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
      >
        + Submit an idea
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div>
        <label className="block text-sm font-medium text-slate-700">Idea title</label>
        <input
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="What should we build?"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">Description</label>
        <textarea
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          rows={3}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Tell us more about the problem or use case."
        />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-slate-700">Your name</label>
          <input
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            value={form.submitterName}
            onChange={(e) => setForm({ ...form, submitterName: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Email</label>
          <input
            type="email"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            value={form.submitterEmail}
            onChange={(e) => setForm({ ...form, submitterEmail: e.target.value })}
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">Category</label>
        <select
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
        >
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {submitting ? "Submitting…" : "Submit idea"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-md px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
