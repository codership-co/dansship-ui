import { useTranslation } from 'react-i18next';

import { Section, SectionHeading } from '@components/containers';
import { SpinnerLoader } from '@components/loaders';
import { TallerCard } from '@components/modules/talleres';
import { FEATURE_FLAG, SecurityGuard } from '@contexts';
import { DansshipAPI } from '@core/api';
import { usePromise } from '@hooks';

function TalleresPage() {
  const { t } = useTranslation();
  const { response, isLoading } = usePromise(() => DansshipAPI.talleres.listCatalog());
  const cards = response?.data ?? [];

  return (
    <Section navbarPadding>
      <SectionHeading title={t('talleres:list.title')} subtitle={t('talleres:list.subtitle')} />
      {isLoading || response === null ? (
        <SpinnerLoader />
      ) : cards.length === 0 ? (
        <p className='text-muted-foreground'>{t('talleres:list.empty')}</p>
      ) : (
        <div className='mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-3'>
          {cards.map(card => (
            <TallerCard key={`${card.kind}-${card.id}`} card={card} />
          ))}
        </div>
      )}
    </Section>
  );
}

export const SecureTalleresPage = SecurityGuard(TalleresPage, {
  featureFlags: [FEATURE_FLAG.areUserPagesEnabled, FEATURE_FLAG.isTalleresPageEnabled],
});
