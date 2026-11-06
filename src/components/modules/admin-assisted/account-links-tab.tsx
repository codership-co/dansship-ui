import { format, parseISO } from 'date-fns';
import { Button } from 'polpo/components';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { apiErrorCode } from './assisted-errors';
import { PersonGate } from './person-gate';

import { Badge, Input } from '@components/ui';
import { useOrPermissions } from '@contexts';
import { type AccountLinkKind, type AccountLinkStatus, DansshipAPI } from '@core/api';
import { PERMISSION } from '@core/permissions';
import { useCallablePromise, useDateLocale, usePromise } from '@hooks';

function LinkRow({ userId, status, onChanged }: { userId: string; status: AccountLinkStatus; onChanged: () => void }) {
  const { t } = useTranslation('assisted');
  const locale = useDateLocale();
  const [shownLink, setShownLink] = useState<string | null>(null);
  const { call: issue, isLoading } = useCallablePromise((kind: AccountLinkKind, delivery: 'copy' | 'email') =>
    DansshipAPI.assistedAdmin.issueLink(userId, kind, delivery),
  );

  const run = async (delivery: 'copy' | 'email') => {
    const { ok, data, error } = await issue(status.kind, delivery);

    if (!ok || !data) {
      toast.error(
        t(`errors.${apiErrorCode(error)}`, {
          defaultValue: t('errors.generic'),
        }),
      );

      return;
    }

    if (delivery === 'email') {
      toast.success(t('links.sent', { email: data.sent_to ?? '' }));
    } else if (data.link) {
      setShownLink(data.link);
      await navigator.clipboard.writeText(data.link).catch(() => undefined);
      toast.success(t('links.copied'));
    }

    onChanged();
  };

  return (
    <div className='grid gap-3 p-4'>
      <div className='flex flex-wrap items-center gap-2'>
        <p className='font-semibold'>{t(`links.kinds.${status.kind}`)}</p>
        <Badge variant={status.active ? 'outline' : 'outlineNeutral'} size='regular'>
          {t(status.active ? 'links.status.active' : 'links.status.inactive')}
        </Badge>
      </div>
      <p className='text-sm text-muted-foreground'>
        {!status.applicable
          ? t(`links.notApplicable.${status.reason_code}`, {
              defaultValue: t('links.notApplicable.generic'),
            })
          : status.active && status.expires_at
            ? t('links.activeUntil', {
                date: format(parseISO(status.expires_at), 'PPp', { locale }),
              })
            : t('links.noActive')}
        {status.token_masked ? ` · ${status.token_masked}` : ''}
      </p>
      {status.applicable ? (
        <div className='flex flex-wrap items-center gap-2'>
          {status.active ? (
            <>
              <Button color='primary' variant='solid' disabled={isLoading} onClick={() => void run('copy')}>
                {t('links.copy')}
              </Button>
              <Button color='primary' variant='outlined' disabled={isLoading} onClick={() => void run('email')}>
                {t('links.resend')}
              </Button>
              <Button color='primary' variant='text' disabled={isLoading} onClick={() => void run('copy')}>
                {t('links.generateNew')}
              </Button>
            </>
          ) : (
            <Button color='primary' variant='solid' disabled={isLoading} onClick={() => void run('copy')}>
              {t('links.generate')}
            </Button>
          )}
        </div>
      ) : null}
      {shownLink ? (
        <div className='grid gap-1'>
          <Input readOnly value={shownLink} onFocus={event => event.target.select()} />
          <p className='text-xs text-muted-foreground'>{t('links.invalidatesPrevious')}</p>
        </div>
      ) : null}
    </div>
  );
}

function LinksList({ userId }: { userId: string }) {
  const { t } = useTranslation('assisted');
  const canInvite = useOrPermissions([PERMISSION.INSTRUCTOR_INVITE]);
  const { response, isLoading, reFetch } = usePromise(() => DansshipAPI.assistedAdmin.listLinks(userId), true, [
    userId,
  ]);
  const statuses = (response?.data ?? []).filter(status => status.kind !== 'instructor_invitation' || canInvite);

  if (isLoading && !response) {
    return <p className='text-sm text-muted-foreground'>{t('common.loading')}</p>;
  }

  return (
    <div className='grid gap-4'>
      <p className='text-sm text-muted-foreground'>{t('links.help')}</p>
      <div className='divide-y divide-border overflow-hidden rounded-xl border border-border'>
        {statuses.map(status => (
          <LinkRow key={status.kind} userId={userId} status={status} onChanged={() => void reFetch()} />
        ))}
      </div>
      <div className='rounded-xl border border-border bg-gray-100 p-4'>
        <p className='font-semibold'>{t('links.keyNote.title')}</p>
        <p className='text-sm text-muted-foreground'>{t('links.keyNote.body')}</p>
      </div>
    </div>
  );
}

export function AccountLinksTab() {
  return <PersonGate>{person => <LinksList key={person.id} userId={person.id} />}</PersonGate>;
}
