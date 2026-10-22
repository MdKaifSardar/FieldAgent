import React, { Suspense } from 'react';
import { ConsoleLayout } from '@/components/layout/ConsoleLayout';

export default function AppConsoleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<div className="h-screen w-screen flex items-center justify-center bg-[#F6F8F5] dark:bg-[#06131D]" />}>
      <ConsoleLayout>
        <Suspense fallback={<div className="p-8 text-center text-sm opacity-60">Loading workspace...</div>}>
          {children}
        </Suspense>
      </ConsoleLayout>
    </Suspense>
  );
}
