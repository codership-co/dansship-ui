import { useTranslation } from 'react-i18next';

export const FiguresHeader = () => {
  const { t } = useTranslation();

  return (
    <header className='mb-6 space-y-2'>
      <h1 className='font-headline text-4xl font-bold tracking-tight text-primary'>
        {t('browse:catalog.mobileTitle')}
      </h1>
      <p className='max-w-2xl text-base text-muted-foreground'>{t('browse:catalog.mobileSubtitle')}</p>
    </header>
  );
};
