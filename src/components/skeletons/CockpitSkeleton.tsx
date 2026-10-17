import React from 'react';

export function CockpitSkeleton() {
  return (
    <div className="space-y-6 animate-pulse max-w-7xl mx-auto">
      {/* Field Active Status Strip Shimmer */}
      <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-700" />
          <div className="space-y-1.5">
            <div className="w-40 h-5 rounded bg-slate-200 dark:bg-slate-700" />
            <div className="w-24 h-3 rounded bg-slate-200 dark:bg-slate-700" />
          </div>
        </div>
        <div className="flex gap-2">
          <div className="w-24 h-8 rounded-lg bg-slate-200 dark:bg-slate-700" />
          <div className="w-28 h-8 rounded-lg bg-slate-200 dark:bg-slate-700" />
        </div>
      </div>

      {/* Main Decision Hero Shimmer */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="w-32 h-6 rounded-full bg-slate-200 dark:bg-slate-700" />
        <div className="w-3/4 h-8 rounded-xl bg-slate-200 dark:bg-slate-700" />
        <div className="w-1/2 h-4 rounded-md bg-slate-200 dark:bg-slate-700" />
        <div className="pt-4 flex gap-4">
          <div className="w-36 h-12 rounded-2xl bg-slate-200 dark:bg-slate-700" />
          <div className="w-36 h-12 rounded-2xl bg-slate-200 dark:bg-slate-700" />
        </div>
      </div>

      {/* Weather & Water Budget 2-column Grid Shimmer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 h-80 rounded-3xl bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800" />
        <div className="lg:col-span-5 h-80 rounded-3xl bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800" />
      </div>
    </div>
  );
}
