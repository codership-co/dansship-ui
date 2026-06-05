import { useTranslation } from 'react-i18next';

import { DansshipAPI } from '@core/api';
import { type LanguageCode, languages } from '@core/constants';

const AUTH_SESSION_KEY = 'auth_session';

const isAuthenticatedSession = () => localStorage.getItem(AUTH_SESSION_KEY) === '1';

export const useLanguage = () => {
  const { i18n } = useTranslation();

  const changeLanguage = (code: LanguageCode) => {
    i18n.changeLanguage(code);
    localStorage.setItem('preferredLanguage', code);

    if (!isAuthenticatedSession()) {
      return;
    }

    void DansshipAPI.auth.updatePreferredLanguage({ preferred_language: code });
  };

  const currentLanguage = languages.find(lang => lang.code === i18n.language);

  return {
    currentLanguage,
    changeLanguage,
    languages,
  };
};
