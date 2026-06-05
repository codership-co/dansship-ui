import { useTranslation } from 'react-i18next';

import { languages } from '@core/constants';

export function LanguageFlag() {
  const { i18n } = useTranslation();
  const currentLanguage = languages.find(lang => lang.code === i18n.language);

  return (
    <span className='text-xl' role='img' aria-label={currentLanguage?.name}>
      {currentLanguage?.flag}
    </span>
  );
}
