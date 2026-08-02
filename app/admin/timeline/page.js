"use client";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import AdminGate from "@/components/AdminGate";

const AdminGantt = dynamic(() => import("@/components/AdminGantt"), {
  ssr: false,
  loading: () => <p className="text-sm text-slate-500">Loading timeline…</p>,
});

function TimelineContent() {
  const [ideas, setIdeas] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/ideas");
    if (res.ok) {
      const data = await res.json();
      setIdeas(data.ideas || []);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleDateChange(id, dates) {
    setIdeas((prev) => prev.map((i) => (i.id === id ? { ...i, ...dates } : i)));
    await fetch(`/api/admin/ideas/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dates),
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold">Timeline</h1>
          <p className="text-sm text-slate-500">
            Drag to reschedule, resize to change duration. Admin-only — never shown publicly.
          </p>
        </div>
        <Link href="/admin" className="text-sm font-medium text-brand-600 hover:text-brand-700">
          &larr; Back to Admin
        </Link>
      </div>
      {loading ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : (
        <AdminGantt ideas={ideas} onDateChange={handleDateChange} />
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
