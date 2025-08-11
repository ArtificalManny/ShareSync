import React from 'react';

export default function ProjectSkeleton() {
  return (
    <div className="rounded-2xl bg-white dark:bg-slate-800 p-4 overflow-hidden">
      <div className="animate-pulse">
        <div className="h-4 w-1/3 bg-slate-200 dark:bg-slate-700 rounded mb-3" />
        <div className="h-3 w-2/3 bg-slate-200 dark:bg-slate-700 rounded mb-2" />
        <div className="h-3 w-1/2 bg-slate-200 dark:bg-slate-700 rounded" />
        <div className="mt-4 flex gap-2">
          <div className="h-7 w-7 rounded-full bg-slate-200 dark:bg-slate-700" />
          <div className="h-7 w-7 rounded-full bg-slate-200 dark:bg-slate-700" />
          <div className="h-7 w-7 rounded-full bg-slate-200 dark:bg-slate-700" />
        </div>
      </div>
    </div>
  );
}
