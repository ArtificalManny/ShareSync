import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { acceptInvite } from "../api/invite";
import { toast } from "../components/ui/Toaster.jsx";
import { track } from "../utils/telemetry";
import GradientText from "../components/ui/GradientText.jsx";

function useQueryParam(name) {
  const { search } = useLocation();
  return new URLSearchParams(search).get(name);
}

export default function AcceptInvite() {
  const navigate = useNavigate();
  const token = useQueryParam("token");
  const [status, setStatus] = useState("pending"); // 'pending' | 'ok' | 'error'
  const [message, setMessage] = useState("");

  useEffect(() => {
    let ignore = false;

    (async () => {
      if (!token) {
        setStatus("error");
        setMessage("Missing invite token.");
        toast({ title: "Invite error", description: "Missing invite token", variant: "error" });
        try { track("invite_error", { action: "accept", reason: "missing_token" }); } catch {}
        return;
      }
      try {
        const res = await acceptInvite(token);
        if (ignore) return;
        const projectId = res?.projectId || res?.project?._id || res?.project?.id;
        const userId = res?.userId || res?.user?.id || res?.user?._id;

        toast({ title: "Invite accepted", variant: "success" });
        try { track("invite_accepted", { projectId, userId }); } catch {}

        setStatus("ok");
        setMessage("Invite accepted. Redirecting…");

        // Navigate to project if we have an id, else to /projects
        setTimeout(() => {
          if (projectId) navigate(`/projects/${projectId}`, { replace: true });
          else navigate("/projects", { replace: true });
        }, 900);
      } catch (e) {
        if (ignore) return;
        const msg = e?.message || "Failed to accept invite.";
        setStatus("error");
        setMessage(msg);
        toast({ title: "Invite error", description: msg, variant: "error" });
        try { track("invite_error", { action: "accept", message: msg }); } catch {}
      }
    })();

    return () => { ignore = true; };
  }, [token, navigate]);

  return (
    <main id="main" role="main" tabIndex={-1}>
      <div className="px-4 sm:px-6 lg:px-8 py-10 max-w-md mx-auto">
        <div className="rounded-2xl border border-border bg-surface p-6 text-center">
          <div className="text-lg font-semibold">
            <GradientText variant="pandora">Accepting invite…</GradientText>
          </div>
          <div className="mt-2 text-sm text-muted">
            {status === "pending" && "Please wait while we confirm your invite."}
            {status !== "pending" && message}
          </div>
          {status !== "pending" && (
            <button
              className="mt-4 inline-flex items-center gap-2 rounded-xl px-4 py-2 text-white bg-grad-blue"
              onClick={() => navigate("/projects")}
            >
              Go to Projects
              <span className="shine pointer-events-none" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
