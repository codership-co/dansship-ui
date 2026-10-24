import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  resetPageLifecycleForTests,
  resumeAbortCutoff,
  startPageLifecycle,
  subscribePageLifecycle,
} from './page-lifecycle';

vi.mock('./sentry', () => ({
  addSentryBreadcrumb: vi.fn(),
}));

function setVisibility(state: DocumentVisibilityState) {
  Object.defineProperty(document, 'visibilityState', {
    configurable: true,
    get: () => state,
  });
}

describe('page lifecycle', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    setVisibility('visible');
    startPageLifecycle();
  });

  afterEach(() => {
    resetPageLifecycleForTests();
    vi.useRealTimers();
  });

  it('collapses return events into one resume and keeps the hidden duration', () => {
    const resumes: Array<{ reason: string; hiddenForMs: number }> = [];
    const stop = subscribePageLifecycle(event => {
      if (event.type === 'resume') {
        resumes.push({ reason: event.reason, hiddenForMs: event.hiddenForMs });
      }
    }, 'data');

    vi.setSystemTime(1_000);
    setVisibility('hidden');
    document.dispatchEvent(new Event('visibilitychange'));
    vi.setSystemTime(1_800);
    setVisibility('visible');
    document.dispatchEvent(new Event('visibilitychange'));
    window.dispatchEvent(new Event('pageshow'));
    window.dispatchEvent(new Event('online'));
    vi.advanceTimersByTime(400);

    expect(resumes).toEqual([{ reason: 'visibility', hiddenForMs: 800 }]);
    stop();
  });

  it('aborts only requests that started before the page was hidden', () => {
    expect(resumeAbortCutoff({ hiddenForMs: 800, visibleAt: 1_800 })).toBe(1_000);
    expect(resumeAbortCutoff({ hiddenForMs: 0, visibleAt: 1_800 })).toBeNull();
  });

  it('starts once', () => {
    startPageLifecycle();
    const resumes: Array<string> = [];
    const stop = subscribePageLifecycle(event => {
      if (event.type === 'resume') {
        resumes.push(event.reason);
      }
    });

    window.dispatchEvent(new Event('online'));
    vi.advanceTimersByTime(400);

    expect(resumes).toEqual(['online']);
    stop();
  });

  it('emits suspend for freeze and pagehide', () => {
    const reasons: Array<string> = [];
    const stop = subscribePageLifecycle(event => {
      if (event.type === 'suspend') {
        reasons.push(event.reason);
      }
    });

    document.dispatchEvent(new Event('freeze'));
    window.dispatchEvent(new Event('pagehide'));

    expect(reasons).toEqual(['freeze', 'pagehide']);
    stop();
  });
});
