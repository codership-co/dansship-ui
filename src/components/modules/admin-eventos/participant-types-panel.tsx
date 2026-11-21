import { Button } from 'polpo/components';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LuPlus } from 'react-icons/lu';
import { toast } from 'sonner';

import { ParticipantTypeEditor } from './participant-type-editor';

import { SpinnerLoader } from '@components/loaders';
import { Badge } from '@components/ui';
import {
  DansshipAPI,
  participationErrorMessage,
  type ParticipantTypeAdmin,
  type ParticipantTypePreset,
} from '@core/api';
import { cn } from '@helpers';
import { usePromise } from '@hooks';

const SELECT_CLASS = 'h-10 w-full rounded-md border border-input bg-background px-3 text-sm';

interface ParticipantTypesPanelProps {
  eventId: string;
  eventSlug: string;
  eventCapacity: number;
}

/** "Tipos de participante": the event's types on the left, the generic editor on the right. */
export function ParticipantTypesPanel({ eventId, eventSlug, eventCapacity }: ParticipantTypesPanelProps) {
  const { t } = useTranslation();
  const { response, isLoading, reFetch } = usePromise(() => DansshipAPI.participationAdmin.listTypes(eventId), true, [
    eventId,
  ]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [preset, setPreset] = useState<ParticipantTypePreset | ''>('artists');
  const [creating, setCreating] = useState(false);
  const [overrides, setOverrides] = useState<Record<string, ParticipantTypeAdmin>>({});

  if (isLoading && !response) {
    return <SpinnerLoader />;
  }

  const types = (response?.data ?? []).map(item => overrides[item.id] ?? item);
  const selected = types.find(item => item.id === selectedId) ?? types[0] ?? null;

  const create = async () => {
    setCreating(true);
    try {
      const { ok, data, error } = await DansshipAPI.participationAdmin.createType(eventId, preset || null);

      if (!ok || !data) {
        toast.error(participationErrorMessage(error, t, 'eventos:participation.editor.createFailed'));

        return;
      }

      await reFetch();
      setSelectedId(data.id);
    } finally {
      setCreating(false);
    }
  };

  const summary = (item: ParticipantTypeAdmin) =>
    [
      t(`eventos:participation.accessModes.${item.access_mode}`),
      item.requires_approval ? t('eventos:participation.editor.approvalShort') : null,
      t(`eventos:participation.contributionModels.${item.contribution_model}`),
    ]
      .filter(Boolean)
      .join(' · ');

  return (
    <div className='grid gap-4 lg:grid-cols-[17rem_minmax(0,1fr)] lg:items-start'>
      <aside className='grid min-w-0 gap-2'>
        {types.map(item => (
          <button
            key={item.id}
            type='button'
            onClick={() => setSelectedId(item.id)}
            className={cn(
              'grid w-full gap-1 rounded-xl border bg-white px-3.5 py-3 text-left focus-visible:outline-2 focus-visible:outline-primary',
              selected?.id === item.id ? 'border-primary bg-primary/5' : 'border-border',
            )}
          >
            <span className='flex items-baseline justify-between gap-2'>
              <span className='font-semibold'>{item.name}</span>
              <small className='text-muted-foreground'>
                {item.registration_mode === 'multi_ticket'
                  ? t('eventos:participation.editor.ticketsCount', { count: item.people_count })
                  : t('eventos:participation.editor.signupsCount', { count: item.signup_count })}
              </small>
            </span>
            <span className='text-xs text-muted-foreground'>{summary(item)}</span>
            {!item.is_active ? (
              <Badge variant='outlineNeutral' size='small' className='w-fit'>
                {t('eventos:participation.editor.inactive')}
              </Badge>
            ) : null}
          </button>
        ))}
        <div className='grid gap-2 rounded-xl border border-dashed border-border p-3'>
          <select
            aria-label={t('eventos:participation.editor.preset')}
            className={SELECT_CLASS}
            value={preset}
            onChange={change => setPreset(change.target.value as ParticipantTypePreset | '')}
          >
            <option value='artists'>{t('eventos:participation.presets.artists')}</option>
            <option value='guests'>{t('eventos:participation.presets.guests')}</option>
            <option value=''>{t('eventos:participation.presets.blank')}</option>
          </select>
          <Button type='button' variant='outlined' color='primary' disabled={creating} onClick={() => void create()}>
            <LuPlus className='size-4' aria-hidden />
            {t('eventos:participation.editor.addType')}
          </Button>
        </div>
        <p className='m-0 text-xs text-muted-foreground'>{t('eventos:participation.editor.typesHint')}</p>
      </aside>
      {selected ? (
        <ParticipantTypeEditor
          key={selected.id}
          eventId={eventId}
          eventSlug={eventSlug}
          eventCapacity={eventCapacity}
          type={selected}
          onSaved={saved => setOverrides(current => ({ ...current, [saved.id]: saved }))}
        />
      ) : (
        <p className='rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground'>
          {t('eventos:participation.editor.empty')}
        </p>
      )}
    </div>
  );
}
