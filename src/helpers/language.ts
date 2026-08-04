export const SUPPORTED_PREFERRED_LANGUAGES = ['en', 'es'] as const;

export type PreferredLanguage = (typeof SUPPORTED_PREFERRED_LANGUAGES)[number];

export const DEFAULT_PREFERRED_LANGUAGE: PreferredLanguage = 'es';

/** Keep en/es; anything else (e.g. browser `fr`) falls back to Spanish. */
export function normalizePreferredLanguage(language?: string | null): PreferredLanguage {
  const code = (language ?? DEFAULT_PREFERRED_LANGUAGE).trim().toLowerCase().split(/[-_]/)[0] ?? '';

  if (SUPPORTED_PREFERRED_LANGUAGES.includes(code as PreferredLanguage)) {
    return code as PreferredLanguage;
  }

  return DEFAULT_PREFERRED_LANGUAGE;
}

export function resolveBrowserPreferredLanguage(explicit?: string | null): PreferredLanguage {
  return normalizePreferredLanguage(explicit || navigator.language);
}
