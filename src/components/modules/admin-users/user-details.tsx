import { Button } from 'polpo/components';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { SpinnerLoader } from '@components/loaders';
import { type AdminUserDetailsResponse } from '@core/api';
import { PageURLS } from '@core/constants';
import { formatDate } from '@helpers';

interface UserDetailsProps {
  user?: AdminUserDetailsResponse | null;
  isLoading: boolean;
  hasError: boolean;
}

export function UserDetails({ user, isLoading, hasError }: UserDetailsProps) {
  const { t, i18n } = useTranslation();

  if (isLoading) {
    return (
      <div className='grid place-content-center rounded-3xl bg-white/50 px-8 py-16 text-center'>
        <SpinnerLoader message={t('admin:users.details.loading')} />
      </div>
    );
  }

  if (hasError || !user) {
    return (
      <section className='grid gap-4 place-content-center rounded-3xl bg-white/50 px-8 py-16 text-center'>
        <p>{t('admin:users.details.notFound')}</p>
        <Link to={PageURLS.admin.users} viewTransition>
          <Button color='primary' size='small' variant='flat'>
            {t('admin:users.details.backToList')}
          </Button>
        </Link>
      </section>
    );
  }

  return (
    <section className='grid gap-6'>
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <div>
          <h4 className='text-primary'>{user.email}</h4>
          <p className='mt-1 font-mono text-sm text-muted-foreground'>{user.id}</p>
        </div>

        <Link to={PageURLS.admin.users} viewTransition>
          <Button color='primary' size='small' variant='flat'>
            {t('admin:users.details.backToList')}
          </Button>
        </Link>
      </div>

      <dl className='grid gap-6 rounded-[calc(var(--radius)+4px)] bg-background-paper p-5 sm:grid-cols-2'>
        <div>
          <dt className='text-xs uppercase tracking-[0.06em] text-muted-foreground'>
            {t('admin:users.columns.fullName')}
          </dt>
          <dd className='mt-1 text-sm font-medium text-foreground'>{user.full_name}</dd>
        </div>

        <div>
          <dt className='text-xs uppercase tracking-[0.06em] text-muted-foreground'>
            {t('admin:users.details.alias')}
          </dt>
          <dd className='mt-1 font-mono text-sm text-foreground'>{user.display_name}</dd>
        </div>

        <div>
          <dt className='text-xs uppercase tracking-[0.06em] text-muted-foreground'>
            {t('admin:users.details.birthDate')}
          </dt>
          <dd className='mt-1 text-sm text-foreground'>
            {user.birth_date ? formatDate(user.birth_date, i18n.language) : '-'}
          </dd>
        </div>

        <div className='sm:col-span-2'>
          <dt className='text-xs uppercase tracking-[0.06em] text-muted-foreground'>
            {t('admin:users.columns.roles')}
          </dt>
          <dd className='mt-2 flex flex-wrap gap-2'>
            {user.roles.length > 0 ? (
              user.roles.map(role => (
                <span
                  key={role}
                  className='rounded-(--radius) bg-[hsl(var(--surface-container-highest))] px-2 py-1 text-sm text-foreground'
                >
                  {role}
                </span>
              ))
            ) : (
              <span className='text-sm text-muted-foreground'>{t('admin:users.noRoles')}</span>
            )}
          </dd>
        </div>
      </dl>
    </section>
  );
}
