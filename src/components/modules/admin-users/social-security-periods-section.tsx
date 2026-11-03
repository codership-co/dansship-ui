import { Button } from 'polpo/components';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { Badge, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/ui';
import { DansshipAPI, type SocialSecurityPeriodStatus } from '@core/api';
import { useCallablePromise } from '@hooks';

const MONTHS = Array.from({ length: 12 }, (_, index) => index + 1);

function openUrl(url: string | undefined) {
  if (!url) return;

  window.open(url, '_blank', 'noopener,noreferrer');
}

function currentYearMonth() {
  const [year, month] = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' }).split('-').map(Number);

  return { year, month };
}

export function SocialSecurityPeriodsSection({
  userId,
  periods,
  canManage,
  onChanged,
}: {
  userId: string;
  periods: Array<SocialSecurityPeriodStatus>;
  canManage: boolean;
  onChanged: () => void;
}) {
  const { t } = useTranslation();
  const today = currentYearMonth();
  const [year, setYear] = useState(String(today.year));
  const [month, setMonth] = useState(String(today.month));
  const { call: setRequirement, isLoading: isSaving } = useCallablePromise(
    (periodYear: number, periodMonth: number, required: boolean) =>
      DansshipAPI.instructorPaymentsAdmin.setSocialSecurityRequirement(userId, periodYear, periodMonth, required),
  );
  const { call: getViewUrl, isLoading: isOpening } = useCallablePromise((periodYear: number, periodMonth: number) =>
    DansshipAPI.instructorPaymentsAdmin.getSocialSecurityProofViewUrl(userId, periodYear, periodMonth),
  );

  const handleRequirement = async (periodYear: number, periodMonth: number, required: boolean) => {
    const { ok } = await setRequirement(periodYear, periodMonth, required);

    if (!ok) {
      toast.error(t('admin:users.details.paymentDocuments.socialSecurity.saveFailed'));

      return;
    }

    toast.success(t('admin:users.details.paymentDocuments.socialSecurity.saveSuccess'));
    onChanged();
  };

  const handleView = async (period: SocialSecurityPeriodStatus) => {
    const { ok, data } = await getViewUrl(period.year, period.month);

    if (!ok || !data?.view_url) {
      toast.error(t('admin:users.details.paymentDocuments.viewFailed'));

      return;
    }

    openUrl(data.view_url);
  };

  const statusKey = (period: SocialSecurityPeriodStatus) =>
    !period.required ? 'withdrawn' : period.uploaded ? 'uploaded' : 'pending';

  return (
    <div className='grid gap-4 rounded-md border bg-white/50 p-4'>
      <div className='grid gap-1'>
        <h3 className='text-sm font-semibold'>{t('admin:users.details.paymentDocuments.socialSecurity.title')}</h3>
        <p className='text-sm text-muted-foreground'>{t('admin:users.details.paymentDocuments.socialSecurity.hint')}</p>
      </div>

      {canManage ? (
        <div className='flex flex-wrap items-end gap-3'>
          <div className='grid gap-1.5'>
            <Label>{t('admin:users.details.paymentDocuments.socialSecurity.month')}</Label>
            <Select value={month} onValueChange={setMonth}>
              <SelectTrigger className='w-40'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map(value => (
                  <SelectItem key={value} value={String(value)}>
                    {t(`admin:users.details.paymentDocuments.months.${value}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className='grid gap-1.5'>
            <Label>{t('admin:users.details.paymentDocuments.socialSecurity.year')}</Label>
            <Select value={year} onValueChange={setYear}>
              <SelectTrigger className='w-28'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[today.year, today.year - 1].map(value => (
                  <SelectItem key={value} value={String(value)}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            color='primary'
            variant='solid'
            type='button'
            disabled={isSaving}
            onClick={() => void handleRequirement(Number(year), Number(month), true)}
          >
            {t('admin:users.details.paymentDocuments.socialSecurity.ask')}
          </Button>
        </div>
      ) : null}

      {periods.length ? (
        <ul className='grid gap-2'>
          {periods.map(period => (
            <li
              key={`${period.year}-${period.month}`}
              className='flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2'
            >
              <div className='flex flex-wrap items-center gap-2'>
                <span className='text-sm font-semibold'>
                  {t(`admin:users.details.paymentDocuments.months.${period.month}`)} {period.year}
                </span>
                <Badge variant={period.required && !period.uploaded ? 'outline' : 'outlineNeutral'} size='small'>
                  {t(`admin:users.details.paymentDocuments.socialSecurity.status.${statusKey(period)}`)}
                </Badge>
              </div>
              <div className='flex flex-wrap gap-2'>
                {period.uploaded ? (
                  <Button
                    color='primary'
                    variant='outlined'
                    size='small'
                    type='button'
                    disabled={isOpening}
                    onClick={() => void handleView(period)}
                  >
                    {t('admin:users.details.paymentDocuments.socialSecurity.view')}
                  </Button>
                ) : null}
                {canManage ? (
                  <Button
                    color='primary'
                    variant='outlined'
                    size='small'
                    type='button'
                    disabled={isSaving}
                    onClick={() => void handleRequirement(period.year, period.month, !period.required)}
                  >
                    {period.required
                      ? t('admin:users.details.paymentDocuments.socialSecurity.withdraw')
                      : t('admin:users.details.paymentDocuments.socialSecurity.askAgain')}
                  </Button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className='text-sm text-muted-foreground'>
          {t('admin:users.details.paymentDocuments.socialSecurity.empty')}
        </p>
      )}
    </div>
  );
}
