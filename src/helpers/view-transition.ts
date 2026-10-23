interface GuardedViewTransition {
  ready: Promise<unknown>;
}

type StartViewTransition = (callbackOptions: UpdateCallback) => GuardedViewTransition;

type UpdateCallback = () => void | Promise<void>;

interface ViewTransitionHost {
  startViewTransition?: StartViewTransition;
}

const guardedStarts = new WeakSet<StartViewTransition>();

/**
 * React Router starts a view transition and never handles `ready`.
 * Chrome rejects that promise when the document is hidden, which surfaces as an unhandled rejection.
 * `finished` is left alone: it rejects when the navigation callback itself fails.
 */
export function guardViewTransitions(target: ViewTransitionHost = document): void {
  const current = target.startViewTransition;

  if (typeof current !== 'function' || guardedStarts.has(current)) {
    return;
  }

  const wrapped: StartViewTransition = callbackOptions => {
    const transition = current.call(target, callbackOptions);

    void transition.ready.catch(() => undefined);

    return transition;
  };

  guardedStarts.add(wrapped);
  target.startViewTransition = wrapped;
}
