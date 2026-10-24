import { addSentryBreadcrumb } from './sentry';

export type PageSuspendReason = 'pagehide' | 'freeze';

export type PageResumeReason = 'visibility' | 'pageshow' | 'resume' | 'online';

export type PageLifecyclePriority = 'session' | 'data';

export type PageLifecycleEvent =
  | { type: 'suspend'; reason: PageSuspendReason }
  | { type: 'resume'; reason: PageResumeReason; hiddenForMs: number; visibleAt: number };

export function resumeAbortCutoff(event: { hiddenForMs: number; visibleAt: number }): number | null {
  if (event.hiddenForMs <= 0) {
    return null;
  }

  return event.visibleAt - event.hiddenForMs;
}

type Listener = (event: PageLifecycleEvent) => void;

interface Subscription {
  listener: Listener;
  priority: PageLifecyclePriority;
}

const RESUME_DEBOUNCE_MS = 400;

const subscriptions = new Set<Subscription>();
const cleanups: Array<() => void> = [];

let started = false;
let hiddenAt: number | null = null;
let resumeTimer: ReturnType<typeof setTimeout> | null = null;
let pendingReason: PageResumeReason | null = null;

function wasDiscarded(): boolean {
  if (!('wasDiscarded' in document)) {
    return false;
  }

  return Boolean((document as Document & { wasDiscarded?: boolean }).wasDiscarded);
}

function emit(event: PageLifecycleEvent) {
  const ordered = [...subscriptions].sort((left, right) => {
    if (left.priority === right.priority) {
      return 0;
    }

    return left.priority === 'session' ? -1 : 1;
  });

  if (event.type === 'resume') {
    addSentryBreadcrumb('page.lifecycle', 'Page resumed', {
      reason: event.reason,
      hiddenForMs: event.hiddenForMs,
      wasDiscarded: wasDiscarded(),
      online: typeof navigator === 'undefined' ? undefined : navigator.onLine,
    });
  } else {
    addSentryBreadcrumb('page.lifecycle', 'Page suspended', {
      reason: event.reason,
      wasDiscarded: wasDiscarded(),
      online: typeof navigator === 'undefined' ? undefined : navigator.onLine,
    });
  }

  ordered.forEach(subscription => {
    subscription.listener(event);
  });
}

function noteHidden() {
  if (hiddenAt === null) {
    hiddenAt = Date.now();
  }

  if (resumeTimer !== null) {
    clearTimeout(resumeTimer);
    resumeTimer = null;
    pendingReason = null;
  }
}

function scheduleResume(reason: PageResumeReason) {
  if (pendingReason === null) {
    pendingReason = reason;
  }

  if (resumeTimer !== null) {
    return;
  }

  const visibleAt = Date.now();
  const hiddenForMs = hiddenAt === null ? 0 : visibleAt - hiddenAt;

  hiddenAt = null;
  resumeTimer = setTimeout(() => {
    const reasonToEmit = pendingReason ?? reason;

    resumeTimer = null;
    pendingReason = null;
    emit({ type: 'resume', reason: reasonToEmit, hiddenForMs, visibleAt });
  }, RESUME_DEBOUNCE_MS);
}

function onVisibility() {
  if (document.visibilityState === 'hidden') {
    noteHidden();

    return;
  }

  scheduleResume('visibility');
}

function onPageHide() {
  noteHidden();
  emit({ type: 'suspend', reason: 'pagehide' });
}

function onFreeze() {
  noteHidden();
  emit({ type: 'suspend', reason: 'freeze' });
}

function listen(target: Window | Document, type: string, listener: () => void) {
  target.addEventListener(type, listener);
  cleanups.push(() => target.removeEventListener(type, listener));
}

export function startPageLifecycle() {
  if (started || typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }

  started = true;
  listen(document, 'visibilitychange', onVisibility);
  listen(window, 'pageshow', () => scheduleResume('pageshow'));
  listen(window, 'pagehide', onPageHide);
  listen(document, 'freeze', onFreeze);
  listen(document, 'resume', () => scheduleResume('resume'));
  listen(window, 'online', () => scheduleResume('online'));
}

export function subscribePageLifecycle(listener: Listener, priority: PageLifecyclePriority = 'data') {
  const subscription = { listener, priority };

  subscriptions.add(subscription);

  return () => {
    subscriptions.delete(subscription);
  };
}

export function resetPageLifecycleForTests() {
  if (resumeTimer !== null) {
    clearTimeout(resumeTimer);
  }

  cleanups.splice(0).forEach(cleanup => cleanup());
  subscriptions.clear();
  started = false;
  hiddenAt = null;
  resumeTimer = null;
  pendingReason = null;
}
