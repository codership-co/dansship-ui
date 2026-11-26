import { type FieldValues, type Path, type Control } from 'react-hook-form';

import { AnswerInput, isFullWidthItem } from './answer-inputs';
import { groupFormSections, isAnswerItem, type FormItem } from './form-items';
import { FORM_CARD } from './form-styles';

import { cn } from '@helpers';

interface DynamicFormSectionsProps<T extends FieldValues> {
  control: Control<T>;
  /** Where the answers live in the form values, e.g. `answers`: each item is answered at `answers.<key>`. */
  name: string;
  /** The ordered items to show (already filtered by visibility); sections are among them. */
  items: Array<FormItem>;
  /** Two columns on wide screens for short questions (lists, short text). */
  columns?: 1 | 2;
}

/**
 * A dynamic form rendered as cards, one per section (Google Forms style): the section's title and
 * description on top, then its questions. Questions before the first section get an untitled card.
 */
export function DynamicFormSections<T extends FieldValues>({
  control,
  name,
  items,
  columns = 2,
}: DynamicFormSectionsProps<T>) {
  const groups = groupFormSections(items.filter(item => item.kind === 'section' || isAnswerItem(item)));

  return groups.map(group => {
    const titleId = group.section ? `form-section-${group.section.key}` : undefined;

    return (
      <section key={group.key} aria-labelledby={titleId} className={cn('grid gap-4 p-4 sm:p-5', FORM_CARD)}>
        {group.section ? (
          <div className='grid gap-1'>
            <h3 id={titleId} className='m-0 text-base font-semibold'>
              {group.section.label}
            </h3>
            {group.section.help_text ? (
              <p className='m-0 text-xs whitespace-pre-line text-muted-foreground'>{group.section.help_text}</p>
            ) : null}
          </div>
        ) : null}
        <div className={cn('grid gap-5', columns === 2 && 'md:grid-cols-2')}>
          {group.items.map(item => (
            <div key={item.key} className={cn('min-w-0', columns === 2 && isFullWidthItem(item) && 'md:col-span-2')}>
              <AnswerInput control={control} name={`${name}.${item.key}` as Path<T>} item={item} />
            </div>
          ))}
        </div>
      </section>
    );
  });
}
