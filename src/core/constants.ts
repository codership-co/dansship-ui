export const languages = [
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
] as const;

export const languageCodes = languages.map(l => l.code);
export type LanguageCode = (typeof languageCodes)[number];
