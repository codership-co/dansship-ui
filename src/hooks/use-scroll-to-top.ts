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

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }, [pathname, hash]);
}
