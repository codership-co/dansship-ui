import { useEffect } from 'react';
import { useLocation } from 'react-router';

export function useScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const id = hash.replace('#', '');

      const scrollToHashTarget = () => {
        const target = document.getElementById(id);

        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });

          return true;
        }

        return false;
      };

      // Try immediately, then once in the next frame to handle delayed renders.
      if (!scrollToHashTarget()) {
        requestAnimationFrame(() => {
          scrollToHashTarget();
        });
      }

      return;
    }

    const scrollToTop = () => {
      window.scrollTo(0, 0);
    };

    /*
     * Instant jump (smooth + view transitions often never reach top: 0).
     * Re-run after paint so React transitions cannot restore the previous offset.
     */
    scrollToTop();
    const frame = requestAnimationFrame(scrollToTop);

    return () => cancelAnimationFrame(frame);
  }, [pathname, hash]);
}
