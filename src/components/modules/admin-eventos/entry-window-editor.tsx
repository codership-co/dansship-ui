import { format } from 'date-fns';
import { Button } from 'polpo/components';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { Card, CardContent, Input, Label } from '@components/ui';
import {
  bogotaLocalToIso,
  DansshipAPI,
  isoToBogotaLocal,
  participationErrorMessage,
  type EntryWindow,
  type EntryWindowPayload,
} from '@core/api';
import { usePromise } from '@hooks';

/** "Ventana de ingreso": override the door window (rehearsal) or go back to the default. */
export function EntryWindowEditor({ eventId }: { eventId: string }) {
  const { t } = useTranslation();
  const { response } = usePromise(() => DansshipAPI.entry.getEntryWindow(eventId), true, [eventId]);
  const [entryWindow, setWindow] = useState<EntryWindow | null>(null);
  const [opens, setOpens] = useState('');
  const [closes, setCloses] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!response?.data) return;

    setWindow(response.data);
    setOpens(isoToBogotaLocal(response.data.opens_at));
    setCloses(isoToBogotaLocal(response.data.closes_at));
  }, [response]);

  const save = async (payload: EntryWindowPayload) => {
    setSaving(true);
    try {
      const { ok, data, error } = await DansshipAPI.entry.setEntryWindow(eventId, payload);

      if (ok && data) {
        setWindow(data);
        setOpens(isoToBogotaLocal(data.opens_at));
        setCloses(isoToBogotaLocal(data.closes_at));
        toast.success(t('eventos:participation.entryWindow.saved'));
      } else {
        toast.error(participationErrorMessage(error, t, 'eventos:participation.entryWindow.failed'));
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardContent className='grid gap-3 pt-6'>
        <div className='grid gap-1'>
          <p className='m-0 font-semibold'>{t('eventos:participation.entryWindow.title')}</p>
          <p className='m-0 text-xs text-muted-foreground'>{t('eventos:participation.entryWindow.hint')}</p>
          {entryWindow ? (
            <p className='m-0 text-sm'>
              {t('eventos:participation.entryWindow.current', {
                opens: format(new Date(entryWindow.opens_at), 'dd/MM HH:mm'),
                closes: format(new Date(entryWindow.closes_at), 'dd/MM HH:mm'),
              })}{' '}
              ·{' '}
              {entryWindow.is_override
                ? t('eventos:participation.entryWindow.custom')
                : t('eventos:participation.entryWindow.default')}
            </p>
          ) : null}
        </div>
        <div className='grid gap-2 sm:grid-cols-2'>
          <div className='grid gap-1'>
            <Label htmlFor='entry-window-opens'>{t('eventos:participation.entryWindow.opens')}</Label>
            <Input
              id='entry-window-opens'
              type='datetime-local'
              value={opens}
              onChange={change => setOpens(change.target.value)}
            />
          </div>
          <div className='grid gap-1'>
            <Label htmlFor='entry-window-closes'>{t('eventos:participation.entryWindow.closes')}</Label>
            <Input
              id='entry-window-closes'
              type='datetime-local'
              value={closes}
              onChange={change => setCloses(change.target.value)}
            />
          </div>
        </div>
        <div className='flex flex-wrap justify-end gap-2'>
          {entryWindow?.is_override ? (
            <Button
              type='button'
              variant='text'
              color='primary'
              disabled={saving}
              onClick={() => void save({ opens_at: null, closes_at: null })}
            >
              {t('eventos:participation.entryWindow.reset')}
            </Button>
          ) : null}
          <Button
            type='button'
            color='primary'
            isLoading={saving}
            onClick={() => void save({ opens_at: bogotaLocalToIso(opens), closes_at: bogotaLocalToIso(closes) })}
          >
            {t('eventos:participation.entryWindow.save')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
