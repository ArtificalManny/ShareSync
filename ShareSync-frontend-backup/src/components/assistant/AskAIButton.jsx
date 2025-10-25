import React from "react";
import { Sparkles } from "lucide-react";
import { useAssistant } from "../../context/AssistantContext.jsx";
import "../../styles/assistant.css";
import { track } from "../../utils/telemetry";

export default function AskAIButton({
  scope = "project",
  projectId = null,
  items = [],
  prompt = "",
  label = "Ask AI",
  variant = "chip", // 'chip' | 'button' | 'icon'
  className = "",
}) {
  const { openDock } = useAssistant();

  const onClick = () => {
    try { track("askai_button_clicked", { scope, projectId, variant }); } catch {}
    openDock({
      scope,
      projectId,
      items,
      draft:
        prompt ||
        (scope === "project"
          ? "Summarize this project. Then propose 3 next steps."
          : "Summarize this list. Then propose 3 next steps."),
    });
  };

  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`askai-icon ${className}`}
        aria-label="Ask AI"
        title="Ask AI"
      >
        <Sparkles className="w-4 h-4" />
      </button>
    );
  }

  if (variant === "button") {
    return (
      <button type="button" onClick={onClick} className={`askai-button ${className}`}>
        <Sparkles className="w-4 h-4" />
        <span>{label}</span>
      </button>
    );
  }

  // default: chip
  return (
    <button type="button" onClick={onClick} className={`askai-chip ${className}`}>
      <Sparkles className="w-3.5 h-3.5" />
      <span>{label}</span>
    </button>
  );
}
