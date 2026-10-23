import React, { Suspense } from 'react';
import EditFieldClient from './EditFieldClient';

async function EditFieldContent({ params }: { params: Promise<{ farmId: string }> }) {
  const { farmId } = await params;
  return <EditFieldClient farmId={farmId} />;
}

export default function EditFieldPage({
  params,
}: {
  params: Promise<{ farmId: string }>;
}) {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm opacity-60">Loading field editor...</div>}>
      <EditFieldContent params={params} />
    </Suspense>
  );
}
