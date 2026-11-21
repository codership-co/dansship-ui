import { Button } from 'polpo/components';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Switch,
  Textarea,
} from '@components/ui';

import type { EventFormFieldKind, ParticipantField } from '@core/api';

export const FIELD_KINDS: Array<EventFormFieldKind> = [
  'short_text',
  'long_text',
  'link',
  'choice',
  'multi_choice',
  'checkbox',
  'people',
];

const SELECT_CLASS = 'h-10 rounded-md border border-input bg-background px-3 text-sm';

/** A stable answer key from a label: lowercase ASCII words joined by "_". */
export function fieldKeyFrom(label: string, taken: Array<string>): string {
  const base =
    label
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 50) || 'field';
  const start = /^[a-z]/.test(base) ? base : `f_${base}`;
  let key = start;
  let suffix = 2;

  while (taken.includes(key)) {
    key = `${start}_${suffix}`;
    suffix += 1;
  }

  return key;
}

interface FormFieldDialogProps {
  open: boolean;
  field: ParticipantField | null;
  /** Every other field: keys must stay unique and list fields feed "visible when". */
  otherFields: Array<ParticipantField>;
  onOpenChange: (open: boolean) => void;
  onSave: (field: ParticipantField) => void;
}

/** Adds or edits one field of the generic signup form. */
export function FormFieldDialog({ open, field, otherFields, onOpenChange, onSave }: FormFieldDialogProps) {
  const { t } = useTranslation();
  const [label, setLabel] = useState('');
  const [kind, setKind] = useState<EventFormFieldKind>('short_text');
  const [required, setRequired] = useState(false);
  const [choices, setChoices] = useState('');
  const [maxLength, setMaxLength] = useState('1000');
  const [withNote, setWithNote] = useState(false);
  const [showInList, setShowInList] = useState(false);
  const [adminCopy, setAdminCopy] = useState(false);
  const [visibleField, setVisibleField] = useState('');
  const [visibleValue, setVisibleValue] = useState('');

  useEffect(() => {
    if (!open) {
      return;
    }

    setLabel(field?.label ?? '');
    setKind(field?.kind ?? 'short_text');
    setRequired(field?.required ?? false);
    setChoices((field?.options.choices ?? []).join('\n'));
    setMaxLength(String(field?.options.max_length ?? 1000));
    setWithNote(Boolean(field?.options.with_note));
    setShowInList(Boolean(field?.show_in_admin_list));
    setAdminCopy(Boolean(field?.admin_editable_copy));
    setVisibleField(field?.visible_when?.field_key ?? '');
    setVisibleValue(field?.visible_when?.equals ?? '');
  }, [field, open]);

  const listFields = otherFields.filter(item => item.kind === 'choice' || item.kind === 'multi_choice');
  const sourceChoices = listFields.find(item => item.key === visibleField)?.options.choices ?? [];
  const parsedChoices = choices
    .split('\n')
    .map(item => item.trim())
    .filter(Boolean);
  const needsChoices = kind === 'choice' || kind === 'multi_choice';
  const canSave = label.trim().length > 0 && (!needsChoices || parsedChoices.length > 0);

  const submit = () => {
    const options: ParticipantField['options'] = {};

    if (needsChoices) options.choices = Array.from(new Set(parsedChoices));

    if (kind === 'long_text') options.max_length = Math.max(1, Number(maxLength) || 1000);

    if (kind === 'link') options.with_note = withNote;

    if (kind === 'people') options.max_people = field?.options.max_people ?? 30;

    onSave({
      key:
        field?.key ??
        fieldKeyFrom(
          label,
          otherFields.map(item => item.key),
        ),
      label: label.trim(),
      kind,
      required,
      options,
      visible_when: visibleField && visibleValue ? { field_key: visibleField, equals: visibleValue } : null,
      show_in_admin_list: showInList,
      admin_editable_copy: kind === 'long_text' && adminCopy,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>
            {field ? t('eventos:participation.fields.editTitle') : t('eventos:participation.fields.addTitle')}
          </DialogTitle>
          <DialogDescription>{t('eventos:participation.fields.dialogHint')}</DialogDescription>
        </DialogHeader>
        <div className='grid gap-4'>
          <div className='grid gap-2'>
            <Label htmlFor='field-label'>{t('eventos:participation.fields.label')}</Label>
            <Input id='field-label' value={label} maxLength={120} onChange={change => setLabel(change.target.value)} />
          </div>
          <div className='grid gap-2'>
            <Label htmlFor='field-kind'>{t('eventos:participation.fields.kind')}</Label>
            <select
              id='field-kind'
              className={SELECT_CLASS}
              value={kind}
              disabled={Boolean(field)}
              onChange={change => setKind(change.target.value as EventFormFieldKind)}
            >
              {FIELD_KINDS.map(item => (
                <option key={item} value={item}>
                  {t(`eventos:participation.fieldKinds.${item}`)}
                </option>
              ))}
            </select>
          </div>
          {needsChoices ? (
            <div className='grid gap-2'>
              <Label htmlFor='field-choices'>{t('eventos:participation.fields.choices')}</Label>
              <Textarea
                id='field-choices'
                rows={5}
                value={choices}
                onChange={change => setChoices(change.target.value)}
              />
              <small className='text-xs text-muted-foreground'>{t('eventos:participation.fields.choicesHint')}</small>
            </div>
          ) : null}
          {kind === 'long_text' ? (
            <div className='grid gap-2'>
              <Label htmlFor='field-max'>{t('eventos:participation.fields.maxLength')}</Label>
              <Input
                id='field-max'
                type='number'
                min={1}
                max={5000}
                value={maxLength}
                onChange={change => setMaxLength(change.target.value)}
              />
            </div>
          ) : null}
          {kind === 'link' ? (
            <label className='flex items-center justify-between gap-3'>
              <span className='text-sm'>{t('eventos:participation.fields.withNote')}</span>
              <Switch checked={withNote} onCheckedChange={setWithNote} />
            </label>
          ) : null}
          <label className='flex items-center justify-between gap-3'>
            <span className='text-sm'>{t('eventos:participation.fields.required')}</span>
            <Switch checked={required} onCheckedChange={setRequired} />
          </label>
          {kind !== 'people' ? (
            <label className='flex items-center justify-between gap-3'>
              <span className='text-sm'>{t('eventos:participation.fields.showInList')}</span>
              <Switch checked={showInList} onCheckedChange={setShowInList} />
            </label>
          ) : null}
          {kind === 'long_text' ? (
            <label className='flex items-center justify-between gap-3'>
              <span className='grid gap-0.5'>
                <span className='text-sm'>{t('eventos:participation.fields.adminCopy')}</span>
                <small className='text-xs text-muted-foreground'>
                  {t('eventos:participation.fields.adminCopyHint')}
                </small>
              </span>
              <Switch checked={adminCopy} onCheckedChange={setAdminCopy} />
            </label>
          ) : null}
          {listFields.length > 0 ? (
            <div className='grid gap-2'>
              <Label htmlFor='field-visible'>{t('eventos:participation.fields.visibleWhen')}</Label>
              <div className='grid gap-2 sm:grid-cols-2'>
                <select
                  id='field-visible'
                  className={SELECT_CLASS}
                  value={visibleField}
                  onChange={change => {
                    setVisibleField(change.target.value);
                    setVisibleValue('');
                  }}
                >
                  <option value=''>{t('eventos:participation.fields.alwaysVisible')}</option>
                  {listFields.map(item => (
                    <option key={item.key} value={item.key}>
                      {item.label}
                    </option>
                  ))}
                </select>
                <select
                  aria-label={t('eventos:participation.fields.visibleValue')}
                  className={SELECT_CLASS}
                  value={visibleValue}
                  disabled={!visibleField}
                  onChange={change => setVisibleValue(change.target.value)}
                >
                  <option value=''>{t('eventos:participation.fields.chooseValue')}</option>
                  {sourceChoices.map(choice => (
                    <option key={choice} value={choice}>
                      {choice}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : null}
        </div>
        <DialogFooter>
          <Button type='button' variant='outlined' color='primary' onClick={() => onOpenChange(false)}>
            {t('eventos:participation.cancel')}
          </Button>
          <Button type='button' variant='solid' color='primary' disabled={!canSave} onClick={submit}>
            {t('eventos:participation.fields.apply')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
