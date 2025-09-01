// /src/components/global/PinnedTaskPanel.jsx
import React, { useState } from "react";
import { ChevronLeft, ChevronRight, ExternalLink, PinOff } from "lucide-react";
import { Link } from "react-router-dom";
import { usePinned } from "../../context/PinnedContext";

export default function PinnedTaskPanel() {
  const { items, unpin } = usePinned();
  const [open, setOpen] = useState(false);

  return (
    <aside
      className={`
        fixed top-20 left-0 h-[calc(100%-5rem)] z-40
        transform transition-transform duration-300 ease-in-out
        ${open ? "translate-x-0" : "-translate-x-[260px]"}
      `}
    >
      {/* Toggle button */}
      <button
        onClick={() => setOpen(!open)}
        className={`
          absolute top-4 -right-5 z-50
          h-10 w-5 flex items-center justify-center
          rounded-r-lg shadow
          bg-indigo-600 text-white hover:bg-indigo-700
        `}
        aria-label={open ? "Collapse pinned panel" : "Expand pinned panel"}
      >
        {open ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      </button>

      {/* Panel body */}
      <div
        className="
          w-64 h-full
          border-r border-slate-200 dark:border-slate-800
          bg-white/90 dark:bg-slate-900/85
          shadow-md backdrop-blur supports-[backdrop-filter]:backdrop-blur-sm
          flex flex-col
        "
      >
        <div className="px-3 py-2 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Pinned
          </h2>
          <span className="text-[11px] text-slate-500">{items.length}</span>
        </div>

        {items.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-xs text-slate-500">
            No pinned items
          </div>
        ) : (
          <ul className="flex-1 overflow-y-auto divide-y divide-slate-200 dark:divide-slate-800">
            {items.map((item) => (
              <li
                key={item.id}
                className="px-3 py-2 flex items-center justify-between text-sm"
              >
                <div className="min-w-0 flex-1">
                  {item.href ? (
                    <Link
                      to={item.href}
                      className="truncate text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                    >
                      {item.title}
                      <ExternalLink className="h-3 w-3 shrink-0" />
                    </Link>
                  ) : (
                    <span className="truncate text-slate-800 dark:text-slate-200">
                      {item.title}
                    </span>
                  )}
                  <div className="text-[11px] text-slate-500">
                    {item.kind === "task" ? "Task" : item.kind}
                  </div>
                </div>
                <button
                  onClick={() => unpin(item.id)}
                  className="ml-2 p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
                  title="Unpin"
                >
                  <PinOff className="h-4 w-4 text-slate-500" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}
