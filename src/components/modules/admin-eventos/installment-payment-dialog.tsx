import { Button } from 'polpo/components';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LuSearch, LuUpload } from 'react-icons/lu';
import { toast } from 'sonner';

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
import { DansshipAPI, DansshipAPIError, INSTALLMENT_PROOF_CONTENT_TYPES, type InstallmentQuoteLine } from '@core/api';
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
  const [selected, setSelected] = useState<Array<number>>([]);
  const [proof, setProof] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [idempotencyKey, setIdempotencyKey] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { response: users, isLoading: usersLoading } = usePromise(
    () => DansshipAPI.bookingsAdmin.searchUsers(emailQuery),
    open && emailQuery.length >= 3 && !selectedUserId,
    [emailQuery, open, selectedUserId],
  );
  const { response: quote, isLoading: quoteLoading } = usePromise(
    () => DansshipAPI.eventosAdmin.quoteInstallments(eventId, selectedUserId),
    open && Boolean(selectedUserId),
    [eventId, selectedUserId, open],
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    setIdempotencyKey(crypto.randomUUID());
  }, [open]);

  useEffect(() => {
    if (!open) {
      setEmailInput('');
      setEmailQuery('');
      setSelectedUserId('');
      setSelectedUserEmail('');
      setDropdownOpen(false);
      setSelected([]);
      setProof(null);
      setPreviewUrl(null);
      setSubmitting(false);
    }
  }, [open]);

  useEffect(() => {
    const timer = setTimeout(() => setEmailQuery(emailInput.trim()), 400);

    return () => clearTimeout(timer);
  }, [emailInput]);

  useEffect(() => {
    setSelected(quote?.data?.default_sequences ?? []);
  }, [quote?.data]);

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', close);

    return () => document.removeEventListener('mousedown', close);
  }, []);

  const lines = quote?.data?.lines ?? [];
  const canSubmit = Boolean(selectedUserId && proof && selected.length > 0 && !submitting);

  const proofAccept = useMemo(() => INSTALLMENT_PROOF_CONTENT_TYPES.join(','), []);

  const toggle = (line: InstallmentQuoteLine) => {
    if (!line.selectable || submitting) {
      return;
    }

    setSelected(current =>
      current.includes(line.sequence)
        ? current.filter(sequence => sequence !== line.sequence)
        : [...current, line.sequence],
    );
  };

  const chooseProof = (file: File | null) => {
    if (!file) {
      return;
    }

    if (!INSTALLMENT_PROOF_CONTENT_TYPES.includes(file.type as (typeof INSTALLMENT_PROOF_CONTENT_TYPES)[number])) {
      toast.error(t('payments:proofInvalidTypeDesc'));

      return;
    }

    setProof(file);
    setPreviewUrl(file.type.startsWith('image/') ? URL.createObjectURL(file) : null);
  };

  const submit = async () => {
    if (!proof || !selectedUserId || selected.length === 0) {
      return;
    }

    setSubmitting(true);

    try {
      const uploaded = await DansshipAPI.eventosAdmin.uploadInstallmentProof(proof);

      if (!uploaded.data?.file_key) {
        const code = uploaded.error instanceof DansshipAPIError ? uploaded.error.body.error_code : '';
        toast.error(code || t('eventos:admin.installmentPaymentFailed'));

        return;
      }

      const confirmed = await DansshipAPI.eventosAdmin.confirmInstallmentPayment(eventId, {
        user_id: selectedUserId,
        sequences: [...selected].sort((left, right) => left - right),
        proof_key: uploaded.data.file_key,
        idempotency_key: idempotencyKey,
      });

      if (!confirmed.ok) {
        const code = confirmed.error instanceof DansshipAPIError ? confirmed.error.body.error_code : '';
        toast.error(code || t('eventos:admin.installmentPaymentFailed'));

        return;
      }

      toast.success(t('eventos:admin.installmentPaymentSaved'));
      onOpenChange(false);
      onRegistered();
    } catch (error) {
      const code = error instanceof DansshipAPIError ? error.body.error_code : '';
      toast.error(code || t('eventos:admin.installmentPaymentFailed'));
    } finally {
      setSubmitting(false);
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
          {quoteLoading ? <SpinnerLoader /> : null}
          {lines.length > 0 ? (
            <ul className='grid gap-2'>
              {lines.map(line => (
                <li key={line.sequence}>
                  <label className='flex items-start gap-2 text-sm'>
                    <input
                      type='checkbox'
                      className='mt-1'
                      checked={selected.includes(line.sequence)}
                      disabled={!line.selectable || submitting}
                      onChange={() => toggle(line)}
                    />
                    <span>
                      {t('eventos:admin.installmentQuoteLine', {
                        sequence: line.sequence,
                        amount: formatPrice(Number(line.amount), 'COP'),
                        due: line.due_date,
                        status: statusLabel(line.status, t),
                      })}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
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
          <Button color='primary' variant='solid' type='button' disabled={!canSubmit} onClick={() => void submit()}>
            {submitting ? t('eventos:admin.saving') : t('eventos:admin.registerInstallmentPayment')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
