import { Button } from 'polpo/components';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LuSearch, LuUpload } from 'react-icons/lu';

import { sameSequences, useManualInstallmentPayment } from './use-manual-installment-payment';

import { SpinnerLoader } from '@components/loaders';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
} from '@components/ui';
import { DansshipAPI } from '@core/api';
import { formatPrice } from '@helpers';
import { usePromise } from '@hooks';

interface InstallmentPaymentDialogProps {
  eventId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRegistered: () => void;
}

function statusLabel(status: string, t: (key: string) => string) {
  return t(`bookings:installmentStatus.${status}`);
}

export function InstallmentPaymentDialog({ eventId, open, onOpenChange, onRegistered }: InstallmentPaymentDialogProps) {
  const { t } = useTranslation();
  const [emailInput, setEmailInput] = useState('');
  const [emailQuery, setEmailQuery] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedUserEmail, setSelectedUserEmail] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { response: users, isLoading: usersLoading } = usePromise(
    () => DansshipAPI.bookingsAdmin.searchUsers(emailQuery),
    open && emailQuery.length >= 3 && !selectedUserId,
    [emailQuery, open, selectedUserId],
  );
  const payment = useManualInstallmentPayment({ eventId, userId: selectedUserId, enabled: open, onRegistered });
  const { lines, options, selected, setSelected, isQuoteLoading, proof, previewUrl, proofAccept, chooseProof } =
    payment;
  const submitting = payment.isSubmitting;
  const { reset: resetPayment } = payment;

  useEffect(() => {
    if (!open) {
      setEmailInput('');
      setEmailQuery('');
      setSelectedUserId('');
      setSelectedUserEmail('');
      setDropdownOpen(false);
      resetPayment();
    }
  }, [open, resetPayment]);

  useEffect(() => {
    const timer = setTimeout(() => setEmailQuery(emailInput.trim()), 400);

    return () => clearTimeout(timer);
  }, [emailInput]);

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', close);

    return () => document.removeEventListener('mousedown', close);
  }, []);

  const submit = async () => {
    if (await payment.submit()) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={openNext => !submitting && onOpenChange(openNext)}>
      <DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>{t('eventos:admin.registerInstallmentPayment')}</DialogTitle>
          <DialogDescription>{t('eventos:admin.registerInstallmentPaymentHint')}</DialogDescription>
        </DialogHeader>
        <div className='grid gap-4'>
          <div className='grid gap-2' ref={dropdownRef}>
            <Label htmlFor='installment-user'>{t('eventos:admin.installmentUser')}</Label>
            <div className='relative'>
              <LuSearch className='pointer-events-none absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground' />
              <Input
                id='installment-user'
                className='pl-8'
                value={emailInput}
                disabled={submitting}
                placeholder={t('eventos:admin.installmentUserPlaceholder')}
                onChange={event => {
                  setEmailInput(event.target.value);
                  setSelectedUserId('');
                  setSelectedUserEmail('');
                  setDropdownOpen(true);
                }}
                onFocus={() => setDropdownOpen(true)}
              />
              {dropdownOpen && emailQuery.length >= 3 && !selectedUserId ? (
                <div className='absolute z-10 mt-1 max-h-40 w-full overflow-y-auto rounded-md border bg-white shadow'>
                  {usersLoading ? (
                    <SpinnerLoader />
                  ) : (
                    (users?.data ?? []).map(user => (
                      <button
                        key={user.id}
                        type='button'
                        className='block w-full px-3 py-2 text-left text-sm hover:bg-muted'
                        onClick={() => {
                          setSelectedUserId(user.id);
                          setSelectedUserEmail(user.email);
                          setEmailInput(user.email);
                          setDropdownOpen(false);
                        }}
                      >
                        {user.email}
                      </button>
                    ))
                  )}
                </div>
              ) : null}
            </div>
            {selectedUserEmail ? <p className='m-0 text-xs text-muted-foreground'>{selectedUserEmail}</p> : null}
          </div>
          {isQuoteLoading ? <SpinnerLoader /> : null}
          {lines.length > 0 ? (
            <ul className='grid gap-1 text-sm text-muted-foreground'>
              {lines.map(line => (
                <li key={line.sequence}>
                  {t('eventos:admin.installmentQuoteLine', {
                    sequence: line.sequence,
                    amount: formatPrice(Number(line.amount), 'COP'),
                    due: line.due_date,
                    status: statusLabel(line.status, t),
                  })}
                </li>
              ))}
            </ul>
          ) : null}
          {options.length > 0 ? (
            <fieldset className='grid gap-2'>
              {options.map(option => {
                const checked = sameSequences(selected, option.sequences);
                const label =
                  option.sequences.length > 1
                    ? t('eventos:admin.payTotalOption', {
                        amount: formatPrice(Number(option.amount), 'COP'),
                      })
                    : t('eventos:admin.payInstallmentOption', {
                        sequence: option.sequences[0],
                        amount: formatPrice(Number(option.amount), 'COP'),
                      });

                return (
                  <label key={option.sequences.join('-')} className='flex items-center gap-2 text-sm'>
                    <input
                      type='radio'
                      name='admin-installment-option'
                      checked={checked}
                      disabled={submitting}
                      onChange={() => setSelected(option.sequences)}
                    />
                    <span>{label}</span>
                  </label>
                );
              })}
            </fieldset>
          ) : null}
          <div className='grid gap-2'>
            <Label htmlFor='installment-proof'>{t('eventos:admin.installmentProof')}</Label>
            <label className='flex cursor-pointer items-center gap-2 rounded-md border border-dashed p-3 text-sm'>
              <LuUpload className='h-4 w-4' />
              <span>{proof ? proof.name : t('payments:uploadProof')}</span>
              <input
                id='installment-proof'
                type='file'
                className='hidden'
                accept={proofAccept}
                disabled={submitting}
                onChange={event => chooseProof(event.target.files?.[0] ?? null)}
              />
            </label>
            {previewUrl ? <img src={previewUrl} alt='' className='max-h-40 rounded-md object-contain' /> : null}
          </div>
        </div>
        <DialogFooter>
          <Button
            color='primary'
            variant='solid'
            type='button'
            disabled={!payment.canSubmit}
            onClick={() => void submit()}
          >
            {submitting ? t('eventos:admin.saving') : t('eventos:admin.registerInstallmentPayment')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
