import { describe, expect, it, vi } from 'vitest';

import { guardViewTransitions } from './view-transition';

describe('guardViewTransitions', () => {
  it('handles a rejected ready promise and leaves finished alone', async () => {
    const ready = Promise.reject(
      new DOMException('Transition was aborted because of invalid state. Document hidden', 'InvalidStateError'),
    );
    const finished = Promise.reject(new Error('update failed'));
    const host = {
      startViewTransition: vi.fn((_update?: () => void) => ({
        ready,
        finished,
        updateCallbackDone: Promise.resolve(),
      })),
    };

    guardViewTransitions(host);

    const transition = host.startViewTransition(() => undefined);

    await expect(transition.ready).rejects.toThrow(/Document hidden/);
    await expect(transition.finished).rejects.toThrow('update failed');
  });

  it('wraps the document method only once', () => {
    const start = vi.fn((_update?: () => void) => ({
      ready: Promise.resolve(),
      finished: Promise.resolve(),
      updateCallbackDone: Promise.resolve(),
    }));
    const host = { startViewTransition: start };

    guardViewTransitions(host);
    const wrapped = host.startViewTransition;

    guardViewTransitions(host);
    host.startViewTransition(() => undefined);

    expect(host.startViewTransition).toBe(wrapped);
    expect(start).toHaveBeenCalledTimes(1);
  });

  it('does nothing when the browser has no view transitions', () => {
    expect(() => guardViewTransitions({})).not.toThrow();
  });
});
