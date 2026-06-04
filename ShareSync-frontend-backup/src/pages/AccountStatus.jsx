// src/pages/AccountStatus.jsx

import React from "react";
import {
  clearAccountStatusNotice,
  getAccountStatusNotice,
} from "../utils/accountStatusHandler";

export default function AccountStatus() {
  const notice = getAccountStatusNotice();

  const status = notice?.status || "restricted";
  const message =
    notice?.message ||
    "Your account is currently restricted. Please contact support if you believe this is a mistake.";

  const suspendedUntil = notice?.suspendedUntil
    ? new Date(notice.suspendedUntil)
    : null;

  const handleBackToLogin = () => {
    clearAccountStatusNotice();
    window.location.href = "/login";
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-6 bg-gradient-to-br from-slate-950 via-slate-900 to-violet-950 text-white">
      <section className="w-full max-w-xl rounded-[2rem] border border-white/15 bg-white/10 backdrop-blur-xl shadow-2xl p-8 text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/15 border border-red-300/30">
          <span className="text-3xl">⚠️</span>
        </div>

        <p className="mb-3 text-xs uppercase tracking-[0.28em] text-red-200">
          Account {status}
        </p>

        <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
          Account access limited
        </h1>

        <p className="text-slate-200 leading-relaxed mb-6">{message}</p>

        {suspendedUntil && (
          <div className="mb-6 rounded-2xl border border-white/10 bg-black/20 p-4">
            <p className="text-sm text-slate-300">Suspension ends</p>
            <p className="mt-1 font-semibold text-white">
              {suspendedUntil.toLocaleString()}
            </p>
          </div>
        )}

        <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-left text-sm text-slate-300 mb-6">
          <p className="font-semibold text-white mb-2">What this means</p>
          <p>
            Some or all account actions are currently blocked by OpenShare’s
            account safety system. If this was unexpected, contact support or
            wait until the suspension period ends.
          </p>
        </div>

        <button
          type="button"
          onClick={handleBackToLogin}
          className="w-full rounded-2xl bg-white text-slate-950 font-semibold py-3 hover:bg-slate-100 transition"
        >
          Back to login
        </button>
      </section>
    </main>
  );
}
