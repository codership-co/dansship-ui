import { useEffect, useRef } from 'react';

import { subscribePageLifecycle, type PageLifecyclePriority, type PageResumeReason } from '@core/page-lifecycle';

export interface PageResumeEvent {
  reason: PageResumeReason;
  hiddenForMs: number;
}

interface UsePageResumeOptions {
  minHiddenMs?: number;
  priority?: PageLifecyclePriority;
}

export function usePageResume(callback: (event: PageResumeEvent) => void, options?: UsePageResumeOptions) {
  const callbackRef = useRef(callback);
  const minHiddenMs = options?.minHiddenMs ?? 0;
  const priority = options?.priority ?? 'data';

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    return subscribePageLifecycle(event => {
      if (event.type !== 'resume' || event.hiddenForMs < minHiddenMs) {
        return;
      }

      callbackRef.current({ reason: event.reason, hiddenForMs: event.hiddenForMs });
    }, priority);
  }, [minHiddenMs, priority]);
}
