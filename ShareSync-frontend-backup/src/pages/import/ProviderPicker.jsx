// src/components/import/ProviderPicker.jsx
import React from "react";
import { KanbanSquare, GitFork } from "lucide-react";

export default function ProviderPicker({ value, onChange }) {
  const providers = [
    {
      key: "linear",
      name: "Linear",
      desc: "Import issues from Linear into projects & tasks.",
      Icon: KanbanSquare,
    },
    {
      key: "jira",
      name: "Jira",
      desc: "Import issues from Jira (cloud) into projects & tasks.",
      Icon: GitFork,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {providers.map((p) => {
        const active = value === p.key;
        const Icon = p.Icon;
        return (
          <button
            key={p.key}
            type="button"
            onClick={() => onChange?.(p.key)}
            className={[
              "rounded-2xl border px-4 py-3 text-left hover:bg-surface transition",
              active ? "border-indigo-500 ring-2 ring-indigo-200" : "border-border",
            ].join(" ")}
            aria-pressed={active ? "true" : "false"}
          >
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-xl ${active ? "bg-indigo-50" : "bg-surface"}`}>
                <Icon className="w-5 h-5 text-indigo-600" />
              </div>
              <div className="flex-1">
                <div className="font-semibold">{p.name}</div>
                <div className="text-sm text-muted mt-0.5">{p.desc}</div>
              </div>
              <div
                className={[
                  "w-4 h-4 rounded-full border mt-1",
                  active ? "bg-indigo-600 border-indigo-600" : "border-border",
                ].join(" ")}
                aria-hidden="true"
              />
            </div>
          </button>
        );
      })}
    </div>
  );
}
