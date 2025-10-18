// src/components/admin/AdminFilters.jsx
import React from "react";
import { Search } from "lucide-react";

/**
 * Shared tiny filter bar
 * Props:
 *  - value: string      (search query)
 *  - onChange: fn(str)  (called when search changes)
 *  - placeholder?: string
 *  - children?: ReactNode (drop in <select> filters to the right)
 */
export default function AdminFilters({ value, onChange, placeholder = "Search…", children }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-3">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative">
          <Search className="w-4 h-4 text-muted absolute left-2 top-1/2 -translate-y-1/2" />
          <input
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            placeholder={placeholder}
            className="pl-7 pr-3 py-1.5 rounded-lg border border-border bg-surface text-sm w-[220px]"
          />
        </div>

        {/* Right-side slot for extra selects */}
        <div className="flex items-center gap-2">{children}</div>
      </div>
    </div>
  );
}
