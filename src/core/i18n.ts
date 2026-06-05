import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpBackend from 'i18next-http-backend';
import { initReactI18next } from 'react-i18next';

import { languageCodes } from '@core/constants';

i18n
  .use(HttpBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: languageCodes[0],
    debug: false,
    load: 'languageOnly',
    supportedLngs: languageCodes,
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
      'errors',
      'figure',
      'figureTypes',
      'home',
      'instructor',
      'inventory',
      'merch',
      'nav',
      'notifications',
      'payments',
      'profile',
      'rbac',
      'reports',
      'savedFigures',
      'schedules',
      'studioRental',
      'subscriptions',
      'training',
      'validation',
    ],
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
