import React, { Suspense } from 'react';
import EditFieldClient from './EditFieldClient';

export default async function EditFieldPage({
  params,
}: {
  params: Promise<{ farmId: string }>;
}) {
  const { farmId } = await params;
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm opacity-60">Loading field editor...</div>}>
      <EditFieldClient farmId={farmId} />
    </Suspense>
  );
}
