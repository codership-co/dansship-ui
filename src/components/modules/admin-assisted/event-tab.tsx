import { format, parseISO } from 'date-fns';
import { Button } from 'polpo/components';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { PersonGate } from './person-gate';

import { CheckoutPaymentProofForm } from '@components/forms/checkout-payment-proof-form';
import {
  installmentOptionKey,
  installmentOptionLabel,
  useManualInstallmentPayment,
} from '@components/modules/admin-eventos/use-manual-installment-payment';
import {
  SimpleRegistrationDialog,
  type SimpleRegistrationOutcome,
} from '@components/modules/eventos/simple-registration-dialog';
import { CollapsibleTotal } from '@components/modules/payments/collapsible-total';
import {
  DatePicker,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@components/ui';
import { useOrPermissions } from '@contexts';
import {
  DANSSHIP_ERROR_CODE,
  DansshipAPI,
  PaymentMethod,
  type PersonSearchResult,
  type SimplePersonInput,
} from '@core/api';
import { PERMISSION } from '@core/permissions';
import { formatPrice } from '@helpers';
import { useDateLocale, usePromise } from '@hooks';

function SummaryRow({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex items-center justify-between gap-4 px-5 py-4 ${strong ? 'font-bold' : ''}`}>
      <span>{label}</span>
      <span className='text-right'>{value}</span>
    </div>
  );
}

function EventForm({ person }: { person: PersonSearchResult }) {
  const { t } = useTranslation('assisted');
  const { t: tAll } = useTranslation();
  const locale = useDateLocale();
  const { response } = usePromise(() => DansshipAPI.eventosAdmin.list());
  const [eventId, setEventId] = useState('');
  const [paidOn, setPaidOn] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [note, setNote] = useState('');
  const [registered, setRegistered] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const events = (response?.data ?? []).filter(event => event.kind === 'event');
  const event = events.find(item => item.id === eventId);
  const payment = useManualInstallmentPayment({
    eventId,
    userId: person.id,
    onRegistered: () => {
      setRegistered(true);
      setNote('');
      setFormKey(key => key + 1);
    },
  });
  const { options, selectedOption, isQuoteLoading, quoteErrorCode } = payment;
  const formatAmount = (amount: number) => formatPrice(amount, 'COP');

  return (
    <div className='grid gap-6'>
      <p className='text-sm text-muted-foreground'>{t('event.help')}</p>
      <div className='grid gap-6 md:grid-cols-2'>
        <div className='grid content-start gap-2'>
          <Label htmlFor='assisted-event'>{t('event.choose')}</Label>
          <Select
            value={eventId}
            onValueChange={value => {
              setEventId(value);
              setRegistered(false);
            }}
          >
            <SelectTrigger id='assisted-event'>
              <SelectValue placeholder={t('event.placeholder')} />
            </SelectTrigger>
            <SelectContent>
              {events.map(item => (
                <SelectItem key={item.id} value={item.id}>
                  {item.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className='grid content-start gap-2'>
          <Label htmlFor='assisted-event-concept'>{t('event.concept')}</Label>
          <Select
            value={selectedOption ? installmentOptionKey(selectedOption) : ''}
            disabled={options.length === 0}
            onValueChange={value => {
              const option = options.find(item => installmentOptionKey(item) === value);

              if (option) {
                payment.setSelected(option.sequences);
              }
            }}
          >
            <SelectTrigger id='assisted-event-concept'>
              <SelectValue placeholder={isQuoteLoading ? t('common.loading') : t('event.conceptPlaceholder')} />
            </SelectTrigger>
            <SelectContent>
              {options.map(option => (
                <SelectItem key={installmentOptionKey(option)} value={installmentOptionKey(option)}>
                  {installmentOptionLabel(option, (key, values) => tAll(key, values), formatAmount)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      {event && !isQuoteLoading && options.length === 0 ? (
        <p className='m-0 rounded-md border border-warning-600 bg-warning-50 p-3 text-sm'>
          {t(
            `event.noOptions.${quoteErrorCode === DANSSHIP_ERROR_CODE.EVENT_MANUAL_PAYMENT_PAIR_NOT_SUPPORTED ? 'pair' : 'generic'}`,
          )}
        </p>
      ) : null}
      {event && selectedOption ? (
        <>
          <div className='divide-y divide-border overflow-hidden rounded-2xl border border-border bg-white'>
            <SummaryRow label={t('event.summary.event')} value={event.name} />
            <SummaryRow
              label={t('event.summary.date')}
              value={event.starts_at ? format(parseISO(event.starts_at), 'EEE d MMM · p', { locale }) : '—'}
            />
            <SummaryRow label={t('event.summary.amount')} value={formatAmount(Number(selectedOption.amount))} strong />
          </div>
          <CheckoutPaymentProofForm
            key={formKey}
            variant='event'
            allowPdfProof
            hideSummary
            paymentMethod={PaymentMethod.TRANSFER}
            finalPrice={Number(selectedOption.amount)}
            amountToCharge={Number(selectedOption.amount)}
            walletAmountApplied={0}
            confirmLabel={t('event.approveAndEnroll')}
            topSlot={
              <CollapsibleTotal
                subtitle={tAll('eventos:checkout.vatIncluded', {
                  amount: formatAmount(Number(selectedOption.tax_amount)),
                })}
                amount={Number(selectedOption.amount)}
                baseAmount={Number(selectedOption.base_amount)}
                taxAmount={Number(selectedOption.tax_amount)}
                walletAmountApplied={0}
              />
            }
            acceptance={
              <div className='grid gap-4'>
                <div className='grid gap-2'>
                  <Label htmlFor='assisted-event-paid-on'>{t('event.paidOn')}</Label>
                  <DatePicker
                    boundary='local'
                    date={parseISO(paidOn)}
                    dateFormat='d MMM yyyy'
                    placeholder={t('event.paidOn')}
                    disabled={{ after: new Date() }}
                    onDateChange={date => date && setPaidOn(format(date, 'yyyy-MM-dd'))}
                  />
                </div>
                <div className='grid gap-2'>
                  <Label htmlFor='assisted-event-note'>
                    {t('event.note')} <span className='text-muted-foreground'>{t('event.optional')}</span>
                  </Label>
                  <Input
                    id='assisted-event-note'
                    value={note}
                    maxLength={500}
                    placeholder={t('event.notePlaceholder')}
                    onChange={changeEvent => setNote(changeEvent.target.value)}
                  />
                </div>
              </div>
            }
            onClose={() => undefined}
            onConfirmWithProof={file => payment.submit(file, { paidOn, note })}
            onSubmit={() => undefined}
          />
        </>
      ) : null}
      {registered ? <p className='text-sm text-active'>{t('event.registered')}</p> : null}
    </div>
  );
}

/** Creates the person with a simple registration when they have no account yet, then selects them. */
function CreatePersonAction({ onCreated }: { onCreated: (person: PersonSearchResult) => void }) {
  const { t } = useTranslation('assisted');
  const canRegister = useOrPermissions([PERMISSION.SIMPLE_ACCOUNT_REGISTER]);
  const [isOpen, setIsOpen] = useState(false);

  if (!canRegister) {
    return null;
  }

  const register = async (person: SimplePersonInput): Promise<SimpleRegistrationOutcome> => {
    const { ok, data } = await DansshipAPI.assistedAdmin.registerSimpleAccount(person);

    if (!ok || !data) {
      toast.error(t('event.createPersonFailed'));

      return 'failed';
    }

    if (!data.created) {
      toast.info(t('event.createPersonExisting'));
    }

    onCreated({ id: data.user_id, full_name: data.full_name, email: data.email });

    return 'created';
  };

  return (
    <>
      <div>
        <Button type='button' color='primary' variant='text' size='small' onClick={() => setIsOpen(true)}>
          {t('event.createPerson')}
        </Button>
      </div>
      <SimpleRegistrationDialog
        open={isOpen}
        onOpenChange={setIsOpen}
        title={t('event.createPersonTitle')}
        description={t('event.createPersonHelp')}
        submitLabel={t('event.createPersonSubmit')}
        termsLabel={t('event.createPersonTerms')}
        onSubmit={register}
      />
    </>
  );
}

export function EventTab() {
  return (
    <PersonGate emptyAction={select => <CreatePersonAction onCreated={select} />}>
      {person => <EventForm key={person.id} person={person} />}
    </PersonGate>
  );
}
