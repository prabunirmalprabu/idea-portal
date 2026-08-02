"use client";
import { useEffect, useState } from "react";

// Shared login gate for every /admin* page. Renders children only once the
// admin_session cookie checks out; otherwise shows a password form.
export default function AdminGate({ children }) {
  const [authed, setAuthed] = useState(null);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  async function checkAuth() {
    const res = await fetch("/api/admin/session");
    const data = await res.json();
    setAuthed(!!data.authed);
  }

  useEffect(() => {
    checkAuth();
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
    checkAuth();
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

  return children;
}
