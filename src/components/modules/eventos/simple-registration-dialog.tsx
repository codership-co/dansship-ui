import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from 'polpo/components';
import { type ReactNode, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import {
  SIMPLE_PERSON_DEFAULTS,
  SimplePersonFields,
  type SimplePersonValues,
  simplePersonSchema,
} from '@components/forms/simple-person-fields';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@components/ui';

import type { SimplePersonInput } from '@core/api';

/** `exists` keeps the dialog open with `existsNotice`; `failed` is reported by the caller. */
export type SimpleRegistrationOutcome = 'created' | 'exists' | 'failed';

interface SimpleRegistrationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  submitLabel: string;
  termsLabel: string;
  onSubmit: (person: SimplePersonInput) => Promise<SimpleRegistrationOutcome>;
  existsNotice?: ReactNode;
  placeholders?: boolean;
}

export function SimpleRegistrationDialog({
  open,
  onOpenChange,
  title,
  description,
  submitLabel,
  termsLabel,
  onSubmit,
  existsNotice,
  placeholders,
}: SimpleRegistrationDialogProps) {
  const { t } = useTranslation('common');
  const [exists, setExists] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    control,
    handleSubmit,
    reset,
    formState: { isValid },
  } = useForm<SimplePersonValues>({
    resolver: zodResolver(simplePersonSchema),
    mode: 'onChange',
    defaultValues: SIMPLE_PERSON_DEFAULTS,
  });

  const close = (next: boolean) => {
    if (!next) {
      reset(SIMPLE_PERSON_DEFAULTS);
      setExists(false);
    }

    onOpenChange(next);
  };

  const submit = handleSubmit(async values => {
    setIsSubmitting(true);

    try {
      const outcome = await onSubmit({ ...values, phone_country_code: '+57' });

      setExists(outcome === 'exists');

      if (outcome === 'created') {
        close(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  });

  return (
    <Dialog open={open} onOpenChange={next => !isSubmitting && close(next)}>
      <DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <form id='simple-registration-form' className='grid gap-4' onSubmit={event => void submit(event)}>
          <SimplePersonFields
            control={control}
            idPrefix='simple-registration'
            termsLabel={termsLabel}
            placeholders={placeholders}
          />
          {exists ? existsNotice : null}
        </form>
        <DialogFooter>
          <Button color='primary' variant='outlined' type='button' onClick={() => close(false)}>
            {t('cancel')}
          </Button>
          <Button
            color='primary'
            variant='solid'
            type='submit'
            form='simple-registration-form'
            disabled={!isValid || isSubmitting}
            isLoading={isSubmitting}
          >
            {submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
