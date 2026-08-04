import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpBackend from 'i18next-http-backend';
import { initReactI18next } from 'react-i18next';

import { defaultLanguage, languageCodes } from '@core/constants';

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
    // Unsupported browser languages (e.g. fr) fall back to Spanish.
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
    ns: [
      'admin',
      'auth',
      'billing',
      'bookings',
      'browse',
      'classes',
      'combo',
      'common',
      'completedFigures',
      'difficulty',
      'error404',
      'errors',
      'figure',
      'figureTypes',
      'home',
      'instructor',
      'inventory',
      'legal',
      'merch',
      'nav',
      'notifications',
      'payments',
      'profile',
      'reports',
      'savedFigures',
      'schedules',
      'studioRental',
      'subscriptions',
      'training',
      'unauthorized',
      'unavailable',
      'validation',
    ],
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
