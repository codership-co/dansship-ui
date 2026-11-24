import { Button } from 'polpo/components';
import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { LuArrowDown, LuArrowUp, LuPlus, LuX } from 'react-icons/lu';

import { FormItemDialog, type FormBuilderFeatures } from './form-item-dialog';
import { FORM_ITEM_KINDS, isLayoutItem, type FormItem, type FormItemKind } from './form-items';

import { Badge, Switch } from '@components/ui';
import { cn } from '@helpers';

const QUESTION_KINDS = (Object.keys(FORM_ITEM_KINDS) as Array<FormItemKind>).filter(
  kind => !FORM_ITEM_KINDS[kind].layout,
);

/** A row of the builder: label and hint on the left, actions on the right. */
export function FormBuilderRow({
  label,
  hint,
  tone = 'question',
  children,
}: {
  label: string;
  hint?: string;
  tone?: 'question' | 'section';
  children?: ReactNode;
}) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-center justify-between gap-3 rounded-xl border px-3.5 py-3',
        tone === 'section' ? 'border-primary/30 bg-secondary' : 'border-border',
      )}
    >
      <div className='grid min-w-0 gap-0.5'>
        <p className={cn('m-0 text-sm', tone === 'section' ? 'font-semibold' : 'font-medium')}>{label}</p>
        {hint ? <p className='m-0 text-xs text-muted-foreground'>{hint}</p> : null}
      </div>
      <div className='flex items-center gap-2'>{children}</div>
    </div>
  );
}

interface FormBuilderProps<T extends FormItem> {
  items: Array<T>;
  onChange: (items: Array<T>) => void;
  /** Question kinds offered; all of them by default. */
  kinds?: Array<FormItemKind>;
  features?: FormBuilderFeatures;
  /** Fixed rows shown before the items (e.g. name and email, always asked). */
  leading?: ReactNode;
}

/**
 * Builds a dynamic form (Google Forms style): questions and sections in one ordered list. Every question after
 * a section belongs to it; the arrows move items, so a question changes section by moving past one.
 */
export function FormBuilder<T extends FormItem>({
  items,
  onChange,
  kinds = QUESTION_KINDS,
  features,
  leading,
}: FormBuilderProps<T>) {
  const { t } = useTranslation();
  const [editing, setEditing] = useState<T | null>(null);
  const [mode, setMode] = useState<'question' | 'section'>('question');
  const [dialogOpen, setDialogOpen] = useState(false);

  const open = (nextMode: 'question' | 'section', item: T | null) => {
    setMode(nextMode);
    setEditing(item);
    setDialogOpen(true);
  };

  const save = (item: T) => {
    const exists = items.some(current => current.key === item.key);

    onChange(exists ? items.map(current => (current.key === item.key ? item : current)) : [...items, item]);
    setDialogOpen(false);
  };

  const remove = (key: string) =>
    onChange(
      items
        .filter(item => item.key !== key)
        .map(item => (item.visible_when?.field_key === key ? { ...item, visible_when: null } : item)),
    );

  const move = (index: number, step: -1 | 1) => {
    const target = index + step;

    if (target < 0 || target >= items.length) return;

    const next = [...items];

    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  return (
    <div className='grid gap-3'>
      {leading}
      {items.map((item, index) => {
        const section = isLayoutItem(item);

        return (
          <div key={item.key} className={cn(!section && items.slice(0, index).some(isLayoutItem) && 'sm:ml-4')}>
            <FormBuilderRow
              tone={section ? 'section' : 'question'}
              label={item.label}
              hint={[
                section ? (item.help_text ?? null) : t(`forms:kinds.${item.kind}`),
                item.visible_when ? t('forms:builder.visibleWhenHint', { value: item.visible_when.equals }) : null,
              ]
                .filter(Boolean)
                .join(' · ')}
            >
              {section ? (
                <Badge variant='outline' size='small' className='text-muted-foreground'>
                  {t('forms:builder.section')}
                </Badge>
              ) : (
                <>
                  <span className='text-xs text-muted-foreground'>{t('forms:builder.required')}</span>
                  <Switch
                    aria-label={t('forms:builder.requiredFor', { label: item.label })}
                    checked={item.required}
                    onCheckedChange={value =>
                      onChange(
                        items.map(current => (current.key === item.key ? { ...current, required: value } : current)),
                      )
                    }
                  />
                </>
              )}
              <Button
                type='button'
                variant='flat'
                color='secondary'
                size='small'
                aria-label={t('forms:builder.moveUp', { label: item.label })}
                disabled={index === 0}
                onClick={() => move(index, -1)}
              >
                <LuArrowUp className='size-4' aria-hidden />
              </Button>
              <Button
                type='button'
                variant='flat'
                color='secondary'
                size='small'
                aria-label={t('forms:builder.moveDown', { label: item.label })}
                disabled={index === items.length - 1}
                onClick={() => move(index, 1)}
              >
                <LuArrowDown className='size-4' aria-hidden />
              </Button>
              <Button
                type='button'
                variant='flat'
                color='secondary'
                size='small'
                onClick={() => open(section ? 'section' : 'question', item)}
              >
                {t('forms:builder.edit')}
              </Button>
              <Button
                type='button'
                variant='flat'
                color='secondary'
                size='small'
                aria-label={t('forms:builder.remove', { label: item.label })}
                onClick={() => remove(item.key)}
              >
                <LuX className='size-4' aria-hidden />
              </Button>
            </FormBuilderRow>
          </div>
        );
      })}
      <div className='flex flex-wrap gap-2'>
        <Button type='button' variant='outlined' color='primary' size='small' onClick={() => open('question', null)}>
          <LuPlus className='size-4' aria-hidden />
          {t('forms:builder.addQuestion')}
        </Button>
        <Button type='button' variant='outlined' color='primary' size='small' onClick={() => open('section', null)}>
          <LuPlus className='size-4' aria-hidden />
          {t('forms:builder.addSection')}
        </Button>
      </div>
      <FormItemDialog
        open={dialogOpen}
        mode={mode}
        item={editing}
        otherItems={items.filter(item => item.key !== editing?.key)}
        kinds={kinds}
        features={features}
        onOpenChange={setDialogOpen}
        onSave={save}
      />
    </div>
  );
}
