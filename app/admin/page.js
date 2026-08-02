"use client";
import { useEffect, useState } from "react";

const FIELD_LABELS = {
  status: "Status",
  timeframe: "Release Quarter",
  category: "Category",
  product: "Product",
};

function AddOptionRow({ field, options, onAdd }) {
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleAdd() {
    if (!value.trim()) return;
    setSaving(true);
    try {
      await onAdd(field, value.trim());
      setValue("");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {FIELD_LABELS[field]}
      </div>
      <div className="flex flex-wrap gap-1">
        {options.map((o) => (
          <span key={o} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
            {o}
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          className="min-w-0 flex-1 rounded-md border border-slate-300 px-2 py-1 text-sm"
          placeholder={`Add new ${FIELD_LABELS[field].toLowerCase()}...`}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
        />
        <button
          onClick={handleAdd}
          disabled={saving}
          className="rounded-md bg-slate-800 px-3 py-1 text-xs font-medium text-white hover:bg-slate-900 disabled:opacity-50"
        >
          Add
        </button>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const [authed, setAuthed] = useState(null);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [ideas, setIdeas] = useState([]);
  const [fields, setFields] = useState({ status: [], timeframe: [], category: [], product: [] });
  const [newItem, setNewItem] = useState({
    title: "",
    description: "",
    category: "",
    status: "",
    timeframe: "",
    product: "",
    releaseNotes: "",
  });
  const [importFile, setImportFile] = useState(null);
  const [importMessage, setImportMessage] = useState("");
  const [importing, setImporting] = useState(false);

  async function loadAll() {
    const res = await fetch("/api/admin/ideas");
    if (res.status === 401) {
      setAuthed(false);
      return;
    }
    const data = await res.json();
    setIdeas(data.ideas || []);
    setAuthed(true);

    const fieldsRes = await fetch("/api/admin/fields");
    if (fieldsRes.ok) {
      const fieldsData = await fieldsRes.json();
      setFields(fieldsData.fields || {});
      setNewItem((prev) => ({
        ...prev,
        category: prev.category || fieldsData.fields?.category?.[0] || "",
        status: prev.status || fieldsData.fields?.status?.[0] || "",
        timeframe: prev.timeframe || fieldsData.fields?.timeframe?.[0] || "",
        product: prev.product || fieldsData.fields?.product?.[0] || "",
      }));
    }
  }

  useEffect(() => {
    loadAll();
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
    loadAll();
  }

  async function handleUpdate(id, fieldUpdates) {
    setIdeas((prev) => prev.map((i) => (i.id === id ? { ...i, ...fieldUpdates } : i)));
    await fetch(`/api/admin/ideas/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fieldUpdates),
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
      setNewItem((prev) => ({
        ...prev,
        title: "",
        description: "",
        releaseNotes: "",
      }));
    }
  }

  async function handleAddFieldOption(field, value) {
    const res = await fetch("/api/admin/fields", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ field, value }),
    });
    if (res.ok) {
      const data = await res.json();
      setFields((prev) => ({ ...prev, [field]: data.options }));
    }
  }

  async function handleImport(e) {
    e.preventDefault();
    if (!importFile) return;
    setImporting(true);
    setImportMessage("");
    try {
      const formData = new FormData();
      formData.append("file", importFile);
      const res = await fetch("/api/admin/import", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Import failed");
      setImportMessage(
        `Imported ${data.created} row${data.created === 1 ? "" : "s"}` +
          (data.skipped ? ` (skipped ${data.skipped} row${data.skipped === 1 ? "" : "s"} with no title).` : ".")
      );
      setImportFile(null);
      loadAll();
    } catch (err) {
      setImportMessage(err.message || "Import failed");
    } finally {
      setImporting(false);
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
          Capture roadmap items directly, triage customer ideas, or bulk-import from Excel.
        </p>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="font-medium">Import from Excel</h2>
        <p className="mt-1 text-xs text-slate-500">
          Upload an .xlsx file with a column named "Idea" or "Title" (required), plus optional
          columns: Description, Status, Release Quarter, Category, Product, Release Notes. Each row
          becomes a roadmap item.
        </p>
        <form onSubmit={handleImport} className="mt-3 flex flex-wrap items-center gap-3">
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={(e) => setImportFile(e.target.files?.[0] || null)}
            className="text-sm"
          />
          <button
            type="submit"
            disabled={!importFile || importing}
            className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {importing ? "Uploading…" : "Upload"}
          </button>
        </form>
        {importMessage && <p className="mt-2 text-sm text-slate-600">{importMessage}</p>}
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="font-medium">Manage field options</h2>
        <p className="mt-1 text-xs text-slate-500">
          Add new values here — they immediately become available in Admin dropdowns and, where
          relevant, the public submission form.
        </p>
        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Object.keys(FIELD_LABELS).map((field) => (
            <AddOptionRow
              key={field}
              field={field}
              options={fields[field] || []}
              onAdd={handleAddFieldOption}
            />
          ))}
        </div>
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
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <select
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            value={newItem.category}
            onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
          >
            {fields.category?.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <select
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            value={newItem.status}
            onChange={(e) => setNewItem({ ...newItem, status: e.target.value })}
          >
            {fields.status?.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <select
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            value={newItem.timeframe}
            onChange={(e) => setNewItem({ ...newItem, timeframe: e.target.value })}
          >
            {fields.timeframe?.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
          <select
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            value={newItem.product}
            onChange={(e) => setNewItem({ ...newItem, product: e.target.value })}
          >
            {fields.product?.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </div>
        <textarea
          placeholder="Release notes (shown publicly once marked Shipped)"
          rows={2}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          value={newItem.releaseNotes}
          onChange={(e) => setNewItem({ ...newItem, releaseNotes: e.target.value })}
        />
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
              <th className="px-3 py-2">Release Quarter</th>
              <th className="px-3 py-2">Category</th>
              <th className="px-3 py-2">Product</th>
              <th className="px-3 py-2">Release Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {ideas.map((idea) => (
              <tr key={idea.id}>
                <td className="px-3 py-2 align-top">
                  <div className="font-medium text-slate-900">{idea.title}</div>
                  {idea.submitterName && <div className="text-xs text-slate-400">{idea.submitterName}</div>}
                </td>
                <td className="px-3 py-2 align-top">{idea.source}</td>
                <td className="px-3 py-2 align-top">{idea.votes}</td>
                <td className="px-3 py-2 align-top">
                  <select
                    className="rounded-md border border-slate-300 px-2 py-1 text-xs"
                    value={idea.status}
                    onChange={(e) => handleUpdate(idea.id, { status: e.target.value })}
                  >
                    {fields.status?.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-2 align-top">
                  <select
                    className="rounded-md border border-slate-300 px-2 py-1 text-xs"
                    value={idea.timeframe}
                    onChange={(e) => handleUpdate(idea.id, { timeframe: e.target.value })}
                  >
                    {fields.timeframe?.map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-2 align-top">
                  <select
                    className="rounded-md border border-slate-300 px-2 py-1 text-xs"
                    value={idea.category}
                    onChange={(e) => handleUpdate(idea.id, { category: e.target.value })}
                  >
                    {fields.category?.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-2 align-top">
                  <select
                    className="rounded-md border border-slate-300 px-2 py-1 text-xs"
                    value={idea.product}
                    onChange={(e) => handleUpdate(idea.id, { product: e.target.value })}
                  >
                    {fields.product?.map((p) => (
                      <option key={p}>{p}</option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-2 align-top">
                  <input
                    className="w-48 rounded-md border border-slate-300 px-2 py-1 text-xs"
                    defaultValue={idea.releaseNotes}
                    placeholder="What shipped..."
                    onBlur={(e) => {
                      if (e.target.value !== idea.releaseNotes) {
                        handleUpdate(idea.id, { releaseNotes: e.target.value });
                      }
                    }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
