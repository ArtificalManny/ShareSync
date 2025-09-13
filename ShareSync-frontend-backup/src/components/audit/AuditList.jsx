/**
 * DEPRECATED: The standalone AuditList has been replaced by the unified feed.
 * System/audit events now appear in ProjectActivityFeed under the "System" filter.
 *
 * Keeping this file to avoid breaking imports; it renders nothing.
 * If you still need a visual hand-off, switch your imports to the unified feed.
 */
export default function AuditList() {
  return null;
}

// Optional: if someone intentionally mounts this, you can export a helper
// to show a small notice instead of null:
//
// export function DeprecatedAuditNotice() {
//   return (
//     <div className="rounded-xl border border-slate-200/70 dark:border-slate-700 p-4 bg-amber-50/70 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200">
//       <div className="text-sm font-medium">Audit list moved</div>
//       <div className="text-xs">
//         System & audit events now live in the unified activity feed (use the “System” filter).
//       </div>
//     </div>
//   );
// }
