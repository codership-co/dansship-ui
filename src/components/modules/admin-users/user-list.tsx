import { Button, SmartTable } from 'polpo/components';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { LuSearch } from 'react-icons/lu';
import { Link } from 'react-router';

import { EmailField } from '@components/form-fields';
import { SpinnerLoader } from '@components/loaders';
import { DansshipAPI } from '@core/api';
import { PageURLS } from '@core/constants';
import { useCallablePromise } from '@hooks';

type UserSearchForm = {
  email: string;
};

export function UserList() {
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const { t } = useTranslation();
  const { control, watch } = useForm<UserSearchForm>({
    defaultValues: { email: '' },
  });
  const searchInput = watch('email');

  const {
    response: usersResponse,
    isLoading,
    call: fetchUsers,
  } = useCallablePromise((email?: string) => DansshipAPI.usersAdmin.search(email ? { email } : undefined));

  useEffect(() => {
    const shouldSearchByEmail = debouncedSearch?.length > 2;

    void fetchUsers(shouldSearchByEmail ? debouncedSearch : undefined);
  }, [debouncedSearch, fetchUsers]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
    }, 1000);

    return () => clearTimeout(timer);
  }, [searchInput]);
  const users = usersResponse?.data ?? [];

  return (
    <section className='grid gap-6'>
      <div className='flex items-center justify-between gap-3'>
        <EmailField
          id='user-search-email'
          name='email'
          control={control}
          label={t('admin:users.searchLabel')}
          placeholder={t('admin:users.searchPlaceholder')}
          isLoading={isLoading}
          icon={<LuSearch className='h-5 w-5 text-gray-400' />}
        />

        <p className='text-sm text-muted-foreground'>{t('admin:users.total', { count: users?.length ?? 0 })}</p>
      </div>

      {isLoading ? (
        <div className='grid place-content-center rounded-3xl bg-white/50 px-8 py-16 text-center'>
          <SpinnerLoader message={t('admin:users.loading')} />
        </div>
      ) : !users?.length ? (
        <section className='grid place-content-center rounded-3xl bg-white/50 px-8 py-16 text-center'>
          <p>{t(debouncedSearch?.length ? 'admin:users.noUsersFound' : 'admin:users.empty')}</p>
        </section>
      ) : (
        <section className='grid gap-4'>
          <SmartTable
            rowId='id'
            data={users}
            className='rounded-3xl'
            tableClassName='bg-white/50'
            columns={[
              {
                header: t('admin:users.columns.fullName'),
                render: row => <label>{row.full_name}</label>,
                sortBy: 'full_name',
              },
              {
                header: t('common:email'),
                render: row => <label>{row.email}</label>,
                sortBy: 'email',
              },
              {
                header: t('admin:users.columns.profileCompleted'),
                render: row => <label>{row.onboarding_completed ? 'Si' : 'No'}</label>,
              },
              {
                header: '',
                render: row => (
                  <Link to={PageURLS.admin.userDetails(row.id)} viewTransition>
                    <Button color='primary' size='small' variant='flat' className='whitespace-nowrap'>
                      {t('admin:users.viewUser')}
                    </Button>
                  </Link>
                ),
              },
            ]}
          />
        </section>
      )}
    </section>
  );
}
