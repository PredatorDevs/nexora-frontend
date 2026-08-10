import { lazy, Suspense } from 'react';
import { LoadingState } from '@/components/feedback/LoadingState.jsx';

export function lazyRoute(importer, exportName) {
  const Component = lazy(async () => {
    const module = await importer();
    return { default: module[exportName] };
  });

  return (
    <Suspense fallback={<LoadingState />}>
      <Component />
    </Suspense>
  );
}
