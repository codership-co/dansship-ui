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

i18n
  .use(HttpBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: defaultLanguage.code,
    debug: false,
    load: 'languageOnly',
    supportedLngs: languageCodes,
    nonExplicitSupportedLngs: true,
    defaultNS: ['common', 'nav', 'home'],
    ns: [...INITIAL_NAMESPACES],
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
    interpolation: {
      escapeValue: false,
    },
  })
  .then(() => {
    const remaining = ALL_NAMESPACES.filter(
      ns => !INITIAL_NAMESPACES.includes(ns as (typeof INITIAL_NAMESPACES)[number]),
    );
    const loadRest = () => {
      void i18n.loadNamespaces([...remaining]);
    };

    if (typeof requestIdleCallback === 'function') {
      requestIdleCallback(loadRest, { timeout: 2500 });
    } else {
      window.setTimeout(loadRest, 1500);
    }
  });

export default i18n;
