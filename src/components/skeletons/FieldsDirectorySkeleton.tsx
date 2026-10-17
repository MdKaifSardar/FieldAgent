import React from 'react';

export function FieldsDirectorySkeleton() {
  return (
    <div className="space-y-6 animate-pulse max-w-7xl mx-auto">
      {/* Search & Action Bar Shimmer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
        <div className="w-full sm:w-72 h-10 rounded-xl bg-slate-200 dark:bg-slate-700" />
        <div className="flex gap-2">
          <div className="w-24 h-10 rounded-xl bg-slate-200 dark:bg-slate-700" />
          <div className="w-36 h-10 rounded-xl bg-slate-200 dark:bg-slate-700" />
        </div>
      </div>

      {/* Field Cards Grid Shimmer */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="p-5 rounded-3xl bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-4"
          >
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-200 dark:bg-slate-700" />
                <div className="space-y-1.5">
                  <div className="w-28 h-5 rounded bg-slate-200 dark:bg-slate-700" />
                  <div className="w-20 h-3 rounded bg-slate-200 dark:bg-slate-700" />
                </div>
              </div>
              <div className="w-16 h-6 rounded-full bg-slate-200 dark:bg-slate-700" />
            </div>

            <div className="space-y-2 pt-2">
              <div className="flex justify-between">
                <div className="w-24 h-3 rounded bg-slate-200 dark:bg-slate-700" />
                <div className="w-16 h-3 rounded bg-slate-200 dark:bg-slate-700" />
              </div>
              <div className="w-full h-2 rounded bg-slate-200 dark:bg-slate-700" />
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800/80 flex justify-between items-center">
              <div className="w-24 h-4 rounded bg-slate-200 dark:bg-slate-700" />
              <div className="w-28 h-9 rounded-xl bg-slate-200 dark:bg-slate-700" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
