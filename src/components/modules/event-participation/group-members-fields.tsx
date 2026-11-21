import { Button } from 'polpo/components';
import { useFieldArray, useWatch, type Control } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { LuPlus } from 'react-icons/lu';

import { TextField } from '@components/form-fields';
import { Checkbox, Label } from '@components/ui';

import type { SignupFormValues } from './signup-form-values';
import type { FamilyMinorOption } from '@core/api';

interface GroupMembersFieldsProps {
  control: Control<SignupFormValues>;
  label: string;
  familyMinors: Array<FamilyMinorOption>;
  minorsAllowed: boolean;
  maxPeople: number;
}

/** "Tu grupo": one card per member. Adults give name, email and phone; minors only a name. */
export function GroupMembersFields({
  control,
  label,
  familyMinors,
  minorsAllowed,
  maxPeople,
}: GroupMembersFieldsProps) {
  const { t } = useTranslation();
  const { fields, append, remove, update } = useFieldArray({ control, name: 'members' });
  const members = useWatch({ control, name: 'members' }) ?? [];
  const pickedFamily = new Set(members.map(member => member.family_minor_user_id).filter(Boolean));
  const available = familyMinors.filter(minor => !pickedFamily.has(minor.user_id));
  const full = fields.length >= maxPeople;

  return (
    <section className='grid gap-3'>
      <div className='grid gap-1'>
        <h3 className='m-0 text-base font-semibold'>{label}</h3>
        <p className='m-0 text-sm text-muted-foreground'>
          {t('eventos:participation.form.groupCount', { count: fields.length + 1 })}
        </p>
      </div>
      {fields.map((field, index) => {
        const member = members[index] ?? field;
        const fromFamily = Boolean(member.family_minor_user_id);

        return (
          <article key={field.id} className='grid gap-3 rounded-xl border border-border bg-white p-3.5'>
            <div className='flex items-center justify-between gap-2'>
              <p className='m-0 text-sm font-semibold'>
                {t('eventos:participation.form.member', { number: index + 1 })}
              </p>
              <Button type='button' variant='text' color='primary' size='small' onClick={() => remove(index)}>
                {t('eventos:participation.form.removeMember')}
              </Button>
            </div>
            {minorsAllowed ? (
              <div className='flex items-center gap-2'>
                <Checkbox
                  id={`member-minor-${field.id}`}
                  checked={member.is_minor}
                  disabled={fromFamily}
                  onCheckedChange={value =>
                    update(index, {
                      ...member,
                      is_minor: value === true,
                      email: '',
                      phone: '',
                      family_minor_user_id: '',
                    })
                  }
                />
                <Label htmlFor={`member-minor-${field.id}`}>{t('eventos:participation.form.isMinor')}</Label>
              </div>
            ) : null}
            {member.is_minor ? (
              <div className='grid gap-1'>
                <TextField
                  control={control}
                  name={`members.${index}.full_name`}
                  label={t('eventos:participation.form.minorName')}
                  disabled={fromFamily}
                  maxLength={150}
                />
                <small className='text-xs text-muted-foreground'>
                  {fromFamily ? t('eventos:participation.form.fromFamily') : t('eventos:participation.form.minorHint')}
                </small>
              </div>
            ) : (
              <div className='grid gap-3 sm:grid-cols-3'>
                <TextField
                  control={control}
                  name={`members.${index}.full_name`}
                  label={t('eventos:participation.form.fullName')}
                  autoComplete='off'
                  maxLength={150}
                />
                <TextField
                  control={control}
                  name={`members.${index}.email`}
                  type='email'
                  label={t('eventos:participation.form.email')}
                  autoComplete='off'
                  maxLength={255}
                />
                <TextField
                  control={control}
                  name={`members.${index}.phone`}
                  type='tel'
                  label={t('eventos:participation.form.phone')}
                  autoComplete='off'
                  maxLength={40}
                />
              </div>
            )}
          </article>
        );
      })}
      {minorsAllowed && available.length > 0 && !full ? (
        <div className='flex flex-wrap items-center gap-2'>
          <span className='text-sm text-muted-foreground'>{t('eventos:participation.form.addFromFamily')}</span>
          {available.map(minor => (
            <Button
              key={minor.user_id}
              type='button'
              variant='outlined'
              color='primary'
              size='small'
              onClick={() =>
                append({
                  full_name: minor.full_name,
                  is_minor: true,
                  email: '',
                  phone: '',
                  family_minor_user_id: minor.user_id,
                })
              }
            >
              {minor.age !== null
                ? t('eventos:participation.form.familyMinorAge', { name: minor.full_name, age: minor.age })
                : minor.full_name}
            </Button>
          ))}
        </div>
      ) : null}
      <div>
        <Button
          type='button'
          variant='outlined'
          color='primary'
          size='small'
          disabled={full}
          onClick={() => append({ full_name: '', is_minor: false, email: '', phone: '', family_minor_user_id: '' })}
        >
          <LuPlus className='size-4' aria-hidden />
          {t('eventos:participation.form.addMember')}
        </Button>
      </div>
      <p className='m-0 rounded-xl bg-secondary p-3 text-xs leading-relaxed'>
        {t('eventos:participation.form.dataNotice')}
      </p>
    </section>
  );
}
