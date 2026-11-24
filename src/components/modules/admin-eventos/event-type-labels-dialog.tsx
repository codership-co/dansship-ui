import { Button } from 'polpo/components';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import {
  Badge,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
} from '@components/ui';
import { participationErrorMessage, type EventTypeLabel, type EventTypeLabelUpdatePayload } from '@core/api';

interface EventTypeLabelsDialogProps {
  open: boolean;
  labels: Array<EventTypeLabel>;
  onOpenChange: (open: boolean) => void;
  onCreate: (name: string) => Promise<{ ok: boolean; error?: unknown }>;
  onUpdate: (labelId: string, payload: EventTypeLabelUpdatePayload) => Promise<{ ok: boolean; error?: unknown }>;
}

/**
 * "Editar lista": the event labels. A label is only a name; one in use is never deleted,
 * it only stops being offered (events that have it keep showing it).
 */
export function EventTypeLabelsDialog({ open, labels, onOpenChange, onCreate, onUpdate }: EventTypeLabelsDialogProps) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);

  const run = async (action: () => Promise<{ ok: boolean; error?: unknown }>) => {
    setBusy(true);
    try {
      const result = await action();

      if (!result.ok) {
        toast.error(participationErrorMessage(result.error, t, 'eventos:labels.saveFailed'));
      }

      return result.ok;
    } finally {
      setBusy(false);
    }
  };

  const add = async () => {
    const name = draft.trim();

    if (!name) return;

    if (await run(() => onCreate(name))) setDraft('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>{t('eventos:labels.title')}</DialogTitle>
          <DialogDescription>{t('eventos:labels.hint')}</DialogDescription>
        </DialogHeader>
        <ul className='grid gap-2'>
          {labels.map(label => (
            <li
              key={label.id}
              className='flex flex-wrap items-center justify-between gap-2 rounded-md border border-border px-3 py-2'
            >
              <span className='flex flex-wrap items-center gap-2'>
                <span className='text-sm font-medium'>{label.name}</span>
                {!label.is_offered ? (
                  <Badge variant='outlineNeutral' size='small'>
                    {t('eventos:labels.notOffered')}
                  </Badge>
                ) : null}
                {label.events_count > 0 ? (
                  <small className='text-xs text-muted-foreground'>
                    {t('eventos:labels.inUse', { count: label.events_count })}
                  </small>
                ) : null}
              </span>
              <Button
                type='button'
                variant='flat'
                color='secondary'
                size='small'
                disabled={busy}
                onClick={() => void run(() => onUpdate(label.id, { is_offered: !label.is_offered }))}
              >
                {label.is_offered ? t('eventos:labels.stopOffering') : t('eventos:labels.offerAgain')}
              </Button>
            </li>
          ))}
        </ul>
        <div className='grid gap-2'>
          <Label htmlFor='new-label'>{t('eventos:labels.newLabel')}</Label>
          <div className='flex gap-2'>
            <Input
              id='new-label'
              maxLength={60}
              value={draft}
              onChange={change => setDraft(change.target.value)}
              onKeyDown={keyEvent => {
                if (keyEvent.key === 'Enter') {
                  keyEvent.preventDefault();
                  void add();
                }
              }}
            />
            <Button
              type='button'
              variant='outlined'
              color='primary'
              disabled={busy || !draft.trim()}
              onClick={() => void add()}
            >
              {t('eventos:labels.add')}
            </Button>
          </div>
        </div>
        <DialogFooter>
          <Button type='button' variant='solid' color='primary' onClick={() => onOpenChange(false)}>
            {t('eventos:labels.done')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
