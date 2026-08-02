"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import AdminGate from "@/components/AdminGate";
import TimelineTable from "@/components/TimelineTable";

function TimelineContent() {
  const [ideas, setIdeas] = useState([]);
  const [fields, setFields] = useState({});
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const [ideasRes, fieldsRes] = await Promise.all([
      fetch("/api/admin/ideas"),
      fetch("/api/admin/fields"),
    ]);
    if (ideasRes.ok) {
      const data = await ideasRes.json();
      setIdeas(data.ideas || []);
    }
    if (fieldsRes.ok) {
      const data = await fieldsRes.json();
      setFields(data.fields || {});
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleUpdate(id, updates) {
    setIdeas((prev) => prev.map((i) => (i.id === id ? { ...i, ...updates } : i)));
    await fetch(`/api/admin/ideas/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold">Timeline</h1>
          <p className="text-sm text-slate-500">
            Sorted by start date. Filter by Product or Status, and edit dates or status inline.
            Admin-only — never shown publicly.
          </p>
        </div>
        <Link href="/admin" className="text-sm font-medium text-brand-600 hover:text-brand-700">
          &larr; Back to Admin
        </Link>
      </div>
      {loading ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : (
        <TimelineTable ideas={ideas} fields={fields} onUpdate={handleUpdate} />
      )}
    </div>
  );
}

export default function TimelinePage() {
  return (
    <AdminGate>
      <TimelineContent />
    </AdminGate>
  );
}
