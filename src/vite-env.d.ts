/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DANSSHIP_API_URL: string;

  readonly VITE_ARE_USER_PAGES_ENABLED: string;
  readonly VITE_USER_PAGES: string;
  readonly VITE_ARE_AUTH_PAGES_ENABLED: string;
  readonly VITE_AUTH_PAGES: string;
  readonly VITE_ARE_ADMIN_PAGES_ENABLED: string;
  readonly VITE_ADMIN_PAGES: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
