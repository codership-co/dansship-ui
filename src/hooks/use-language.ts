import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { useAuth } from '@contexts';
import { DansshipAPI } from '@core/api';
import { defaultLanguage, type LanguageCode, languages } from '@core/constants';

export const useLanguage = () => {
  const { i18n } = useTranslation();
  const { isAuthenticated } = useAuth();

  const changeLanguage = useCallback(
    (code: LanguageCode) => {
      i18n.changeLanguage(code);

      if (isAuthenticated) {
        void DansshipAPI.auth.updatePreferredLanguage({ preferred_language: code });
      }
    },
    [i18n, isAuthenticated],
  );

  const currentLanguage = useMemo(() => {
    const i18nLanguage = languages.find(lang => lang.code === i18n.language);
    const navigatorLanguage = languages.find(lang => lang.code === (navigator.language.split('-')[0] as LanguageCode));

    const finalLanguage = i18nLanguage || navigatorLanguage || defaultLanguage;

    if (finalLanguage.code !== i18n.language) {
      changeLanguage(finalLanguage.code);
    }

    return finalLanguage;
  }, [changeLanguage, i18n.language]);

  return {
    currentLanguage,
    changeLanguage,
    languages,
  };
};
