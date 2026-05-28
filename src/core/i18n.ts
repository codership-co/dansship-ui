import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpBackend from 'i18next-http-backend';
import { initReactI18next } from 'react-i18next';

i18n
  .use(HttpBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'es',
    debug: false,
    load: 'languageOnly',
    supportedLngs: ['es', 'en'],
    ns: [
      'actions',
      'alerts',
      'auth',
      'buttons',
      'calendar',
      'charts',
      'common',
      'dashboard',
      'dates',
      'dialogs',
      'errors',
      'filters',
      'forms',
      'home',
      'inputs',
      'labels',
      'loading',
      'menu',
      'messages',
      'modals',
      'navigation',
      'notifications',
      'pagination',
      'profile',
      'search',
      'settings',
      'tables',
      'tooltips',
      'validation',
    ],
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
