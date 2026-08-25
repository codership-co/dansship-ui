import { useEffect, useRef } from 'react';

const GIS_SCRIPT_SRC = 'https://accounts.google.com/gsi/client';
const GIS_SCRIPT_ID = 'google-identity-services';

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

interface GoogleSignInButtonProps {
  onCredential: (credential: string) => void | Promise<void>;
  text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
  disabled?: boolean;
  className?: string;
}

export function GoogleSignInButton({
  onCredential,
  text = 'continue_with',
  disabled = false,
  className,
}: GoogleSignInButtonProps) {
  const buttonRef = useRef<HTMLDivElement>(null);
  const callbackRef = useRef(onCredential);
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

  useEffect(() => {
    if (!clientId || !buttonRef.current) {
      return;
    }

    let cancelled = false;

    void loadGisScript()
      .then(() => {
        if (cancelled || !buttonRef.current || !window.google?.accounts?.id) {
          return;
        }

        if (gisInitializedClientId !== clientId) {
          ensureGisInitialized(clientId);
        }

        buttonRef.current.innerHTML = '';
        window.google.accounts.id.renderButton(buttonRef.current, {
          theme: 'outline',
          size: 'large',
          text,
          shape: 'rectangular',
          width: 320,
          locale: 'es',
        });
      })
      .catch(() => {
        // Button simply stays empty if GIS fails to load.
      });

    return () => {
      cancelled = true;
    };
  }, [clientId, text]);

  if (!clientId) {
    return null;
  }

  return (
    <div
      className={className}
      aria-disabled={disabled || undefined}
      style={disabled ? { pointerEvents: 'none', opacity: 0.6 } : undefined}
    >
      <div ref={buttonRef} className='flex justify-center min-h-10' />
    </div>
  );
}

/** True when the GIS Web client ID is present in the Vite env. */
export function isGoogleSignInConfigured(): boolean {
  return Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim());
}
