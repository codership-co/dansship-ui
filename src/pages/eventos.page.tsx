import { useTranslation } from 'react-i18next';

import { Section, SectionHeading } from '@components/containers';
import { SpinnerLoader } from '@components/loaders';
import { EventoCard } from '@components/modules/eventos';
import { ListPagination } from '@components/navigation';
import { FEATURE_FLAG, SecurityGuard } from '@contexts';
import { DansshipAPI } from '@core/api';
import { usePagedList } from '@hooks';

function EventosPage() {
  const { t } = useTranslation();
  const catalog = usePagedList(params => DansshipAPI.eventos.listCatalogPage(params));

  return (
    <Section navbarPadding>
      <SectionHeading title={t('eventos:list.title')} subtitle={t('eventos:list.subtitle')} />
      {catalog.isLoading ? (
        <SpinnerLoader />
      ) : catalog.items.length === 0 ? (
        <p className='text-muted-foreground'>{t('eventos:list.empty')}</p>
      ) : (
        <div className='mt-8 grid gap-6'>
          <div className='grid gap-6 sm:grid-cols-2 xl:grid-cols-3'>
            {catalog.items.map(card => (
              <EventoCard key={`${card.kind}-${card.id}`} card={card} />
            ))}
          </div>
          <ListPagination
            page={catalog.page}
            pageSize={catalog.pageSize}
            total={catalog.total}
            onPageChange={catalog.setPage}
          />
        </div>
      )}
    </Section>
  );
}

export const SecureEventosPage = SecurityGuard(EventosPage, {
  featureFlags: [FEATURE_FLAG.areUserPagesEnabled, FEATURE_FLAG.isTalleresPageEnabled],
});
