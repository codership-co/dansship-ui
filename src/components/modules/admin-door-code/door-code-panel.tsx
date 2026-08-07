import { format, parseISO } from 'date-fns';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { SpinnerLoader } from '@components/loaders';
import { ConfirmDialog } from '@components/modals';
import { Button, Input, Label } from '@components/ui';
import { DansshipAPI } from '@core/api';
import { useCallablePromise, useDateLocale, usePromise } from '@hooks';

export function DoorCodePanel() {
  const { t } = useTranslation();
  const locale = useDateLocale();
  const { response, isLoading, reFetch } = usePromise(() => DansshipAPI.doorCodeAdmin.getCurrent());
  const { call: rotate, isLoading: isSubmitting } = useCallablePromise((code: string) =>
    DansshipAPI.doorCodeAdmin.rotate({ code }),
  );

  const current = response?.data ?? null;
  const [code, setCode] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);

  const trimmedCode = code.trim();
  const canSubmit = trimmedCode.length > 0 && trimmedCode.length <= 32;

  const handleConfirm = async () => {
    if (!canSubmit) return;

    const { ok, data } = await rotate(trimmedCode);

    if (!ok) {
      toast.error(t('admin:doorCode.rotateFailed'));

      return;
    }

    toast.success(
      t('admin:doorCode.rotateSuccess', {
        count: data?.notified_count ?? 0,
      }),
    );
    setCode('');
    setConfirmOpen(false);
    void reFetch();
  };

  if (isLoading && response === undefined) {
    return (
      <div className='grid place-content-center py-12'>
        <SpinnerLoader message={t('admin:doorCode.loading')} />
      </div>
    );
  }

  return (
    <section className='grid gap-6'>
      <div className='rounded-md border bg-white/50 p-4'>
        <p className='text-sm text-muted-foreground'>{t('admin:doorCode.currentLabel')}</p>
        {current ? (
          <>
            <p className='mt-1 font-mono text-3xl font-semibold tracking-widest text-primary'>{current.code}</p>
            <p className='mt-2 text-sm text-muted-foreground'>
              {t('admin:doorCode.lastChanged', {
                date: format(parseISO(current.effective_from), 'PPp', { locale }),
              })}
            </p>
          </>
        ) : (
          <p className='mt-1 text-sm text-muted-foreground'>{t('admin:doorCode.noCurrent')}</p>
        )}
      </div>

      <form
        className='grid gap-4 rounded-md border bg-white/50 p-4'
        onSubmit={event => {
          event.preventDefault();

          if (canSubmit) setConfirmOpen(true);
        }}
      >
        <h3 className='text-sm font-semibold'>{t('admin:doorCode.rotateTitle')}</h3>
        <p className='text-sm text-muted-foreground'>{t('admin:doorCode.rotateHint')}</p>

        <div className='grid gap-1.5 max-w-sm'>
          <Label htmlFor='door-code-input'>{t('admin:doorCode.codeLabel')}</Label>
          <Input
            id='door-code-input'
            value={code}
            onChange={event => setCode(event.target.value)}
            placeholder={t('admin:doorCode.codePlaceholder')}
            maxLength={32}
            autoComplete='off'
            required
          />
        </div>

        <div className='flex justify-end'>
          <Button type='submit' disabled={!canSubmit || isSubmitting}>
            {t('admin:doorCode.submit')}
          </Button>
        </div>
      </form>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        onConfirm={() => void handleConfirm()}
        title={t('admin:doorCode.confirmTitle')}
        description={t('admin:doorCode.confirmDescription', { code: trimmedCode })}
        confirmLabel={t('admin:doorCode.submit')}
        cancelLabel={t('common:cancel')}
        isLoading={isSubmitting}
      />
    </section>
  );
}
