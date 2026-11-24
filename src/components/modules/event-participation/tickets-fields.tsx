import { Button } from 'polpo/components';
import { useTranslation } from 'react-i18next';
import { LuMinus, LuPlus } from 'react-icons/lu';

import { emptyTicket, type TicketDraft } from './tickets';

import { Checkbox, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/ui';
import { cn } from '@helpers';

import type { FamilyMinorOption, ParticipantMinorsRules } from '@core/api';

interface TicketsFieldsProps {
  tickets: Array<TicketDraft>;
  onChange: (tickets: Array<TicketDraft>) => void;
  errors: Record<number, string>;
  minors: ParticipantMinorsRules;
  familyMinors: Array<FamilyMinorOption>;
  maxTickets: number;
  remaining?: number | null;
}

/** "Tus entradas": quantity and one card per ticket; adults give name and email, minors enter with an adult. */
export function TicketsFields({
  tickets,
  onChange,
  errors,
  minors,
  familyMinors,
  maxTickets,
  remaining,
}: TicketsFieldsProps) {
  const { t } = useTranslation();
  const adults = tickets.map((ticket, index) => ({ ticket, index })).filter(item => !item.ticket.is_minor);
  const family = familyMinors.filter(
    minor => minor.age === null || minors.max_age === null || minor.age < minors.max_age,
  );

  const update = (index: number, patch: Partial<TicketDraft>) =>
    onChange(tickets.map((ticket, itemIndex) => (itemIndex === index ? { ...ticket, ...patch } : ticket)));

  const setCount = (count: number) => {
    if (count > tickets.length) {
      onChange([...tickets, ...Array.from({ length: count - tickets.length }, emptyTicket)]);

      return;
    }

    onChange(
      tickets
        .slice(0, count)
        .map(ticket =>
          ticket.is_minor && ticket.attach_to_index !== null && ticket.attach_to_index >= count
            ? { ...ticket, attach_to_index: null }
            : ticket,
        ),
    );
  };

  return (
    <section className='grid gap-4'>
      <div className='flex items-center justify-between gap-3'>
        <div className='grid gap-0.5'>
          <p className='m-0 font-semibold'>{t('eventos:tickets.quantity')}</p>
          {remaining !== null && remaining !== undefined ? (
            <p className='m-0 text-xs text-muted-foreground'>{t('eventos:tickets.remaining', { count: remaining })}</p>
          ) : null}
        </div>
        <div className='flex items-center gap-2'>
          <Button
            type='button'
            variant='outlined'
            color='primary'
            aria-label={t('eventos:tickets.less')}
            disabled={tickets.length <= 1}
            onClick={() => setCount(tickets.length - 1)}
          >
            <LuMinus className='size-4' aria-hidden />
          </Button>
          <span className='min-w-8 text-center font-title text-xl font-bold' aria-live='polite'>
            {tickets.length}
          </span>
          <Button
            type='button'
            variant='outlined'
            color='primary'
            aria-label={t('eventos:tickets.more')}
            disabled={tickets.length >= maxTickets}
            onClick={() => setCount(tickets.length + 1)}
          >
            <LuPlus className='size-4' aria-hidden />
          </Button>
        </div>
      </div>
      {tickets.map((ticket, index) => (
        <article
          // Tickets are positional: the API points minors at an adult by index.

          key={index}
          className={cn(
            'grid gap-3 rounded-2xl border border-border bg-white p-3.5',
            errors[index] ? 'border-alert-600' : 'border-border',
          )}
        >
          <p className='m-0 font-semibold'>{t('eventos:tickets.ticket', { number: index + 1 })}</p>
          {minors.allowed && minors.max_age ? (
            <div className='flex items-center gap-2'>
              <Checkbox
                id={`ticket-minor-${index}`}
                checked={ticket.is_minor}
                onCheckedChange={value =>
                  update(index, {
                    is_minor: value === true,
                    email: '',
                    attach_to_index: value === true ? (adults.find(item => item.index !== index)?.index ?? null) : null,
                    family_minor_user_id: null,
                  })
                }
              />
              <Label htmlFor={`ticket-minor-${index}`}>{t('eventos:tickets.isMinor', { age: minors.max_age })}</Label>
            </div>
          ) : null}
          {ticket.is_minor ? (
            <div className='grid gap-3 sm:grid-cols-2'>
              <div className='grid gap-1.5'>
                <Label htmlFor={`ticket-name-${index}`}>{t('eventos:tickets.minorName')} *</Label>
                <Input
                  id={`ticket-name-${index}`}
                  value={ticket.full_name}
                  maxLength={150}
                  disabled={Boolean(ticket.family_minor_user_id)}
                  onChange={change => update(index, { full_name: change.target.value })}
                />
              </div>
              <div className='grid gap-1.5'>
                <Label htmlFor={`ticket-with-${index}`}>{t('eventos:tickets.entersWith')} *</Label>
                <Select
                  value={ticket.attach_to_index === null ? '' : String(ticket.attach_to_index)}
                  onValueChange={value => update(index, { attach_to_index: Number(value) })}
                >
                  <SelectTrigger id={`ticket-with-${index}`} aria-label={t('eventos:tickets.entersWith')}>
                    <SelectValue placeholder={t('eventos:tickets.chooseAdult')} />
                  </SelectTrigger>
                  <SelectContent>
                    {adults.map(item => (
                      <SelectItem key={item.index} value={String(item.index)}>
                        {item.ticket.full_name.trim() || t('eventos:tickets.ticket', { number: item.index + 1 })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {family.length > 0 ? (
                <div className='flex flex-wrap items-center gap-2 sm:col-span-2'>
                  <span className='text-xs text-muted-foreground'>{t('eventos:tickets.fromFamily')}</span>
                  {family.map(minor => (
                    <Button
                      key={minor.user_id}
                      type='button'
                      variant={ticket.family_minor_user_id === minor.user_id ? 'solid' : 'outlined'}
                      color='primary'
                      size='small'
                      disabled={tickets.some(
                        (other, otherIndex) => otherIndex !== index && other.family_minor_user_id === minor.user_id,
                      )}
                      onClick={() =>
                        update(index, {
                          full_name: minor.full_name,
                          family_minor_user_id: ticket.family_minor_user_id === minor.user_id ? null : minor.user_id,
                        })
                      }
                    >
                      {minor.full_name}
                    </Button>
                  ))}
                </div>
              ) : null}
              <p className='m-0 text-xs text-muted-foreground sm:col-span-2'>
                {t('eventos:tickets.minorHint', { max: minors.per_adult_max ?? '' })}
              </p>
            </div>
          ) : (
            <div className='grid gap-3 sm:grid-cols-2'>
              <div className='grid gap-1.5'>
                <Label htmlFor={`ticket-name-${index}`}>{t('eventos:participation.form.fullName')} *</Label>
                <Input
                  id={`ticket-name-${index}`}
                  value={ticket.full_name}
                  maxLength={150}
                  autoComplete='off'
                  onChange={change => update(index, { full_name: change.target.value })}
                />
              </div>
              <div className='grid gap-1.5'>
                <Label htmlFor={`ticket-email-${index}`}>{t('eventos:tickets.email')} *</Label>
                <Input
                  id={`ticket-email-${index}`}
                  type='email'
                  value={ticket.email}
                  maxLength={255}
                  autoComplete='off'
                  onChange={change => update(index, { email: change.target.value })}
                />
              </div>
            </div>
          )}
          {errors[index] ? (
            <p className='m-0 text-sm text-alert-600' role='alert'>
              {errors[index]}
            </p>
          ) : null}
        </article>
      ))}
    </section>
  );
}
