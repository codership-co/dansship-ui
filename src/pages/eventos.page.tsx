import { useTranslation } from 'react-i18next';

import { Section, SectionHeading } from '@components/containers';
import { SpinnerLoader } from '@components/loaders';
import { EventoCard } from '@components/modules/eventos';
import { FEATURE_FLAG, SecurityGuard } from '@contexts';
import { DansshipAPI } from '@core/api';
import { usePromise } from '@hooks';

function EventosPage() {
  const { t } = useTranslation();
  const { response, isLoading } = usePromise(() => DansshipAPI.eventos.listCatalog());
  const cards = response?.data ?? [];

  return (
    <Section navbarPadding>
      <SectionHeading title={t('eventos:list.title')} subtitle={t('eventos:list.subtitle')} />
      {isLoading || response === null ? (
        <SpinnerLoader />
      ) : cards.length === 0 ? (
        <p className='text-muted-foreground'>{t('eventos:list.empty')}</p>
      ) : (
        <div className='mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-3'>
          {cards.map(card => (
            <EventoCard key={`${card.kind}-${card.id}`} card={card} />
          ))}
        </div>
      )}
    </Section>
  );
}

export const SecureEventosPage = SecurityGuard(EventosPage, {
  featureFlags: [FEATURE_FLAG.areUserPagesEnabled, FEATURE_FLAG.isTalleresPageEnabled],
});
