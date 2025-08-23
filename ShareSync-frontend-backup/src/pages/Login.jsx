// /src/pages/Login.jsx
import React, { useContext, useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { AuthContext } from "../AuthContext";

export default function Login() {
  const { user, login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // If already logged in, bounce to home
  if (user) {
    return <Navigate to="/home" replace />;
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError("Enter your email and password.");
      return;
    }
    setSubmitting(true);
    try {
      await login({ email, password }); // sets ss.jwt + ss.user
      navigate("/home", { replace: true });
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Login failed. Check your credentials.";
      setError(String(msg));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="ml-0 md:ml-24 px-4 sm:px-6 lg:px-8 py-8 min-h-screen grid place-items-start">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 rounded-2xl p-6 shadow-sm"
      >
        <h1 className="text-xl font-semibold mb-4">Log In</h1>

        {error && (
          <div className="mb-3 rounded-lg border border-rose-200 bg-rose-50 text-rose-800 text-sm px-3 py-2">
            {error}
          </div>
        )}

        <label className="block text-sm text-slate-700 dark:text-slate-300 mb-1">
          Email
        </label>
        <input
          type="email"
          autoComplete="email"
          className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 mb-3"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <label className="block text-sm text-slate-700 dark:text-slate-300 mb-1">
          Password
        </label>
        <input
          type="password"
          autoComplete="current-password"
          className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 mb-4"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white py-2 font-medium disabled:opacity-70"
        >
          {submitting ? "Signing in…" : "Log In"}
        </button>
      </form>
    </main>
  );
}