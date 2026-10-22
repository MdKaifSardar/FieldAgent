import React from 'react';
import { ConsoleLayout } from '@/components/layout/ConsoleLayout';

export default function AppConsoleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ConsoleLayout>{children}</ConsoleLayout>;
}
