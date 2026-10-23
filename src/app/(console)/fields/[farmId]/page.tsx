import React, { Suspense } from 'react';
import FieldAdvisoryClient from './FieldAdvisoryClient';

async function FieldAdvisoryContent({ params }: { params: Promise<{ farmId: string }> }) {
  const { farmId } = await params;
  return <FieldAdvisoryClient farmId={farmId} />;
}

export default function FieldAdvisoryPage({
  params,
}: {
  params: Promise<{ farmId: string }>;
}) {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm opacity-60">Loading field advisory cockpit...</div>}>
      <FieldAdvisoryContent params={params} />
    </Suspense>
  );
}
