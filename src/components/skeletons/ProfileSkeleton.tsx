import React from 'react';

export function ProfileSkeleton() {
  return (
    <div className="space-y-6 animate-pulse max-w-6xl mx-auto">
      {/* Identity Banner Shimmer */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-200 dark:bg-slate-700" />
            <div className="space-y-2">
              <div className="w-48 h-6 rounded-lg bg-slate-200 dark:bg-slate-700" />
              <div className="w-32 h-4 rounded-md bg-slate-200 dark:bg-slate-700" />
            </div>
          </div>
          <div className="flex gap-3">
            <div className="w-28 h-10 rounded-xl bg-slate-200 dark:bg-slate-700" />
            <div className="w-32 h-10 rounded-xl bg-slate-200 dark:bg-slate-700" />
          </div>
        </div>
      </div>

      {/* KPI Cards 4-grid Shimmer */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="p-5 rounded-2xl bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-3"
          >
            <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-700" />
            <div className="w-20 h-4 rounded bg-slate-200 dark:bg-slate-700" />
            <div className="w-28 h-7 rounded-lg bg-slate-200 dark:bg-slate-700" />
          </div>
        ))}
      </div>

      {/* Quick Access Card Grid Shimmer */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="h-56 rounded-3xl bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800" />
        <div className="h-56 rounded-3xl bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800" />
      </div>
    </div>
  );
}
