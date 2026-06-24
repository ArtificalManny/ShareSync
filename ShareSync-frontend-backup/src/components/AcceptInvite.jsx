import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { acceptInvite } from "../api/invites";
import { toast } from "../components/ui/Toaster.jsx";
import { track } from "../utils/telemetry";
import GradientText from "../components/ui/GradientText.jsx";

const INVITE_REDIRECT_SESSION_KEY = "openshare.pendingInviteRedirect";
const INVITE_REDIRECT_LOCAL_KEY = "openshare.postLoginRedirect";

function getAuthToken() {
  try {
    return (
      localStorage.getItem("token") ||
      localStorage.getItem("accessToken") ||
      localStorage.getItem("access_token") ||
      localStorage.getItem("authToken") ||
      ""
    );
  } catch {
    return "";
  }
}

function getCurrentInviteRedirect() {
  const path = window.location.pathname || "/invite/accept";
  const search = window.location.search || "";
  return `${path}${search}`;
}

function saveInviteRedirect(redirectTo) {
  try {
    sessionStorage.setItem(INVITE_REDIRECT_SESSION_KEY, redirectTo);
    localStorage.setItem(INVITE_REDIRECT_LOCAL_KEY, redirectTo);
  } catch {}
}

function clearPossiblyWrongAuthSession() {
  try {
    [
      "token",
      "accessToken",
      "access_token",
      "authToken",
      "ss.token",
      "sharesync.token",
      "ss.user",
      "sharesync.user.v1",
      "user",
    ].forEach((key) => localStorage.removeItem(key));
  } catch {}
}

function isAuthInviteError(error, message) {
  const status = error?.response?.status;

  return (
    status === 401 ||
    status === 403 ||
    /unauthorized|forbidden|different email|different account|not authorized/i.test(
      String(message || "")
    )
  );
}

export default function AcceptInvite() {
  const navigate = useNavigate();
  const { search } = useLocation();
  const { token: pathToken } = useParams();

  const queryToken = useMemo(() => {
    return new URLSearchParams(search).get("token");
  }, [search]);

  const token = pathToken || queryToken;

  const [status, setStatus] = useState("pending");
  const [message, setMessage] = useState("Please wait while we confirm your invite.");
  const [projectId, setProjectId] = useState(null);

  useEffect(() => {
    let ignore = false;

    async function redirectToLogin(reason = "login_required") {
      const redirectTo = getCurrentInviteRedirect();
      saveInviteRedirect(redirectTo);

      try {
        track("invite_login_redirect", { reason, redirectTo });
      } catch {}

      navigate(`/login?redirect=${encodeURIComponent(redirectTo)}`, {
        replace: true,
      });
    }

    async function run() {
      if (!token) {
        setStatus("error");
        setMessage("Missing invite token.");
        toast({
          title: "Invite error",
          description: "Missing invite token.",
          variant: "error",
        });
        try {
          track("invite_error", { action: "accept", reason: "missing_token" });
        } catch {}
        return;
      }

      const authToken = getAuthToken();

      if (!authToken) {
        await redirectToLogin("missing_auth_token");
        return;
      }

      try {
        const res = await acceptInvite(token);

        if (ignore) return;

        const acceptedProjectId =
          res?.projectId ||
          res?.data?.projectId ||
          res?.project?._id ||
          res?.project?.id ||
          res?.data?.project?._id ||
          res?.data?.project?.id;

        const acceptedUserId =
          res?.userId ||
          res?.data?.userId ||
          res?.user?._id ||
          res?.user?.id ||
          res?.data?.user?._id ||
          res?.data?.user?.id;

        setProjectId(acceptedProjectId || null);
        setStatus("ok");
        setMessage("Invite accepted. Redirecting to the project…");

        toast({ title: "Invite accepted", variant: "success" });

        try {
          track("invite_accepted", {
            projectId: acceptedProjectId,
            userId: acceptedUserId,
          });
        } catch {}

        window.dispatchEvent(
          new CustomEvent("project:members-updated", {
            detail: { projectId: acceptedProjectId },
          })
        );

        setTimeout(() => {
          if (acceptedProjectId) {
            navigate(`/projects/${acceptedProjectId}`, { replace: true });
          } else {
            navigate("/projects", { replace: true });
          }
        }, 900);
      } catch (e) {
        if (ignore) return;

        const msg =
          e?.response?.data?.message ||
          e?.message ||
          "Failed to accept invite.";

        if (isAuthInviteError(e, msg)) {
          const redirectTo = getCurrentInviteRedirect();
          saveInviteRedirect(redirectTo);
          clearPossiblyWrongAuthSession();

          toast({
            title: "Please log in to accept invite",
            description: "Use the account this invite was sent to.",
            variant: "warning",
          });

          navigate(`/login?redirect=${encodeURIComponent(redirectTo)}`, {
            replace: true,
          });
          return;
        }

        setStatus("error");
        setMessage(msg);

        toast({
          title: "Invite error",
          description: msg,
          variant: "error",
        });

        try {
          track("invite_error", { action: "accept", message: msg });
        } catch {}
      }
    }

    run();

    return () => {
      ignore = true;
    };
  }, [token, navigate]);

  return (
    <main id="main" role="main" tabIndex={-1}>
      <div className="min-h-[70vh] px-4 sm:px-6 lg:px-8 py-10 flex items-center justify-center">
        <div className="w-full max-w-md rounded-3xl border border-border bg-surface p-6 text-center shadow-xl">
          <div className="text-lg font-semibold">
            <GradientText variant="pandora">
              {status === "ok"
                ? "Invite accepted"
                : status === "error"
                  ? "Invite needs attention"
                  : "Accepting invite…"}
            </GradientText>
          </div>

          <div className="mt-2 text-sm text-muted">{message}</div>

          {status === "pending" && (
            <div className="mt-5 mx-auto h-2 w-28 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full w-1/2 animate-pulse rounded-full bg-violet-500" />
            </div>
          )}

          {status !== "pending" && (
            <button
              className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white bg-grad-blue"
              onClick={() => {
                if (projectId) navigate(`/projects/${projectId}`, { replace: true });
                else navigate("/projects", { replace: true });
              }}
            >
              {projectId ? "Go to Project" : "Go to Projects"}
              <span className="shine pointer-events-none" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
