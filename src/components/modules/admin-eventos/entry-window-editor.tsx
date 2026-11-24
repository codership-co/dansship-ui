import { format } from 'date-fns';
import { Button } from 'polpo/components';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { EditorField, InfoTooltip } from './editor-field';

import { Input } from '@components/ui';
import {
  bogotaLocalToIso,
  DansshipAPI,
  isoToBogotaLocal,
  participationErrorMessage,
  type EntryWindow,
  type EntryWindowPayload,
} from '@core/api';
import { usePromise } from '@hooks';

/**
 * "Ventana de ingreso", inside Información → Fechas y lugar: when the door can validate entries. It follows the
 * event times by default; "Cambiar" opens the override (e.g. a rehearsal on a test event) or the way back.
 */
export function EntryWindowEditor({ eventId }: { eventId: string }) {
  const { t } = useTranslation();
  const { response } = usePromise(() => DansshipAPI.entry.getEntryWindow(eventId), true, [eventId]);
  const [entryWindow, setWindow] = useState<EntryWindow | null>(null);
  const [opens, setOpens] = useState('');
  const [closes, setCloses] = useState('');
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);

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

  const summary = entryWindow
    ? `${t('eventos:participation.entryWindow.current', {
        opens: format(new Date(entryWindow.opens_at), 'dd/MM HH:mm'),
        closes: format(new Date(entryWindow.closes_at), 'dd/MM HH:mm'),
      })} · ${
        entryWindow.is_override
          ? t('eventos:participation.entryWindow.custom')
          : t('eventos:participation.entryWindow.default')
      }`
    : null;

  return (
    <div className='grid gap-3 border-t border-border pt-4'>
      <div className='flex flex-wrap items-center justify-between gap-2'>
        <div className='grid min-w-0 gap-0.5'>
          <span className='flex items-center gap-1 text-sm font-medium'>
            {t('eventos:participation.entryWindow.title')}
            <InfoTooltip content={t('eventos:participation.entryWindow.hint')} />
          </span>
          {summary ? <span className='text-sm text-muted-foreground'>{summary}</span> : null}
        </div>
        <Button
          type='button'
          variant='text'
          color='primary'
          size='small'
          aria-expanded={open}
          onClick={() => setOpen(current => !current)}
        >
          {open ? t('eventos:participation.entryWindow.close') : t('eventos:participation.entryWindow.change')}
        </Button>
      </div>
      {open ? (
        <>
          <div className='grid gap-3 md:grid-cols-2'>
            <EditorField label={t('eventos:participation.entryWindow.opens')} htmlFor='entry-window-opens'>
              <Input
                id='entry-window-opens'
                type='datetime-local'
                value={opens}
                onChange={change => setOpens(change.target.value)}
              />
            </EditorField>
            <EditorField label={t('eventos:participation.entryWindow.closes')} htmlFor='entry-window-closes'>
              <Input
                id='entry-window-closes'
                type='datetime-local'
                value={closes}
                onChange={change => setCloses(change.target.value)}
              />
            </EditorField>
          </div>
          <div className='flex flex-wrap justify-end gap-2'>
            {entryWindow?.is_override ? (
              <Button
                type='button'
                variant='text'
                color='primary'
                size='small'
                disabled={saving}
                onClick={() => void save({ opens_at: null, closes_at: null })}
              >
                {t('eventos:participation.entryWindow.reset')}
              </Button>
            ) : null}
            <Button
              type='button'
              variant='outlined'
              color='primary'
              size='small'
              isLoading={saving}
              onClick={() => void save({ opens_at: bogotaLocalToIso(opens), closes_at: bogotaLocalToIso(closes) })}
            >
              {t('eventos:participation.entryWindow.save')}
            </Button>
          </div>
        </>
      ) : null}
    </div>
  );
}
