import React, { Suspense } from 'react';
import FieldAdvisoryClient from './FieldAdvisoryClient';

export default async function FieldAdvisoryPage({
  params,
}: {
  params: Promise<{ farmId: string }>;
}) {
  const { farmId } = await params;
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm opacity-60">Loading field advisory cockpit...</div>}>
      <FieldAdvisoryClient farmId={farmId} />
    </Suspense>
  );
}
