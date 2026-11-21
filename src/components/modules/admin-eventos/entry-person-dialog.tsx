import { Button } from 'polpo/components';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

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
import { DansshipAPI, participationErrorMessage, type ParticipationPersonRow } from '@core/api';

interface EntryPersonDialogProps {
  person: ParticipationPersonRow | null;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

/**
 * "Editar" a ticket (name, email), "Reenviar QR" and "Anular entrada". A new email replaces the
 * QR and link; voiding frees the seat (asked twice, no money moves).
 */
export function EntryPersonDialog({ person, onOpenChange, onSaved }: EntryPersonDialogProps) {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [resending, setResending] = useState(false);
  const [confirmVoid, setConfirmVoid] = useState(false);
  const [voiding, setVoiding] = useState(false);

  useEffect(() => {
    setName(person?.full_name ?? '');
    setEmail(person?.email ?? '');
    setConfirmVoid(false);
  }, [person]);

  if (!person) {
    return null;
  }

  const emailEditable = !person.is_minor && person.role !== 'holder';
  const voidable = person.role === 'ticket' && !person.entered_at;

  const voidTicket = async () => {
    setVoiding(true);
    try {
      const { ok, error } = await DansshipAPI.entry.voidEntry(person.person_id);

      if (ok) {
        toast.success(t('eventos:participation.editPerson.voided'));
        onSaved();
        onOpenChange(false);
      } else {
        toast.error(participationErrorMessage(error, t, 'eventos:participation.editPerson.voidFailed'));
      }
    } finally {
      setVoiding(false);
    }
  };

  const save = async () => {
    const payload: { full_name?: string; email?: string } = {};

    if (name.trim() && name.trim() !== person.full_name) payload.full_name = name.trim();

    if (emailEditable && email.trim() && email.trim().toLowerCase() !== (person.email ?? '').toLowerCase()) {
      payload.email = email.trim();
    }

    if (Object.keys(payload).length === 0) {
      onOpenChange(false);

      return;
    }

    setSaving(true);
    try {
      const { ok, error } = await DansshipAPI.entry.updatePerson(person.person_id, payload);

      if (ok) {
        toast.success(t('eventos:participation.editPerson.saved'));
        onSaved();
        onOpenChange(false);
      } else {
        toast.error(participationErrorMessage(error, t, 'eventos:participation.editPerson.failed'));
      }
    } finally {
      setSaving(false);
    }
  };

  const resend = async () => {
    setResending(true);
    try {
      const { ok, error } = await DansshipAPI.entry.resendEntry(person.person_id);

      if (ok) {
        toast.success(t('eventos:participation.people.resendDone'));
        onSaved();
      } else {
        toast.error(participationErrorMessage(error, t, 'eventos:participation.people.resendFailed'));
      }
    } finally {
      setResending(false);
    }
  };

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>{t('eventos:participation.editPerson.title')}</DialogTitle>
          <DialogDescription>{t('eventos:participation.editPerson.hint')}</DialogDescription>
        </DialogHeader>
        <div className='grid gap-3'>
          <div className='grid gap-1'>
            <Label htmlFor='entry-person-name'>{t('eventos:participation.editPerson.name')}</Label>
            <Input
              id='entry-person-name'
              value={name}
              maxLength={150}
              onChange={change => setName(change.target.value)}
            />
          </div>
          {emailEditable ? (
            <div className='grid gap-1'>
              <Label htmlFor='entry-person-email'>{t('eventos:participation.editPerson.email')}</Label>
              <Input
                id='entry-person-email'
                type='email'
                value={email}
                maxLength={255}
                onChange={change => setEmail(change.target.value)}
              />
            </div>
          ) : null}
        </div>
        {voidable && confirmVoid ? (
          <div className='grid gap-2 rounded-xl border border-alert-300 bg-alert-50 p-3' role='alert'>
            <p className='m-0 font-semibold'>{t('eventos:participation.editPerson.voidConfirmTitle')}</p>
            <p className='m-0 text-sm'>{t('eventos:participation.editPerson.voidConfirmHint')}</p>
            <div className='flex flex-wrap justify-end gap-2'>
              <Button type='button' variant='text' color='primary' onClick={() => setConfirmVoid(false)}>
                {t('eventos:participation.editPerson.voidKeep')}
              </Button>
              <Button type='button' color='alert' isLoading={voiding} onClick={() => void voidTicket()}>
                {t('eventos:participation.editPerson.voidConfirm')}
              </Button>
            </div>
          </div>
        ) : null}
        <DialogFooter className='flex-wrap gap-2'>
          {voidable && !confirmVoid ? (
            <Button
              type='button'
              variant='text'
              color='alert'
              className='sm:mr-auto'
              onClick={() => setConfirmVoid(true)}
            >
              {t('eventos:participation.editPerson.void')}
            </Button>
          ) : null}
          {person.has_entry_pass ? (
            <Button
              type='button'
              variant='outlined'
              color='primary'
              isLoading={resending}
              onClick={() => void resend()}
            >
              {t('eventos:participation.people.resendQr')}
            </Button>
          ) : null}
          <Button type='button' variant='text' color='primary' onClick={() => onOpenChange(false)}>
            {t('eventos:participation.editPerson.cancel')}
          </Button>
          <Button type='button' color='primary' isLoading={saving} onClick={() => void save()}>
            {t('eventos:participation.editPerson.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
