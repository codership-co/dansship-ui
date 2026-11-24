import { type ComponentType } from 'react';
import { Controller, type Control } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { GroupMembersFields } from './group-members-fields';
import { TicketsFields } from './tickets-fields';

import { TextField } from '@components/form-fields';
import { Input, Label } from '@components/ui';

import type { SignupFormValues } from './signup-form-values';
import type { FamilyMinorOption, ParticipantMinorsRules, RegistrationOption, RegistrationOptionKind } from '@core/api';

export interface SignupOptionRendererProps {
  control: Control<SignupFormValues>;
  option: RegistrationOption;
  minors: ParticipantMinorsRules;
  familyMinors: Array<FamilyMinorOption>;
  remaining?: number | null;
  /** Errors of the ticket rows, by index (client checks and `details.index(es)` from the API). */
  ticketErrors: Record<number, string>;
}

const OPTION_KEY = 'eventos:participation.registrationOptions';

function SingleFields() {
  return null;
}

function PairFields({ control }: SignupOptionRendererProps) {
  const { t } = useTranslation();

  return (
    <section className='grid gap-2 rounded-[14px] border border-border bg-white p-4'>
      <TextField
        control={control}
        name='partner_email'
        type='email'
        autoComplete='off'
        label={`${t('eventos:participation.form.partnerEmail')} *`}
        helperText={t('eventos:participation.form.partnerEmailHint')}
      />
    </section>
  );
}

function GroupFields({ control, option, minors, familyMinors }: SignupOptionRendererProps) {
  const { t } = useTranslation();

  return (
    <Controller
      control={control}
      name='members'
      render={({ fieldState }) => (
        <div className='grid gap-1'>
          <GroupMembersFields
            control={control}
            label={t('eventos:participation.form.groupTitle')}
            familyMinors={familyMinors}
            minorsAllowed={minors.allowed}
            maxPeople={option.max_members ?? 100}
          />
          {fieldState.error ? <small className='text-alert-600'>{fieldState.error.message}</small> : null}
        </div>
      )}
    />
  );
}

function TicketRows({ control, option, minors, familyMinors, remaining, ticketErrors }: SignupOptionRendererProps) {
  return (
    <Controller
      control={control}
      name='tickets'
      render={({ field }) => (
        <TicketsFields
          tickets={field.value}
          onChange={field.onChange}
          errors={ticketErrors}
          minors={minors}
          familyMinors={familyMinors}
          maxTickets={option.max_tickets ?? 50}
          remaining={remaining}
        />
      )}
    />
  );
}

function GroupBookingFields({ control, option }: SignupOptionRendererProps) {
  const { t } = useTranslation();

  return (
    <Controller
      control={control}
      name='people_count'
      render={({ field, fieldState }) => (
        <section className='grid gap-2 rounded-[14px] border border-border bg-white p-4'>
          <Label htmlFor='people-count'>{t('eventos:participation.form.peopleCount')} *</Label>
          <Input
            id='people-count'
            type='number'
            inputMode='numeric'
            min={option.min_people ?? 1}
            max={option.max_people ?? 200}
            value={field.value}
            onChange={change => field.onChange(change.target.value)}
          />
          <small className='text-xs text-muted-foreground'>
            {t('eventos:participation.form.peopleCountHint', {
              min: option.min_people ?? 1,
              max: option.max_people ?? 200,
            })}
          </small>
          {fieldState.error ? <small className='text-alert-600'>{fieldState.error.message}</small> : null}
        </section>
      )}
    />
  );
}

/** Registration option → the people inputs of its signup step. A new backend option is one entry here. */
export const SIGNUP_OPTION_RENDERERS: Record<RegistrationOptionKind, ComponentType<SignupOptionRendererProps>> = {
  single: SingleFields,
  pair: PairFields,
  group: GroupFields,
  multi_ticket: TicketRows,
  group_booking: GroupBookingFields,
};

/** The answer shown in "¿Cómo te inscribes?": the admin's label, or the option's default name. */
export function optionLabel(option: RegistrationOption, t: (key: string) => string): string {
  return option.label || t(`${OPTION_KEY}.${option.kind}.label`);
}
