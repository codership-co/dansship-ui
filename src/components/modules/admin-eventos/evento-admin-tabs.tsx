import { useTranslation } from 'react-i18next';
import { Link, useSearchParams } from 'react-router';

import { EntryWindowEditor } from './entry-window-editor';
import { EventoEditForm } from './evento-edit-form';
import { ParticipantTypesPanel } from './participant-types-panel';
import { ParticipationPeopleTable } from './participation-people-table';
import { ParticipationSummaryPanel } from './participation-summary';

import { SectionHeading } from '@components/containers';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@components/ui';
import { useOrPermissions } from '@contexts';
import { PageURLS } from '@core/constants';
import { PERMISSION } from '@core/permissions';

import type { EventAdmin } from '@core/api';

export const EVENT_ADMIN_TABS = ['info', 'types', 'summary', 'people'] as const;
export type EventAdminTab = (typeof EVENT_ADMIN_TABS)[number];

function asTab(value: string | null): EventAdminTab {
  return EVENT_ADMIN_TABS.includes(value as EventAdminTab) ? (value as EventAdminTab) : 'info';
}

/**
 * Admin of an event with participant types (ADR-064). Panels stay mounted (forceMount) so
 * unsaved edits survive a tab switch. "Información" is the existing form,
 * unchanged; the other tabs are the participant-type editor, the summary and every person.
 */
export function EventoAdminTabs({ event }: { event: EventAdmin }) {
  const { t } = useTranslation();
  const [params, setParams] = useSearchParams();
  const tab = asTab(params.get('tab'));
  const canValidate = useOrPermissions([PERMISSION.EVENT_ENTRY_VALIDATE]);

  const changeTab = (value: string) =>
    setParams(
      current => {
        const next = new URLSearchParams(current);
        next.set('tab', value);

        return next;
      },
      { replace: true },
    );

  return (
    <Tabs value={tab} onValueChange={changeTab} className='gap-6'>
      {tab === 'info' ? null : (
        <div className='grid gap-1'>
          <Link className='text-sm font-semibold text-primary' to={PageURLS.admin.eventos} viewTransition>
            {t('eventos:admin.backToList')}
          </Link>
          <SectionHeading className='mb-0' title={event.name} />
          {canValidate ? (
            <Link
              className='text-sm font-semibold text-primary'
              to={PageURLS.admin.entryDoorEvent(event.id)}
              viewTransition
            >
              {t('eventos:door.fromEvent')}
            </Link>
          ) : null}
        </div>
      )}
      <TabsList variant='line' className='w-full justify-start overflow-x-auto'>
        {EVENT_ADMIN_TABS.map(item => (
          <TabsTrigger key={item} value={item} className='flex-none'>
            {t(`eventos:participation.tabs.${item}`)}
          </TabsTrigger>
        ))}
      </TabsList>
      <TabsContent value='info' forceMount className='data-[state=inactive]:hidden'>
        <EventoEditForm event={event} />
      </TabsContent>
      <TabsContent value='types' forceMount className='data-[state=inactive]:hidden'>
        <div className='grid gap-6'>
          <ParticipantTypesPanel eventId={event.id} eventSlug={event.slug} eventCapacity={event.capacity} />
          {tab === 'types' ? <EntryWindowEditor eventId={event.id} /> : null}
        </div>
      </TabsContent>
      <TabsContent value='summary' forceMount className='data-[state=inactive]:hidden'>
        <ParticipationSummaryPanel eventId={event.id} />
      </TabsContent>
      <TabsContent value='people' forceMount className='data-[state=inactive]:hidden'>
        <ParticipationPeopleTable eventId={event.id} eventSlug={event.slug} />
      </TabsContent>
    </Tabs>
  );
}
