import i18n, { type Resource } from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';

import { defaultLanguage, languageCodes } from '@core/constants';

const localeModules = import.meta.glob('../locales/*/*.json', {
  eager: true,
  import: 'default',
}) as Record<string, Resource[string][string]>;

const resources: Resource = {};
const namespaces = new Set<string>();

for (const [path, bundle] of Object.entries(localeModules)) {
  const match = /\/locales\/([^/]+)\/([^/]+)\.json$/.exec(path);

  if (!match) {
    continue;
  }

  const [, language, namespace] = match;
  resources[language] ??= {};
  resources[language][namespace] = bundle;
  namespaces.add(namespace);
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: defaultLanguage.code,
    debug: false,
    initAsync: false,
    load: 'languageOnly',
    supportedLngs: languageCodes,
    nonExplicitSupportedLngs: true,
    defaultNS: 'common',
    ns: [...namespaces],
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n;
