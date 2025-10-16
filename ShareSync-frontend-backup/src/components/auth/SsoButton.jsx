import React from "react";
import { SSO_ENABLED, SSO_PROVIDER_NAME, SSO_DOCS_URL, SSO_START_URL } from "../../config/flags";
import { track } from "../../utils/telemetry";
import { toast } from "../ui/Toaster.jsx"; // you already use this elsewhere

export default function SsoButton({ className = "" }) {
  const onClick = () => {
    track?.("sso_button_clicked", { enabled: SSO_ENABLED });
    if (!SSO_ENABLED) {
      toast?.({
        title: "SSO not configured",
        description: `Ask your admin to enable ${SSO_PROVIDER_NAME}. See docs →`,
        action: {
          label: "Open docs",
          onClick: () => window.open(SSO_DOCS_URL, "_blank", "noopener,noreferrer"),
        },
      });
      track?.("sso_not_configured_shown", { provider: SSO_PROVIDER_NAME });
      return;
    }
    // If enabled, kick off the real flow
    try {
      track?.("sso_start_redirected", { provider: SSO_PROVIDER_NAME });
    } finally {
      window.location.assign(SSO_START_URL);
    }
  };

  return (
    <button
      type="button"
      className={`btn btn--outline w-full ${className}`}
      onClick={onClick}
      title={`Sign in with ${SSO_PROVIDER_NAME}`}
    >
      Sign in with {SSO_PROVIDER_NAME}
    </button>
  );
}
