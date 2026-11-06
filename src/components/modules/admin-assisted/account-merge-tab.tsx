import { Button } from 'polpo/components';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router';
import { toast } from 'sonner';

import { apiErrorCode } from './assisted-errors';
import { AssistedPanel } from './assisted-panel';
import { PersonPicker } from './person-picker';
import { useSelectedPerson } from './use-selected-person';

import { ConfirmDialog } from '@components/modals';
import { Checkbox, Label, Textarea } from '@components/ui';
import { DansshipAPI, type MergePreview, type PersonSearchResult } from '@core/api';
import { useCallablePromise } from '@hooks';

export function AccountMergeTab() {
  const { t } = useTranslation('assisted');
  const { person: kept, select: selectKept } = useSelectedPerson();
  const [searchParams, setSearchParams] = useSearchParams();
  const duplicateId = searchParams.get('duplicate');
  const [duplicate, setDuplicate] = useState<PersonSearchResult | null>(null);
  const [preview, setPreview] = useState<MergePreview | null>(null);
  const [reason, setReason] = useState('');
  const [irreversible, setIrreversible] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const { call: loadPreview } = useCallablePromise((primary: string, secondary: string) =>
    DansshipAPI.assistedAdmin.previewMerge(primary, secondary),
  );
  const { call: merge, isLoading: isMerging } = useCallablePromise(
    (payload: Parameters<typeof DansshipAPI.assistedAdmin.merge>[0]) => DansshipAPI.assistedAdmin.merge(payload),
  );

  useEffect(() => {
    if (!duplicateId || duplicate?.id === duplicateId) {
      return;
    }

    void DansshipAPI.usersAdmin.getById(duplicateId).then(response => {
      if (response.ok && response.data) {
        setDuplicate({
          id: duplicateId,
          full_name: response.data.full_name ?? response.data.email,
          email: response.data.email,
        });
      }
    });
  }, [duplicateId, duplicate?.id]);

  useEffect(() => {
    setPreview(null);

    if (!kept || !duplicate) {
      return;
    }

    void loadPreview(kept.id, duplicate.id).then(({ ok, data }) => ok && data && setPreview(data));
  }, [kept?.id, duplicate?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const swap = () => {
    const previousKept = kept;

    setDuplicate(previousKept);
    selectKept(duplicate);
  };

  const submit = async () => {
    if (!kept || !duplicate) {
      return;
    }

    const { ok, error } = await merge({
      primary_user_id: kept.id,
      secondary_user_id: duplicate.id,
      reason: reason.trim(),
      irreversible_confirmed: irreversible,
    });

    setIsConfirmOpen(false);

    if (!ok) {
      toast.error(
        t(`errors.${apiErrorCode(error)}`, {
          defaultValue: t('errors.generic'),
        }),
      );

      return;
    }

    toast.success(t('merge.done'));
    setDuplicate(null);
    setPreview(null);
    setReason('');
    setIrreversible(false);
    setSearchParams(
      previous => {
        const params = new URLSearchParams(previous);

        params.delete('duplicate');

        return params;
      },
      { replace: true },
    );
  };

  const isBlocked = (preview?.blocks.length ?? 0) > 0;
  const canMerge = Boolean(kept && duplicate && preview && !isBlocked && reason.trim() && irreversible);

  return (
    <AssistedPanel className='gap-6'>
      <p className='text-sm text-muted-foreground'>{t('merge.help')}</p>
      <div className='grid gap-6 md:grid-cols-2'>
        <PersonPicker person={kept} onSelect={selectKept} label={t('merge.keep')} />
        <PersonPicker person={duplicate} onSelect={setDuplicate} label={t('merge.duplicate')} />
      </div>
      {kept && duplicate ? (
        <Button color='primary' variant='text' size='small' type='button' onClick={swap}>
          {t('merge.swap')}
        </Button>
      ) : null}
      {preview ? (
        isBlocked ? (
          <div role='alert' className='grid gap-1 rounded-md border border-alert-600 p-3 text-sm'>
            <p className='font-medium'>{t('merge.blocked')}</p>
            <ul className='list-disc pl-5'>
              {preview.blocks.map(block => (
                <li key={`${block.code}-${block.detail ?? ''}`}>
                  {t(`merge.blocks.${block.code}`, {
                    defaultValue: block.code,
                  })}
                  {block.detail ? ` (${block.detail})` : ''}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className='grid gap-2 rounded-xl border border-border p-3 text-sm'>
            <p className='font-medium'>{t('merge.willHappen')}</p>
            <ul className='list-disc pl-5'>
              <li>{t('merge.rule.keepContact')}</li>
              <li>{t('merge.rule.bothPlans')}</li>
              <li>{t('merge.rule.walletSums')}</li>
              {Object.entries(preview.to_move).map(([table, count]) => (
                <li key={table}>
                  {t('merge.moves', {
                    count,
                    what: t(`merge.tables.${table}`, { defaultValue: table }),
                  })}
                </li>
              ))}
            </ul>
          </div>
        )
      ) : null}
      {kept && duplicate && preview && !isBlocked ? (
        <div className='grid max-w-xl gap-4'>
          <div className='grid gap-2'>
            <Label htmlFor='merge-reason'>{t('merge.reason')}</Label>
            <Textarea id='merge-reason' value={reason} onChange={event => setReason(event.target.value)} />
          </div>
          <div className='flex items-start gap-2'>
            <Checkbox
              id='merge-irreversible'
              checked={irreversible}
              onCheckedChange={value => setIrreversible(value === true)}
            />
            <Label htmlFor='merge-irreversible' className='font-normal'>
              {t('merge.irreversible')}
            </Label>
          </div>
          <div>
            <Button color='alert' variant='solid' disabled={!canMerge} onClick={() => setIsConfirmOpen(true)}>
              {t('merge.action')}
            </Button>
          </div>
        </div>
      ) : null}
      <ConfirmDialog
        open={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        onConfirm={submit}
        isLoading={isMerging}
        title={t('merge.confirmTitle')}
        description={t('merge.confirmDescription', {
          duplicate: duplicate?.full_name ?? '',
          kept: kept?.full_name ?? '',
        })}
        confirmLabel={t('merge.action')}
        cancelLabel={t('common.cancel')}
        confirmVariant='destructive'
      />
    </AssistedPanel>
  );
}
