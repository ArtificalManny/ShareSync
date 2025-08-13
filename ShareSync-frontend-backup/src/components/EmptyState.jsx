export default function EmptyState({ icon = '📭', title, body, action }) {
    return (
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-6 text-center bg-white dark:bg-slate-900">
        <div className="text-3xl mb-2">{icon}</div>
        <h3 className="text-ink-900 font-semibold">{title}</h3>
        {body && <p className="text-ink-600 mt-1">{body}</p>}
        {action && <div className="mt-4">{action}</div>}
      </div>
    );
  }
  