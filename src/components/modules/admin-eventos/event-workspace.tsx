import { Button } from 'polpo/components';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LuEye } from 'react-icons/lu';
import { Link, useSearchParams } from 'react-router';
import { toast } from 'sonner';

import { InfoTooltip } from './editor-field';
import { ADMIN_FIELDS, ADMIN_TAB, ADMIN_TABS_LIST } from './event-admin-styles';
import { EventInfoForm } from './event-info-form';
import { ParticipantTypesPanel } from './participant-types-panel';
import { ParticipationPeopleTable } from './participation-people-table';
import { ParticipationSummaryPanel } from './participation-summary';

import { Badge, Switch, Tabs, TabsContent, TabsList, TabsTrigger } from '@components/ui';
import { useOrPermissions } from '@contexts';
import { DansshipAPI, participationErrorMessage, type EventAdmin } from '@core/api';
import { PageURLS } from '@core/constants';
import { PERMISSION } from '@core/permissions';
import { cn } from '@helpers';

export const EVENT_ADMIN_TABS = ['info', 'types', 'summary', 'people'] as const;
export type EventAdminTab = (typeof EVENT_ADMIN_TABS)[number];

/** While creating, only Información and Tipos de participante exist. */
const CREATE_TABS: ReadonlyArray<EventAdminTab> = ['info', 'types'];

function asTab(value: string | null, tabs: ReadonlyArray<EventAdminTab>): EventAdminTab {
  return tabs.includes(value as EventAdminTab) ? (value as EventAdminTab) : 'info';
}

/**
 * One page for every event configured by participant types: Información, Tipos de participante,
 * Resumen and Inscritos. Panels stay mounted (forceMount) so unsaved edits survive a tab switch.
 */
export function EventWorkspace({ event: initialEvent }: { event?: EventAdmin }) {
  const { t } = useTranslation();
  const [params, setParams] = useSearchParams();
  const [event, setEvent] = useState(initialEvent);
  const [publishing, setPublishing] = useState(false);
  const tabs = event ? EVENT_ADMIN_TABS : CREATE_TABS;
  const tab = asTab(params.get('tab'), tabs);
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

  const setPublished = async (published: boolean) => {
    if (!event) return;

    setPublishing(true);
    try {
      const { ok, data, error } = await DansshipAPI.eventosAdmin.updateEvent(event.id, {
        status: published ? 'published' : 'draft',
      });

      if (!ok || !data) {
        toast.error(participationErrorMessage(error, t, 'eventos:admin.saveFailed'));

        return;
      }

      setEvent(data);
      toast.success(published ? t('eventos:info.publishedToast') : t('eventos:info.draftToast'));
    } finally {
      setPublishing(false);
    }
  };

  const published = event?.status === 'published';
  const statusText = published ? t('eventos:admin.published') : t('eventos:admin.draft');

  return (
    <Tabs value={tab} onValueChange={changeTab} className={cn('gap-5', ADMIN_FIELDS)}>
      <div className='flex flex-wrap items-start justify-between gap-3'>
        <div className='grid min-w-0 gap-1'>
          <Link className='w-fit text-sm font-semibold text-primary' to={PageURLS.admin.eventos} viewTransition>
            {t('eventos:admin.backToList')}
          </Link>
          <div className='flex flex-wrap items-center gap-2.5'>
            <h2 className='m-0 text-primary'>{event?.name ?? t('eventos:info.newEvent')}</h2>
            <Badge variant={published ? 'default' : 'outline'}>{statusText}</Badge>
          </div>
          <p className='m-0 text-sm text-muted-foreground'>
            {event?.type_label ?? (published ? null : t('eventos:info.unpublished'))}
          </p>
        </div>
        <div className='flex flex-wrap items-center gap-2.5'>
          <label className='flex items-center gap-2 rounded-full border border-border bg-white px-3 py-1.5 text-sm font-semibold'>
            {statusText}
            <Switch
              aria-label={t('eventos:admin.published')}
              checked={published}
              disabled={!event || publishing}
              onCheckedChange={value => void setPublished(value)}
            />
          </label>
          {event ? (
            event.starts_at ? (
              <Link to={PageURLS.eventoPreview(event.slug)} target='_blank' rel='noreferrer'>
                <Button type='button' variant='outlined' color='primary' title={t('eventos:previewMode.buttonHint')}>
                  <LuEye className='size-4' aria-hidden />
                  {t('eventos:previewMode.button')}
                </Button>
              </Link>
            ) : (
              <span className='flex items-center gap-1'>
                <Button type='button' variant='outlined' color='primary' disabled>
                  <LuEye className='size-4' aria-hidden />
                  {t('eventos:previewMode.button')}
                </Button>
                <InfoTooltip content={t('eventos:previewMode.needsDates')} />
              </span>
            )
          ) : null}
          {event && canValidate ? (
            <Link to={PageURLS.admin.entryDoorEvent(event.id)} viewTransition>
              <Button type='button' variant='outlined' color='primary'>
                {t('eventos:door.fromEvent')}
              </Button>
            </Link>
          ) : null}
        </div>
      </div>
      <TabsList className={ADMIN_TABS_LIST}>
        {tabs.map(item => (
          <TabsTrigger key={item} value={item} className={ADMIN_TAB}>
            {t(`eventos:participation.tabs.${item}`)}
          </TabsTrigger>
        ))}
      </TabsList>
      <TabsContent value='info' forceMount className='data-[state=inactive]:hidden'>
        <EventInfoForm event={event} onSaved={setEvent} />
      </TabsContent>
      <TabsContent value='types' forceMount className='data-[state=inactive]:hidden'>
        {event ? (
          <ParticipantTypesPanel
            eventId={event.id}
            eventCapacity={event.capacity}
            isPrivate={event.visibility === 'invite_only'}
            isDraftEvent={event.status === 'draft'}
          />
        ) : (
          <p className='rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground'>
            {t('eventos:info.typesAfterSave')}
          </p>
        )}
      </TabsContent>
      {event ? (
        <>
          <TabsContent value='summary' forceMount className='data-[state=inactive]:hidden'>
            <ParticipationSummaryPanel eventId={event.id} />
          </TabsContent>
          <TabsContent value='people' forceMount className='data-[state=inactive]:hidden'>
            <ParticipationPeopleTable
              eventId={event.id}
              eventSlug={event.slug}
              eventName={event.name}
              eventStartsAt={event.starts_at}
            />
          </TabsContent>
        </>
      ) : null}
    </Tabs>
  );
}
