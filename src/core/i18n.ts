import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpBackend from 'i18next-http-backend';
import { initReactI18next } from 'react-i18next';

import { defaultLanguage, languageCodes } from '@core/constants';

const INITIAL_NAMESPACES = [
  'common',
  'nav',
  'home',
  'auth',
  'classes',
  'subscriptions',
  'bookings',
  'validation',
  'errors',
  'error404',
  'unauthorized',
  'unavailable',
] as const;

const ALL_NAMESPACES = [
  ...INITIAL_NAMESPACES,
  'admin',
  'billing',
  'browse',
  'campaigns',
  'combo',
  'completedFigures',
  'difficulty',
  'figure',
  'figureTypes',
  'gifts',
  'instructor',
  'inventory',
  'legal',
  'merch',
  'notifications',
  'payments',
  'profile',
  'reports',
  'savedFigures',
  'schedules',
  'studioRental',
  'training',
] as const;

const knownNamespaces = new Set<string>(ALL_NAMESPACES);
const loadingNamespaces = new Set<string>();

function languageCode() {
  return i18n.resolvedLanguage ?? i18n.language ?? defaultLanguage.code;
}

export function ensureI18nNamespace(namespace: string | undefined | null) {
  if (!namespace || !knownNamespaces.has(namespace)) {
    return;
  }

  if (i18n.hasResourceBundle(languageCode(), namespace) || loadingNamespaces.has(namespace)) {
    return;
  }

  loadingNamespaces.add(namespace);
  void i18n.loadNamespaces(namespace).finally(() => {
    loadingNamespaces.delete(namespace);
  });
}

function namespaceFromKey(key: unknown): string | null {
  if (typeof key === 'string') {
    const separatorIndex = key.indexOf(':');

    if (separatorIndex > 0) {
      return key.slice(0, separatorIndex);
    }

    return null;
  }

  if (Array.isArray(key)) {
    for (const item of key) {
      const namespace = namespaceFromKey(item);

      if (namespace) {
        return namespace;
      }
    }
  }

  return null;
}

function ensureNamespaceFromLookup(key: unknown, options: unknown) {
  const fromKey = namespaceFromKey(key);
  ensureI18nNamespace(fromKey);

  if (!options || typeof options !== 'object' || !('ns' in options)) {
    return;
  }

  const namespace = (options as { ns?: string | Array<string> }).ns;

  if (typeof namespace === 'string') {
    ensureI18nNamespace(namespace);

    return;
  }

  if (Array.isArray(namespace)) {
    namespace.forEach(ensureI18nNamespace);
  }
}

let onDemandNamespacesInstalled = false;

function installOnDemandNamespaces() {
  if (onDemandNamespacesInstalled) {
    return;
  }

  onDemandNamespacesInstalled = true;
  const originalT = i18n.t.bind(i18n);
  const originalGetFixedT = i18n.getFixedT.bind(i18n);

  function onDemandT(key: never, options: never) {
    ensureNamespaceFromLookup(key, options);

    return originalT(key, options);
  }

  i18n.t = onDemandT as typeof i18n.t;
  i18n.getFixedT = ((...args: Parameters<typeof i18n.getFixedT>) => {
    const [, ns] = args;

    if (typeof ns === 'string') {
      ensureI18nNamespace(ns);
    } else if (Array.isArray(ns)) {
      ns.forEach(ensureI18nNamespace);
    }

    const fixedT = originalGetFixedT(...args);

    return ((key: never, options: never) => {
      ensureNamespaceFromLookup(key, options);

      return fixedT(key, options);
    }) as typeof fixedT;
  }) as typeof i18n.getFixedT;
}

i18n.use(HttpBackend).use(LanguageDetector).use(initReactI18next);

installOnDemandNamespaces();

i18n
  .init({
    fallbackLng: defaultLanguage.code,
    debug: false,
    load: 'languageOnly',
    supportedLngs: languageCodes,
    nonExplicitSupportedLngs: true,
    defaultNS: 'common',
    ns: [...INITIAL_NAMESPACES],
    partialBundledLanguages: true,
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
      bindI18n: 'languageChanged loaded',
      bindI18nStore: 'added',
    },
  })
  .then(() => {
    onDemandNamespacesInstalled = false;
    installOnDemandNamespaces();

    const remaining = ALL_NAMESPACES.filter(
      ns => !INITIAL_NAMESPACES.includes(ns as (typeof INITIAL_NAMESPACES)[number]),
    );
    let index = 0;
    const loadNext = () => {
      const namespace = remaining[index];
      index += 1;

      if (!namespace) {
        return;
      }

      ensureI18nNamespace(namespace);

      if (typeof requestIdleCallback === 'function') {
        requestIdleCallback(loadNext, { timeout: 2000 });
      } else {
        window.setTimeout(loadNext, 400);
      }
    };

    if (typeof requestIdleCallback === 'function') {
      requestIdleCallback(loadNext, { timeout: 2500 });
    } else {
      window.setTimeout(loadNext, 1500);
    }
  });

export default i18n;
