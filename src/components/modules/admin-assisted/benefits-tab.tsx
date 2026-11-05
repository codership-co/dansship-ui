import { zodResolver } from '@hookform/resolvers/zod';
import { format, parseISO } from 'date-fns';
import { Button } from 'polpo/components';
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { z } from 'zod';

import { apiErrorCode } from './assisted-errors';
import { PersonGate } from './person-gate';

import { SelectField, TextField, TextareaField } from '@components/form-fields';
import {
  Badge,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Label,
  Textarea,
} from '@components/ui';
import { type AdminBenefitKind, type BenefitGrantItem, DansshipAPI, type PersonSearchResult } from '@core/api';
import { formatPrice } from '@helpers';
import { useCallablePromise, useDateLocale, usePromise } from '@hooks';

const KINDS: Array<AdminBenefitKind> = ['free_class', 'percentage_discount', 'fixed_discount'];

const schema = z
  .object({
    kind: z.enum(['free_class', 'percentage_discount', 'fixed_discount']),
    value: z.string().trim().optional(),
    valid_days: z.string().trim().regex(/^\d+$/),
    reason: z.string().trim().min(1),
  })
  .superRefine((values, ctx) => {
    const amount = Number(values.value);

    if (values.kind === 'percentage_discount' && !(Number.isInteger(amount) && amount >= 1 && amount <= 100)) {
      ctx.addIssue({ code: 'custom', path: ['value'], message: 'invalid' });
    }

    if (values.kind === 'fixed_discount' && !(amount > 0)) {
      ctx.addIssue({ code: 'custom', path: ['value'], message: 'invalid' });
    }

    const days = Number(values.valid_days);

    if (days < 1 || days > 365) {
      ctx.addIssue({
        code: 'custom',
        path: ['valid_days'],
        message: 'invalid',
      });
    }
  });

type FormValues = z.infer<typeof schema>;

function RevokeDialog({
  grant,
  onOpenChange,
  onDone,
}: {
  grant: BenefitGrantItem;
  onOpenChange: (open: boolean) => void;
  onDone: () => void;
}) {
  const { t } = useTranslation('assisted');
  const [reason, setReason] = useState('');
  const { call: revoke, isLoading } = useCallablePromise((text: string) =>
    DansshipAPI.assistedAdmin.revokeBenefit(grant.id, text),
  );

  const submit = async () => {
    const { ok, error } = await revoke(reason.trim());

    if (!ok) {
      toast.error(
        t(`errors.${apiErrorCode(error)}`, {
          defaultValue: t('errors.generic'),
        }),
      );

      return;
    }

    toast.success(t('benefits.revoked'));
    onDone();
    onOpenChange(false);
  };

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('benefits.revokeTitle')}</DialogTitle>
          <DialogDescription>{grant.name}</DialogDescription>
        </DialogHeader>
        <div className='grid gap-2'>
          <Label htmlFor='revoke-reason'>{t('benefits.reason')}</Label>
          <Textarea id='revoke-reason' value={reason} onChange={event => setReason(event.target.value)} />
        </div>
        <DialogFooter>
          <Button color='primary' variant='outlined' type='button' onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          <Button
            color='alert'
            variant='solid'
            type='button'
            disabled={!reason.trim() || isLoading}
            onClick={() => void submit()}
          >
            {t('benefits.revoke')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function BenefitsPanel({ person }: { person: PersonSearchResult }) {
  const { t } = useTranslation('assisted');
  const locale = useDateLocale();
  const { response, reFetch } = usePromise(() => DansshipAPI.assistedAdmin.listBenefits(person.id), true, [person.id]);
  const [revoking, setRevoking] = useState<BenefitGrantItem | null>(null);
  const { control, handleSubmit, reset } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      kind: 'free_class',
      value: '',
      valid_days: '30',
      reason: '',
    },
  });
  const kind = useWatch({ control, name: 'kind' });
  const { call: grant, isLoading } = useCallablePromise((values: FormValues) =>
    DansshipAPI.assistedAdmin.grantBenefit(person.id, {
      kind: values.kind,
      value: values.kind === 'free_class' ? undefined : Number(values.value),
      valid_days: Number(values.valid_days),
      reason: values.reason,
    }),
  );
  const grants = response?.data ?? [];

  const submit = handleSubmit(async values => {
    const { ok, error } = await grant(values);

    if (!ok) {
      toast.error(
        t(`errors.${apiErrorCode(error)}`, {
          defaultValue: t('errors.generic'),
        }),
      );

      return;
    }

    toast.success(t('benefits.granted'));
    reset({ kind: values.kind, value: '', valid_days: '30', reason: '' });
    void reFetch();
  });

  const describe = (item: BenefitGrantItem) => {
    if (item.kind === 'percentage_discount') {
      return `${Number(item.value)}%`;
    }

    if (item.kind === 'fixed_discount') {
      return formatPrice(Number(item.value), 'COP');
    }

    return t('benefits.kinds.free_class');
  };

  return (
    <div className='grid gap-8'>
      <form onSubmit={submit} className='grid max-w-xl gap-4'>
        <p className='text-sm text-muted-foreground'>{t('benefits.help')}</p>
        <SelectField
          control={control}
          name='kind'
          label={t('benefits.kind')}
          options={KINDS.map(option => ({
            value: option,
            label: t(`benefits.kinds.${option}`),
          }))}
        />
        {kind !== 'free_class' ? (
          <TextField
            control={control}
            name='value'
            inputMode='decimal'
            label={kind === 'percentage_discount' ? t('benefits.percentage') : t('benefits.amount')}
          />
        ) : null}
        <TextField control={control} name='valid_days' inputMode='numeric' label={t('benefits.validDays')} />
        <TextareaField control={control} name='reason' label={t('benefits.reason')} />
        <div>
          <Button type='submit' color='primary' variant='solid' disabled={isLoading}>
            {t('benefits.grant')}
          </Button>
        </div>
      </form>
      <section className='grid gap-3'>
        <h2 className='text-lg font-semibold'>{t('benefits.listTitle', { name: person.full_name })}</h2>
        {grants.length === 0 ? <p className='text-sm text-muted-foreground'>{t('benefits.empty')}</p> : null}
        <ul className='grid gap-2'>
          {grants.map(item => (
            <li key={item.id} className='flex flex-wrap items-center justify-between gap-2 rounded-md border p-3'>
              <div className='grid gap-1'>
                <span className='font-medium'>
                  {item.name} · {describe(item)}
                </span>
                <span className='text-sm text-muted-foreground'>
                  {t(`benefits.status.${item.status}`, {
                    defaultValue: item.status,
                  })}
                  {item.expires_at
                    ? ` · ${t('benefits.expires', { date: format(parseISO(item.expires_at), 'PP', { locale }) })}`
                    : ''}
                </span>
                {item.reason ? <span className='text-xs text-muted-foreground'>{item.reason}</span> : null}
                <Badge variant='outline' size='small'>
                  {t(`benefits.source.${item.source}`)}
                </Badge>
              </div>
              {item.can_revoke ? (
                <Button color='alert' variant='text' size='small' onClick={() => setRevoking(item)}>
                  {t('benefits.revoke')}
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      </section>
      {revoking ? (
        <RevokeDialog
          grant={revoking}
          onOpenChange={open => !open && setRevoking(null)}
          onDone={() => void reFetch()}
        />
      ) : null}
    </div>
  );
}

export function BenefitsTab() {
  return <PersonGate>{person => <BenefitsPanel key={person.id} person={person} />}</PersonGate>;
}
