import { Button } from 'polpo/components';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LuInfo, LuPlus } from 'react-icons/lu';
import { toast } from 'sonner';

import { ParticipantTypeEditor, REGISTRATION_OPTION_EDITORS } from './participant-type-editor';

import { SpinnerLoader } from '@components/loaders';
import { ConfirmDialog } from '@components/modals';
import { Badge } from '@components/ui';
import {
  DansshipAPI,
  isDraftType,
  participationErrorMessage,
  type ParticipantTypeAdmin,
  type PriceConditionCatalogItem,
} from '@core/api';
import { cn } from '@helpers';
import { useParticipantTypes, usePromise } from '@hooks';

const EMPTY_CONDITIONS: Array<PriceConditionCatalogItem> = [];

interface ParticipantTypesPanelProps {
  eventId: string;
  eventCapacity: number;
  isPrivate: boolean;
  /** Saved types can be deleted only while the event is a draft (and nobody signed up). */
  isDraftEvent: boolean;
}

/**
 * "Tipos de participante": the event's types on the left, the one generic editor on the right.
 * "+ Agregar tipo de participante" only adds a draft here ("Sin guardar"); "Guardar tipo" creates it.
 * An event without types starts with a draft «General».
 */
export function ParticipantTypesPanel({ eventId, eventCapacity, isPrivate, isDraftEvent }: ParticipantTypesPanelProps) {
  const { t } = useTranslation();
  const { types, isLoading, savedCount, addDraft, removeDraft, deleteType, saveType } = useParticipantTypes(eventId);
  const { response: conditionsResponse } = usePromise(() => DansshipAPI.eventosAdmin.listPriceConditions());
  const conditions = useMemo(
    () =>
      conditionsResponse?.ok
        ? conditionsResponse.data.filter(item => item.offered_in_editor !== false)
        : EMPTY_CONDITIONS,
    [conditionsResponse],
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<ParticipantTypeAdmin | null>(null);
  // Bumped on every save so the editor remounts with the saved type (it never resets itself).
  const [revision, setRevision] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const startedWithGeneral = useRef(false);

  useEffect(() => {
    if (savedCount !== 0 || startedWithGeneral.current) return;

    startedWithGeneral.current = true;
    addDraft(t('eventos:participation.editor.generalName'));
  }, [addDraft, savedCount, t]);

  if (isLoading) {
    return <SpinnerLoader />;
  }

  const selected = types.find(item => item.id === selectedId) ?? types[0] ?? null;
  const hasDrafts = types.some(isDraftType);

  const add = () => {
    const draft = addDraft(t('eventos:participation.editor.newTypeName'));

    setSelectedId(draft.id);
  };

  const discard = (typeId: string) => {
    removeDraft(typeId);
    setSelectedId(null);
  };

  const canDelete = (item: ParticipantTypeAdmin) =>
    isDraftEvent && !isDraftType(item) && item.signup_count === 0 && item.people_count === 0;

  const confirmDelete = async () => {
    if (!deleting) return;

    setIsDeleting(true);
    try {
      const result = await deleteType(deleting.id);

      if (!result.ok) {
        toast.error(participationErrorMessage(result.error, t, 'eventos:participation.editor.deleteFailed'));

        return;
      }

      toast.success(t('eventos:participation.editor.deleted'));
      setSelectedId(null);
      setDeleting(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const summary = (item: ParticipantTypeAdmin) =>
    [
      item.registration_options
        .map(option => option.label || t(REGISTRATION_OPTION_EDITORS[option.kind]?.labelKey ?? ''))
        .join(' / '),
      item.requires_approval ? t('eventos:participation.editor.approvalShort') : null,
      t(`eventos:participation.contributionModels.${item.contribution_model}`),
    ]
      .filter(Boolean)
      .join(' · ');

  const countLabel = (item: ParticipantTypeAdmin) =>
    item.registration_options.some(option => REGISTRATION_OPTION_EDITORS[option.kind]?.asksTicketPeople)
      ? t('eventos:participation.editor.ticketsCount', { count: item.people_count })
      : t('eventos:participation.editor.signupsCount', { count: item.signup_count });

  return (
    <div className='grid gap-4'>
      {hasDrafts ? (
        <p className='m-0 flex items-start gap-2 rounded-xl bg-secondary px-3.5 py-3 text-sm font-medium'>
          <LuInfo className='mt-0.5 size-4 flex-none' aria-hidden />
          {t('eventos:participation.editor.unsavedNotice')}
        </p>
      ) : null}
      <div className='grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)] lg:items-start lg:gap-x-8'>
        <aside className='grid min-w-0 gap-2'>
          {types.map(item => (
            <button
              key={item.id}
              type='button'
              onClick={() => setSelectedId(item.id)}
              aria-pressed={selected?.id === item.id}
              className={cn(
                'grid w-full gap-1 rounded-xl border bg-white px-3.5 py-3 text-left text-foreground focus-visible:outline-2 focus-visible:outline-primary',
                selected?.id === item.id ? 'border-primary bg-primary/5' : 'border-border',
              )}
            >
              <span className='flex items-center justify-between gap-2'>
                <span className='font-semibold'>{item.name}</span>
                {isDraftType(item) ? (
                  <Badge variant='outline' size='small' className='text-muted-foreground'>
                    {t('eventos:participation.editor.unsaved')}
                  </Badge>
                ) : !item.is_active ? (
                  <Badge variant='outline' size='small' className='text-muted-foreground'>
                    {t('eventos:participation.editor.inactive')}
                  </Badge>
                ) : (
                  <small className='text-muted-foreground'>{countLabel(item)}</small>
                )}
              </span>
              <span className='text-sm text-muted-foreground'>{summary(item)}</span>
            </button>
          ))}
          <Button type='button' variant='outlined' color='primary' fullWidth onClick={add}>
            <LuPlus className='size-4' aria-hidden />
            {t('eventos:participation.editor.addType')}
          </Button>
          <p className='m-0 text-xs text-muted-foreground'>{t('eventos:participation.editor.typesHint')}</p>
        </aside>
        {selected ? (
          <ParticipantTypeEditor
            key={`${selected.id}:${revision}`}
            type={selected}
            conditions={conditions}
            eventCapacity={eventCapacity}
            isPrivate={isPrivate}
            isNew={isDraftType(selected)}
            onDiscard={isDraftType(selected) ? () => discard(selected.id) : undefined}
            onDelete={canDelete(selected) ? () => setDeleting(selected) : undefined}
            onSave={async payload => {
              const result = await saveType(selected.id, payload);

              if (result.ok) {
                setSelectedId(result.data.id);
                setRevision(current => current + 1);

                return { ok: true, data: result.data };
              }

              return { ok: false, error: result.error };
            }}
          />
        ) : (
          <p className='rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground'>
            {t('eventos:participation.editor.empty')}
          </p>
        )}
      </div>
      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={open => {
          if (!open && !isDeleting) setDeleting(null);
        }}
        onConfirm={confirmDelete}
        isLoading={isDeleting}
        title={t('eventos:participation.editor.deleteTitle', { name: deleting?.name ?? '' })}
        description={t('eventos:participation.editor.deleteDescription')}
        confirmLabel={t('eventos:participation.editor.deleteType')}
        cancelLabel={t('eventos:participation.cancel')}
        confirmVariant='destructive'
      />
    </div>
  );
}
