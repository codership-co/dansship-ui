import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { cn } from '@helpers';

const GIS_SCRIPT_SRC = 'https://accounts.google.com/gsi/client';
const GIS_SCRIPT_ID = 'google-identity-services';
/** Google large icon button is ~40px; used as scale baseline before measure. */
const GIS_ICON_SIZE_PX = 40;

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
            use_fedcm_for_prompt?: boolean;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              type?: 'standard' | 'icon';
              theme?: 'outline' | 'filled_blue' | 'filled_black';
              size?: 'large' | 'medium' | 'small';
              text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
              shape?: 'rectangular' | 'pill' | 'circle' | 'square';
              width?: number;
              locale?: string;
            },
          ) => void;
          prompt?: () => void;
        };
      };
    };
  }
}

let gisInitializedClientId: string | null = null;
let gisCredentialHandler: ((credential: string) => void) | null = null;

function loadGisScript(): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.resolve();
  }

  if (window.google?.accounts?.id) {
    return Promise.resolve();
  }

  const existing = document.getElementById(GIS_SCRIPT_ID) as HTMLScriptElement | null;

  if (existing) {
    return new Promise((resolve, reject) => {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('GIS_SCRIPT_LOAD_FAILED')), {
        once: true,
      });
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.id = GIS_SCRIPT_ID;
    script.src = GIS_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('GIS_SCRIPT_LOAD_FAILED'));
    document.head.appendChild(script);
  });
}

function ensureGisInitialized(clientId: string): void {
  if (!window.google?.accounts?.id) {
    return;
  }

  gisInitializedClientId = clientId;
  window.google.accounts.id.initialize({
    client_id: clientId,
    callback: response => {
      gisCredentialHandler?.(response.credential);
    },
    auto_select: false,
    cancel_on_tap_outside: true,
  });
}

function GoogleMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox='0 0 24 24' aria-hidden='true'>
      <path
        fill='#4285F4'
        d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z'
      />
      <path
        fill='#34A853'
        d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z'
      />
      <path
        fill='#FBBC05'
        d='M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z'
      />
      <path
        fill='#EA4335'
        d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z'
      />
    </svg>
  );
}

const TEXT_I18N_KEY = {
  signin_with: 'auth:google.signInWith',
  signup_with: 'auth:google.signUpWith',
  continue_with: 'auth:google.continueWith',
  signin: 'auth:google.signInWith',
} as const;

interface GoogleSignInButtonProps {
  onCredential: (credential: string) => void | Promise<void>;
  text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
  disabled?: boolean;
  className?: string;
}

function measureGisHitSize(host: HTMLElement): { width: number; height: number } {
  const iframe = host.querySelector('iframe');

  if (iframe) {
    const rect = iframe.getBoundingClientRect();

    if (rect.width > 0 && rect.height > 0) {
      return { width: rect.width, height: rect.height };
    }
  }

  const roleButton = host.querySelector('[role="button"]') as HTMLElement | null;

  if (roleButton) {
    const rect = roleButton.getBoundingClientRect();

    if (rect.width > 0 && rect.height > 0) {
      return { width: rect.width, height: rect.height };
    }
  }

  return { width: GIS_ICON_SIZE_PX, height: GIS_ICON_SIZE_PX };
}

export function GoogleSignInButton({
  onCredential,
  text = 'continue_with',
  disabled = false,
  className,
}: GoogleSignInButtonProps) {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLDivElement>(null);
  const callbackRef = useRef(onCredential);
  const [containerSize, setContainerSize] = useState({ width: 320, height: 40 });
  const [gisSize, setGisSize] = useState({ width: GIS_ICON_SIZE_PX, height: GIS_ICON_SIZE_PX });
  const [gisReady, setGisReady] = useState(false);
  callbackRef.current = onCredential;

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim() ?? '';

  useEffect(() => {
    const handler = (credential: string) => {
      void callbackRef.current(credential);
    };

    gisCredentialHandler = handler;

    return () => {
      if (gisCredentialHandler === handler) {
        gisCredentialHandler = null;
      }
    };
  }, []);

  useLayoutEffect(() => {
    const node = containerRef.current;

    if (!node) {
      return;
    }

    const updateSize = () => {
      const rect = node.getBoundingClientRect();
      setContainerSize({
        width: Math.max(Math.floor(rect.width), 200),
        height: Math.max(Math.floor(rect.height), 40),
      });
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(node);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!clientId || !buttonRef.current) {
      return;
    }

    let cancelled = false;
    let cleanupWatchers: (() => void) | undefined;
    setGisReady(false);

    void loadGisScript()
      .then(() => {
        if (cancelled || !buttonRef.current || !window.google?.accounts?.id) {
          return;
        }

        if (gisInitializedClientId !== clientId) {
          ensureGisInitialized(clientId);
        }

        const host = buttonRef.current;
        host.innerHTML = '';
        // Icon button is a compact square hit target we scale to the full custom control.
        window.google.accounts.id.renderButton(host, {
          type: 'icon',
          theme: 'outline',
          size: 'large',
          shape: 'square',
          locale: 'es',
        });

        const applyMeasure = () => {
          if (cancelled) {
            return;
          }

          setGisSize(measureGisHitSize(host));
          setGisReady(true);
        };

        // GIS injects iframe/button asynchronously; retry briefly until sized.
        applyMeasure();
        const observer = new MutationObserver(applyMeasure);
        observer.observe(host, { childList: true, subtree: true });
        const retryId = window.setTimeout(applyMeasure, 250);
        const stopId = window.setTimeout(() => observer.disconnect(), 2000);

        const stopWatching = () => {
          observer.disconnect();
          window.clearTimeout(retryId);
          window.clearTimeout(stopId);
        };

        if (cancelled) {
          stopWatching();

          return;
        }

        cleanupWatchers = stopWatching;
      })
      .catch(() => {
        // Button simply stays empty if GIS fails to load.
      });

    return () => {
      cancelled = true;
      cleanupWatchers?.();
    };
  }, [clientId]);

  if (!clientId) {
    return null;
  }

  const scaleX = containerSize.width / gisSize.width;
  const scaleY = containerSize.height / gisSize.height;

  return (
    <div
      ref={containerRef}
      className={cn('relative h-10 w-full overflow-hidden rounded-md', className)}
      aria-disabled={disabled || undefined}
      style={disabled ? { pointerEvents: 'none', opacity: 0.6 } : undefined}
    >
      <div
        aria-hidden
        className='pointer-events-none absolute inset-0 z-0 flex items-center justify-center gap-2 rounded-md border border-primary/15 bg-gray-200/80 px-3 text-sm font-medium text-primary'
      >
        <GoogleMark className='size-5 shrink-0' />
        <span>{t(TEXT_I18N_KEY[text])}</span>
      </div>
      {/*
        Invisible GIS icon scaled to the full control. Stretching the iframe with CSS
        left a tiny inner hit area on mobile; transform scale maps the real control 1:1.
      */}
      <div
        ref={buttonRef}
        aria-hidden={!gisReady}
        className='absolute top-0 left-0 z-10 origin-top-left'
        style={{
          opacity: 0.02,
          transform: `scale(${scaleX}, ${scaleY})`,
          // Keep layout size at the unscaled GIS icon so scale math stays stable.
          width: gisSize.width,
          height: gisSize.height,
        }}
      />
    </div>
  );
}

/** True when the GIS Web client ID is present in the Vite env. */
export function isGoogleSignInConfigured(): boolean {
  return Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim());
}
