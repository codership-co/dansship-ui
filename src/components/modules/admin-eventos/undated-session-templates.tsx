import { Button } from 'polpo/components';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { EditorField } from './editor-field';
import { WEEKDAY_KEYS, conflictMessage } from './event-sessions-panel';

import { Input } from '@components/ui';
import { DansshipAPI, bogotaDateTimeToIso, type EventAdmin, type EventSessionTemplate } from '@core/api';

/**
 * The other sessions of a duplicated event, copied without dates. Once the main session is dated, each one
 * gets its date here (the usual room and instructor checks apply when it is added).
 */
export function UndatedSessionTemplates({ event }: { event: EventAdmin }) {
  const { t } = useTranslation();
  const pending = (event.session_templates ?? []).filter(item => !item.is_main);
  const [dates, setDates] = useState<Record<number, string>>({});
  const [added, setAdded] = useState<Array<number>>([]);

  const visible = pending.map((template, index) => ({ template, index })).filter(item => !added.includes(item.index));

  if (visible.length === 0) {
    return null;
  }

  const add = async (template: EventSessionTemplate, index: number) => {
    const date = dates[index];

    if (!date) return;

    const { ok, error } = await DansshipAPI.eventosAdmin.addSession(event.id, {
      starts_at: bogotaDateTimeToIso(date, template.start_time),
      ends_at: bogotaDateTimeToIso(date, template.end_time),
      room_id: template.room_id,
      external_location: template.external_location,
      label: template.label,
    });

    if (!ok) {
      toast.error(conflictMessage(error, t));

      return;
    }

    setAdded(current => [...current, index]);
    toast.success(t('eventos:info.templateAdded'));
  };

  return (
    <div className='grid gap-3 rounded-md border border-dashed border-border p-3'>
      <p className='m-0 text-sm font-semibold'>{t('eventos:info.copiedSessions')}</p>
      {visible.map(({ template, index }) => (
        <div key={index} className='grid gap-3 md:grid-cols-[1fr_12rem_auto] md:items-end'>
          <p className='m-0 text-sm'>
            {t(`common:days.${WEEKDAY_KEYS[template.weekday] ?? 'monday'}`)} · {template.start_time.slice(0, 5)}–
            {template.end_time.slice(0, 5)}
            {template.label ? ` · ${template.label}` : ''}
          </p>
          <EditorField label={t('eventos:info.date')} required htmlFor={`template-${index}-date`}>
            <Input
              id={`template-${index}-date`}
              type='date'
              value={dates[index] ?? ''}
              onChange={change => setDates(current => ({ ...current, [index]: change.target.value }))}
            />
          </EditorField>
          <Button
            type='button'
            variant='outlined'
            color='primary'
            disabled={!dates[index]}
            onClick={() => void add(template, index)}
          >
            {t('eventos:admin.addSession')}
          </Button>
        </div>
      ))}
    </div>
  );
}
