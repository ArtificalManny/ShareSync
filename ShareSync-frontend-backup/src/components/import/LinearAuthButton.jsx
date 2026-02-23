import { toast } from "../ui/toast";
// src/components/import/LinearAuthButton.jsx
import React, { useState } from "react";
import { track } from "../../utils/telemetry";
import { ShieldCheck, Loader2 } from "lucide-react";

const CLIENT_ID = import.meta?.env?.VITE_LINEAR_CLIENT_ID || "";

export default function LinearAuthButton({ onAuthed }) {
  const [loading, setLoading] = useState(false);

  const start = async () => {
    setLoading(true);
    try {
      // MVP: no real OAuth. If not configured, show friendly message and proceed with a fake token
      if (!CLIENT_ID) {
        track("import_started", { provider: "linear", configured: false });
        toast.warning("Demo mode", { description: "Linear SSO not configured - using demo token", duration: 3000 });
        await new Promise((r) => setTimeout(r, 600));
        onAuthed?.({ accessToken: "demo-linear-token" });
        return;
      }
      // If you wire OAuth later, replace this block.
      track("import_started", { provider: "linear", configured: true });
      toast.info("Demo mode", { description: "Using demo token for testing", duration: 3000 });
      await new Promise((r) => setTimeout(r, 400));
      onAuthed?.({ accessToken: "demo-linear-token" });
    } catch (e) {
      toast.error('Auth failed', { description: e?.message || 'Please try again', duration: 3000 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={start}
      disabled={loading}
      className="inline-flex items-center gap-2 rounded-xl px-3 py-2 bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60"
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
      {loading ? "Connecting…" : "Connect Linear"}
    </button>
  );
}
