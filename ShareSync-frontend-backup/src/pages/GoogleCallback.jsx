// src/pages/GoogleCallback.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { trackRegistrationCompleted } from "../utils/telemetry";
import { setTokens } from "../utils/tokenUtils";

const GOOGLE_REGISTRATION_PENDING_KEY =
  "openshare:google-registration-pending";

function clearGoogleRegistrationPending() {
  try {
    sessionStorage.removeItem(
      GOOGLE_REGISTRATION_PENDING_KEY,
    );
  } catch {
    // Telemetry state must never interfere with authentication.
  }
}

function consumeGoogleRegistrationPending() {
  try {
    const wasPending =
      sessionStorage.getItem(
        GOOGLE_REGISTRATION_PENDING_KEY,
      ) === "1";

    sessionStorage.removeItem(
      GOOGLE_REGISTRATION_PENDING_KEY,
    );

    return wasPending;
  } catch {
    return false;
  }
}

export default function GoogleCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [message, setMessage] = useState(
    "Signing you in with Google...",
  );

  useEffect(() => {
    try {
      const error = searchParams.get("error");

      if (error) {
        clearGoogleRegistrationPending();

        console.error(
          "[GoogleCallback] OAuth error:",
          error,
        );

        setMessage(
          "Google sign-in failed. Redirecting...",
        );

        setTimeout(
          () =>
            navigate(
              `/login?error=${encodeURIComponent(error)}`,
              { replace: true },
            ),
          900,
        );

        return;
      }

      // openshare-google-persistent-session-frontend-v1
      const fragmentParams = new URLSearchParams(
        window.location.hash.replace(/^#/, ""),
      );

      const token =
        fragmentParams.get("access_token") ||
        searchParams.get("token") ||
        searchParams.get("accessToken") ||
        searchParams.get("access_token");

      const refreshToken =
        fragmentParams.get("refresh_token") ||
        searchParams.get("refresh_token");

      const userParam =
        fragmentParams.get("user") ||
        searchParams.get("user");

      // Remove OAuth credentials from the visible URL/history
      // immediately after reading them.
      if (
        window.location.hash ||
        window.location.search
      ) {
        window.history.replaceState(
          {},
          document.title,
          window.location.pathname,
        );
      }

      if (!token) {
        clearGoogleRegistrationPending();

        console.error(
          "[GoogleCallback] Missing token in callback URL.",
        );

        setMessage(
          "Google sign-in failed: missing token.",
        );

        setTimeout(
          () =>
            navigate(
              "/login?error=missing_google_token",
              { replace: true },
            ),
          900,
        );

        return;
      }

      let parsedUser = null;

      if (userParam) {
        try {
          parsedUser = JSON.parse(userParam);
        } catch {
          // Legacy query-string callback compatibility.
          try {
            parsedUser = JSON.parse(
              decodeURIComponent(userParam),
            );
          } catch (err) {
            console.warn(
              "[GoogleCallback] Could not parse user param:",
              err,
            );
          }
        }
      }

      setTokens(
        token,
        refreshToken || "",
        parsedUser,
      );

      console.log(
        "✅ Google OAuth persistent session stored.",
      );

      if (consumeGoogleRegistrationPending()) {
        trackRegistrationCompleted({
          registration_method: "google",
        });
      }

      setMessage(
        "Google sign-in successful. Redirecting...",
      );

      const redirectTo =
        localStorage.getItem(
          "openshare.postLoginRedirect",
        ) ||
        sessionStorage.getItem(
          "openshare.pendingInviteRedirect",
        ) ||
        "/home";

      try {
        localStorage.removeItem(
          "openshare.postLoginRedirect",
        );

        sessionStorage.removeItem(
          "openshare.pendingInviteRedirect",
        );
      } catch {}

      // Full reload lets AuthContext initialize from the newly
      // stored access + persistent refresh session.
      setTimeout(() => {
        window.location.replace(redirectTo);
      }, 350);
    } catch (err) {
      clearGoogleRegistrationPending();

      console.error(
        "[GoogleCallback] Error processing callback:",
        err,
      );

      setMessage(
        "Google sign-in failed. Redirecting...",
      );

      setTimeout(
        () =>
          navigate(
            "/login?error=google_callback_failed",
            { replace: true },
          ),
        900,
      );
    }
  }, [searchParams, navigate]);

  return (
    <main className="min-h-screen grid place-items-center bg-slate-50 px-6">
      <div className="rounded-3xl border border-slate-200 bg-white px-8 py-7 shadow-xl text-center max-w-md">
        <div className="mx-auto mb-4 h-12 w-12 rounded-2xl bg-violet-100 flex items-center justify-center text-violet-700 font-bold">
          G
        </div>

        <h1 className="text-xl font-bold text-slate-900">
          Google Sign-In
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          {message}
        </p>
      </div>
    </main>
  );
}
