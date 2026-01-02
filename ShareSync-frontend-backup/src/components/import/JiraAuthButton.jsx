import { toast } from "../ui/Toast";
// src/components/import/JiraAuthButton.jsx
import React, { useState } from "react";
import { track } from "../../utils/telemetry";
import { ShieldCheck, Loader2 } from "lucide-react";

const CLIENT_ID = import.meta?.env?.VITE_JIRA_CLIENT_ID || "";

export default function JiraAuthButton({ onAuthed }) {
  const [loading, setLoading] = useState(false);

  const start = async () => {
    setLoading(true);
    try {
      if (!CLIENT_ID) {
        track("import_started", { provider: "jira", configured: false });
        toast.warning("Demo mode", { description: "Jira SSO not configured - using demo token", duration: 3000 });
        await new Promise((r) => setTimeout(r, 600));
        onAuthed?.({ accessToken: "demo-jira-token" });
        return;
      }
      track("import_started", { provider: "jira", configured: true });
      alert("Jira OAuth not implemented in this stub. Using demo token.");
      await new Promise((r) => setTimeout(r, 400));
      onAuthed?.({ accessToken: "demo-jira-token" });
    } catch (e) {
      alert(e?.message || "Auth failed.");
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
      {loading ? "Connecting…" : "Connect Jira"}
    </button>
  );
}
