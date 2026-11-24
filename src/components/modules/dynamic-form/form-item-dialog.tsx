import { Button } from 'polpo/components';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  FORM_ITEM_KINDS,
  formItemKeyFrom,
  LONG_TEXT_DEFAULT_MAX,
  type FormItem,
  type FormItemKind,
} from './form-items';

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

const SELECT_CLASS = 'h-10 rounded-md border border-input bg-background px-3 text-sm';
const HELP_TEXT_MAX = 300;

/** Optional parts of the item editor; a survey may not need the team's copy or the list column. */
export interface FormBuilderFeatures {
  listColumn?: boolean;
  adminCopy?: boolean;
}

interface FormItemDialogProps<T extends FormItem> {
  open: boolean;
  /** `section` adds or edits a section; otherwise a question. */
  mode: 'question' | 'section';
  item: T | null;
  /** Every other item: keys stay unique and list questions feed "visible when". */
  otherItems: Array<T>;
  /** The question kinds offered (sections are added with their own button). */
  kinds: Array<FormItemKind>;
  features?: FormBuilderFeatures;
  onOpenChange: (open: boolean) => void;
  onSave: (item: T) => void;
}

/** Adds or edits one item of a dynamic form: a question (by kind) or a section (title and description). */
export function FormItemDialog<T extends FormItem>({
  open,
  mode,
  item,
  otherItems,
  kinds,
  features = {},
  onOpenChange,
  onSave,
}: FormItemDialogProps<T>) {
  const { t } = useTranslation();
  const isSection = mode === 'section';
  const [label, setLabel] = useState('');
  const [helpText, setHelpText] = useState('');
  const [kind, setKind] = useState<FormItemKind>(kinds[0] ?? 'short_text');
  const [required, setRequired] = useState(false);
  const [choices, setChoices] = useState('');
  const [maxLength, setMaxLength] = useState(String(LONG_TEXT_DEFAULT_MAX));
  const [withNote, setWithNote] = useState(false);
  const [showInList, setShowInList] = useState(false);
  const [adminCopy, setAdminCopy] = useState(false);
  const [visibleField, setVisibleField] = useState('');
  const [visibleValue, setVisibleValue] = useState('');

  useEffect(() => {
    if (!open) return;

    setLabel(item?.label ?? '');
    setHelpText(item?.help_text ?? '');
    setKind(isSection ? 'section' : (item?.kind ?? kinds[0] ?? 'short_text'));
    setRequired(item?.required ?? false);
    setChoices((item?.options.choices ?? []).join('\n'));
    setMaxLength(String(item?.options.max_length ?? LONG_TEXT_DEFAULT_MAX));
    setWithNote(Boolean(item?.options.with_note));
    setShowInList(Boolean(item?.show_in_admin_list));
    setAdminCopy(Boolean(item?.admin_editable_copy));
    setVisibleField(item?.visible_when?.field_key ?? '');
    setVisibleValue(item?.visible_when?.equals ?? '');
  }, [item, open, isSection, kinds]);

  const meta = FORM_ITEM_KINDS[kind];
  const listItems = otherItems.filter(other => FORM_ITEM_KINDS[other.kind]?.choices);
  const sourceChoices = listItems.find(other => other.key === visibleField)?.options.choices ?? [];
  const parsedChoices = choices
    .split('\n')
    .map(choice => choice.trim())
    .filter(Boolean);
  const canSave = label.trim().length > 0 && (!meta.choices || parsedChoices.length > 0);

  const submit = () => {
    const options: FormItem['options'] = {};

    if (meta.choices) options.choices = Array.from(new Set(parsedChoices));

    if (meta.maxLength) options.max_length = Math.max(1, Number(maxLength) || LONG_TEXT_DEFAULT_MAX);

    if (meta.note) options.with_note = withNote;

    Object.assign(options, meta.defaults, meta.defaults ? item?.options : undefined);

    onSave({
      ...item,
      key:
        item?.key ??
        formItemKeyFrom(
          isSection ? `section_${label}` : label,
          otherItems.map(other => other.key),
        ),
      label: label.trim(),
      kind,
      help_text: helpText.trim() || null,
      required: !isSection && required,
      options,
      visible_when:
        !isSection && visibleField && visibleValue ? { field_key: visibleField, equals: visibleValue } : null,
      show_in_admin_list: Boolean(features.listColumn && meta.listColumn) && showInList,
      admin_editable_copy: Boolean(features.adminCopy && meta.adminCopy) && adminCopy,
    } as T);
  };

  const title = isSection
    ? t(item ? 'forms:dialog.editSection' : 'forms:dialog.addSection')
    : t(item ? 'forms:dialog.editQuestion' : 'forms:dialog.addQuestion');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {t(isSection ? 'forms:dialog.sectionHint' : 'forms:dialog.questionHint')}
          </DialogDescription>
        </DialogHeader>
        <div className='grid gap-4'>
          <div className='grid gap-2'>
            <Label htmlFor='form-item-label'>{t(isSection ? 'forms:dialog.sectionTitle' : 'forms:dialog.label')}</Label>
            <Input
              id='form-item-label'
              value={label}
              maxLength={120}
              onChange={change => setLabel(change.target.value)}
            />
          </div>
          {!isSection ? (
            <div className='grid gap-2'>
              <Label htmlFor='form-item-kind'>{t('forms:dialog.kind')}</Label>
              <select
                id='form-item-kind'
                className={SELECT_CLASS}
                value={kind}
                disabled={Boolean(item)}
                onChange={change => setKind(change.target.value as FormItemKind)}
              >
                {kinds.map(option => (
                  <option key={option} value={option}>
                    {t(`forms:kinds.${option}`)}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
          <div className='grid gap-2'>
            <Label htmlFor='form-item-help'>
              {t(isSection ? 'forms:dialog.sectionDescription' : 'forms:dialog.helpText')}
            </Label>
            <Textarea
              id='form-item-help'
              rows={2}
              value={helpText}
              maxLength={HELP_TEXT_MAX}
              onChange={change => setHelpText(change.target.value)}
            />
            {!isSection ? (
              <small className='text-xs text-muted-foreground'>{t('forms:dialog.helpTextHint')}</small>
            ) : null}
          </div>
          {meta.choices ? (
            <div className='grid gap-2'>
              <Label htmlFor='form-item-choices'>{t('forms:dialog.choices')}</Label>
              <Textarea
                id='form-item-choices'
                rows={5}
                value={choices}
                onChange={change => setChoices(change.target.value)}
              />
              <small className='text-xs text-muted-foreground'>{t('forms:dialog.choicesHint')}</small>
            </div>
          ) : null}
          {meta.maxLength ? (
            <div className='grid gap-2'>
              <Label htmlFor='form-item-max'>{t('forms:dialog.maxLength')}</Label>
              <Input
                id='form-item-max'
                type='number'
                min={1}
                max={5000}
                value={maxLength}
                onChange={change => setMaxLength(change.target.value)}
              />
            </div>
          ) : null}
          {meta.note ? (
            <label className='flex items-center justify-between gap-3'>
              <span className='text-sm'>{t('forms:dialog.withNote')}</span>
              <Switch checked={withNote} onCheckedChange={setWithNote} />
            </label>
          ) : null}
          {!isSection ? (
            <label className='flex items-center justify-between gap-3'>
              <span className='text-sm'>{t('forms:dialog.required')}</span>
              <Switch checked={required} onCheckedChange={setRequired} />
            </label>
          ) : null}
          {features.listColumn && meta.listColumn ? (
            <label className='flex items-center justify-between gap-3'>
              <span className='text-sm'>{t('forms:dialog.showInList')}</span>
              <Switch checked={showInList} onCheckedChange={setShowInList} />
            </label>
          ) : null}
          {features.adminCopy && meta.adminCopy ? (
            <label className='flex items-center justify-between gap-3'>
              <span className='grid gap-0.5'>
                <span className='text-sm'>{t('forms:dialog.adminCopy')}</span>
                <small className='text-xs text-muted-foreground'>{t('forms:dialog.adminCopyHint')}</small>
              </span>
              <Switch checked={adminCopy} onCheckedChange={setAdminCopy} />
            </label>
          ) : null}
          {!isSection && listItems.length > 0 ? (
            <div className='grid gap-2'>
              <Label htmlFor='form-item-visible'>{t('forms:dialog.visibleWhen')}</Label>
              <div className='grid gap-2 sm:grid-cols-2'>
                <select
                  id='form-item-visible'
                  className={SELECT_CLASS}
                  value={visibleField}
                  onChange={change => {
                    setVisibleField(change.target.value);
                    setVisibleValue('');
                  }}
                >
                  <option value=''>{t('forms:dialog.alwaysVisible')}</option>
                  {listItems.map(other => (
                    <option key={other.key} value={other.key}>
                      {other.label}
                    </option>
                  ))}
                </select>
                <select
                  aria-label={t('forms:dialog.visibleValue')}
                  className={SELECT_CLASS}
                  value={visibleValue}
                  disabled={!visibleField}
                  onChange={change => setVisibleValue(change.target.value)}
                >
                  <option value=''>{t('forms:dialog.chooseValue')}</option>
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
            {t('forms:dialog.cancel')}
          </Button>
          <Button type='button' variant='solid' color='primary' disabled={!canSave} onClick={submit}>
            {t('forms:dialog.apply')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
