import { useEffect } from 'react';
import { useLocation } from 'react-router';

let lastTrackedPath = '';

export function useMetaPixelPageView() {
  const { pathname, search } = useLocation();
  const path = `${pathname}${search}`;

  useEffect(() => {
    if (lastTrackedPath === path) {
      return;
    }

    const isFirstView = lastTrackedPath === '';

    lastTrackedPath = path;

    // The snippet in index.html already sends the first PageView.
    if (isFirstView) {
      return;
    }

    window.fbq?.('track', 'PageView');
  }, [path]);
}
